import { db } from "@/db";
import {
  matchups, matchupParticipants, entityVariants, entities, categories,
  votes, anonymousVotes, attributes, entityStats, communityEntityStats,
  voteAttributes, matchupComments, entityComments, commentVotes, users,
  pointTransactions, analyticsEvents, notifications,
} from "@/db/schema";
import { eq, desc, asc, sql, count, and, isNull, isNotNull, ilike, inArray, or } from "drizzle-orm";
import { getRankFromXp } from "@/lib/ranks";
import { getAdminSettings } from "@/lib/points";
import { redis } from "@/lib/redis";

async function withCache<T>(key: string, ttl: number, fn: () => Promise<T>): Promise<T> {
  try {
    const hit = await redis.get(key);
    if (hit) return JSON.parse(hit) as T;
  } catch { /* redis down — fall through */ }
  const result = await fn();
  try { await redis.set(key, JSON.stringify(result), "EX", ttl); } catch { /* best-effort */ }
  return result;
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type Participant = {
  id: string;
  side: "a" | "b";
  sortOrder: number;
  variant: { id: string; name: string; slug: string; imageUrl: string | null };
  entity:  { id: string; name: string; slug: string; imageUrl: string | null };
  series:  { id: string; name: string; slug: string };
};

export type MatchupCard = {
  id: string;
  slug: string;
  sideALabel: string | null;
  sideBLabel: string | null;
  createdAt: Date | string;
  sideA: Participant[];
  sideB: Participant[];
  votes: { total: number; aVotes: number; bVotes: number; drawVotes: number };
};

export type VoteSummary = {
  total: number;
  aVotes: number;
  bVotes: number;
  drawVotes: number;
  aPercent: number;
  bPercent: number;
  drawPercent: number;
  settled: boolean;
  contested: boolean;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function deriveSideLabel(label: string | null, participants: Participant[]): string {
  if (label) return label;
  // For titles/breadcrumbs use entity name, not variant name
  return participants.map((p) => p.entity.name).join(" & ") || "TBD";
}

export async function getUserVoteAttributes(
  userId: string,
  matchupId: string,
): Promise<Record<string, number>> {
  const rows = await db
    .select({ slug: attributes.slug, scoreA: voteAttributes.scoreA })
    .from(voteAttributes)
    .innerJoin(attributes, eq(voteAttributes.attributeId, attributes.id))
    .where(and(eq(voteAttributes.userId, userId), eq(voteAttributes.matchupId, matchupId)));

  return Object.fromEntries(rows.map((r) => [r.slug, r.scoreA]));
}

async function fetchParticipants(matchupId: string): Promise<Participant[]> {
  return db
    .select({
      id:           matchupParticipants.id,
      side:         matchupParticipants.side,
      sortOrder:    matchupParticipants.sortOrder,
      variantId:    entityVariants.id,
      variantName:  entityVariants.name,
      variantSlug:  entityVariants.slug,
      variantImage: entityVariants.imageUrl,
      entityId:     entities.id,
      entityName:   entities.name,
      entitySlug:   entities.slug,
      entityImage:  entities.imageUrl,
      seriesId:     categories.id,
      seriesName:   categories.name,
      seriesSlug:   categories.slug,
    })
    .from(matchupParticipants)
    .innerJoin(entityVariants, eq(matchupParticipants.variantId, entityVariants.id))
    .innerJoin(entities,       eq(entityVariants.entityId, entities.id))
    .innerJoin(categories,     eq(entities.categoryId, categories.id))
    .where(eq(matchupParticipants.matchupId, matchupId))
    .orderBy(asc(matchupParticipants.side), asc(matchupParticipants.sortOrder))
    .then((rows) =>
      rows.map((r) => ({
        id: r.id,
        side: r.side as "a" | "b",
        sortOrder: r.sortOrder,
        variant: { id: r.variantId, name: r.variantName, slug: r.variantSlug, imageUrl: r.variantImage },
        entity:  { id: r.entityId,  name: r.entityName,  slug: r.entitySlug,  imageUrl: r.entityImage  },
        series:  { id: r.seriesId,  name: r.seriesName,  slug: r.seriesSlug  },
      }))
    );
}

export function computeVoteSummary(
  aVotes: number,
  bVotes: number,
  drawVotes: number
): VoteSummary {
  const total = aVotes + bVotes + drawVotes;
  const aPercent  = total > 0 ? Math.round((aVotes  / total) * 100) : 0;
  const bPercent  = total > 0 ? Math.round((bVotes  / total) * 100) : 0;
  const drawPercent = total > 0 ? 100 - aPercent - bPercent : 0;
  const leading = Math.max(aPercent, bPercent);
  return {
    total, aVotes, bVotes, drawVotes,
    aPercent, bPercent, drawPercent,
    settled:   total > 0 && leading >= 75,
    contested: total > 0 && leading < 60,
  };
}

// ---------------------------------------------------------------------------
// Platform stats
// ---------------------------------------------------------------------------

export async function getPlatformStats() {
  const [[regVotes], [anonVotes], [battleCount], [charCount]] = await Promise.all([
    db.select({ c: count() }).from(votes),
    db.select({ c: count() }).from(anonymousVotes),
    db.select({ c: count() }).from(matchups),
    db.select({ c: count() }).from(entities).where(eq(entities.status, "approved")),
  ]);
  return {
    predictions: Number(regVotes.c) + Number(anonVotes.c),
    battles:     Number(battleCount.c),
    characters:  Number(charCount.c),
  };
}

// ---------------------------------------------------------------------------
// Matchups
// ---------------------------------------------------------------------------

async function attachParticipantsAndVotes(
  rows: (typeof matchups.$inferSelect)[]
): Promise<MatchupCard[]> {
  if (rows.length === 0) return [];

  const ids = rows.map((r) => r.id);

  // Fetch all participants for these matchups in one query
  const allParticipants: (Participant & { matchupId: string })[] = await db
    .select({
      matchupId:    matchupParticipants.matchupId,
      id:           matchupParticipants.id,
      side:         matchupParticipants.side,
      sortOrder:    matchupParticipants.sortOrder,
      variantId:    entityVariants.id,
      variantName:  entityVariants.name,
      variantSlug:  entityVariants.slug,
      variantImage: entityVariants.imageUrl,
      entityId:     entities.id,
      entityName:   entities.name,
      entitySlug:   entities.slug,
      entityImage:  entities.imageUrl,
      seriesId:     categories.id,
      seriesName:   categories.name,
      seriesSlug:   categories.slug,
    })
    .from(matchupParticipants)
    .innerJoin(entityVariants, eq(matchupParticipants.variantId, entityVariants.id))
    .innerJoin(entities,       eq(entityVariants.entityId, entities.id))
    .innerJoin(categories,     eq(entities.categoryId, categories.id))
    .where(sql`${matchupParticipants.matchupId} = ANY(ARRAY[${sql.join(ids.map(id => sql`${id}::uuid`), sql`, `)}])`)
    .orderBy(asc(matchupParticipants.side), asc(matchupParticipants.sortOrder))
    .then((rs) =>
      rs.map((r) => ({
        matchupId: r.matchupId,
        id: r.id, side: r.side as "a" | "b", sortOrder: r.sortOrder,
        variant: { id: r.variantId, name: r.variantName, slug: r.variantSlug, imageUrl: r.variantImage },
        entity:  { id: r.entityId,  name: r.entityName,  slug: r.entitySlug,  imageUrl: r.entityImage  },
        series:  { id: r.seriesId,  name: r.seriesName,  slug: r.seriesSlug  },
      }))
    );

  // Fetch vote counts for all matchup IDs
  const voteCounts = await db
    .select({ matchupId: votes.matchupId, verdict: votes.verdict, c: count() })
    .from(votes)
    .where(sql`${votes.matchupId} = ANY(ARRAY[${sql.join(ids.map(id => sql`${id}::uuid`), sql`, `)}])`)
    .groupBy(votes.matchupId, votes.verdict);

  return rows.map((m) => {
    const ps = allParticipants.filter((p) => p.matchupId === m.id);
    const vc = voteCounts.filter((v) => v.matchupId === m.id);
    const a  = Number(vc.find((v) => v.verdict === "a")?.c  ?? 0);
    const b  = Number(vc.find((v) => v.verdict === "b")?.c  ?? 0);
    const d  = Number(vc.find((v) => v.verdict === "draw")?.c ?? 0);
    return {
      id: m.id, slug: m.slug,
      sideALabel: m.sideALabel, sideBLabel: m.sideBLabel,
      createdAt: m.createdAt,
      sideA: ps.filter((p) => p.side === "a"),
      sideB: ps.filter((p) => p.side === "b"),
      votes: { total: a + b + d, aVotes: a, bVotes: b, drawVotes: d },
    };
  });
}

export async function getTrendingMatchups(limit = 10): Promise<MatchupCard[]> {
  // Order by total vote count descending
  const rows = await db
    .select({ m: matchups, voteCount: count(votes.id) })
    .from(matchups)
    .leftJoin(votes, eq(votes.matchupId, matchups.id))
    .groupBy(matchups.id)
    .orderBy(desc(count(votes.id)), desc(matchups.createdAt))
    .limit(limit)
    .then((rs) => rs.map((r) => r.m));
  return attachParticipantsAndVotes(rows);
}

export async function getAllMatchups(opts: {
  limit?: number;
  offset?: number;
  sort?: "votes" | "recent" | "controversial";
  categoryId?: string;
} = {}): Promise<MatchupCard[]> {
  const { limit = 20, offset = 0, sort = "votes" } = opts;
  return withCache(`awb:matchups:${sort}:${limit}:${offset}`, 60, () => _getAllMatchups(sort, limit, offset));
}

async function _getAllMatchups(
  sort: "votes" | "recent" | "controversial",
  limit: number,
  offset: number,
): Promise<MatchupCard[]> {
  const orderCols =
    sort === "recent"
      ? [desc(matchups.createdAt)]
      : sort === "controversial"
      ? [
          asc(sql`ABS(SUM(CASE WHEN ${votes.verdict} = 'a' THEN 1 ELSE 0 END) - SUM(CASE WHEN ${votes.verdict} = 'b' THEN 1 ELSE 0 END))`),
          desc(count(votes.id)),
        ]
      : [desc(count(votes.id))];

  const rows = await db
    .select({ m: matchups, voteCount: count(votes.id) })
    .from(matchups)
    .leftJoin(votes, eq(votes.matchupId, matchups.id))
    .groupBy(matchups.id)
    .orderBy(...orderCols)
    .limit(limit)
    .offset(offset)
    .then((rs) => rs.map((r) => r.m));
  return attachParticipantsAndVotes(rows);
}

export async function getMatchupBySlug(slug: string): Promise<
  (MatchupCard & { matchup: typeof matchups.$inferSelect; voteSummary: VoteSummary; creatorUsername: string | null; creatorRole: string | null }) | null
> {
  const [row] = await db
    .select({
      matchup:         matchups,
      creatorUsername: users.username,
      creatorRole:     users.role,
    })
    .from(matchups)
    .leftJoin(users, eq(matchups.createdBy, users.id))
    .where(eq(matchups.slug, slug))
    .limit(1);
  if (!row) return null;
  const { matchup, creatorUsername, creatorRole } = row;

  const [participants, voteCounts] = await Promise.all([
    fetchParticipants(matchup.id),
    db
      .select({ verdict: votes.verdict, c: count() })
      .from(votes)
      .where(eq(votes.matchupId, matchup.id))
      .groupBy(votes.verdict),
  ]);

  const a = Number(voteCounts.find((v) => v.verdict === "a")?.c  ?? 0);
  const b = Number(voteCounts.find((v) => v.verdict === "b")?.c  ?? 0);
  const d = Number(voteCounts.find((v) => v.verdict === "draw")?.c ?? 0);

  return {
    matchup,
    id: matchup.id, slug: matchup.slug,
    sideALabel: matchup.sideALabel, sideBLabel: matchup.sideBLabel,
    createdAt: matchup.createdAt,
    sideA: participants.filter((p) => p.side === "a"),
    sideB: participants.filter((p) => p.side === "b"),
    votes: { total: a + b + d, aVotes: a, bVotes: b, drawVotes: d },
    voteSummary: computeVoteSummary(a, b, d),
    creatorUsername, creatorRole,
  };
}

// ---------------------------------------------------------------------------
// Categories / Series
// ---------------------------------------------------------------------------

export async function getTopLevelCategories() {
  return db
    .select()
    .from(categories)
    .where(isNull(categories.parentId))
    .orderBy(asc(categories.name));
}

export async function getAnimeSeries(opts: { limit?: number; offset?: number } = {}) {
  const { limit = 1000, offset = 0 } = opts;
  const [anime] = await db
    .select()
    .from(categories)
    .where(and(isNull(categories.parentId), eq(categories.slug, "anime")))
    .limit(1);
  if (!anime) return [];
  return db
    .select()
    .from(categories)
    .where(eq(categories.parentId, anime.id))
    .orderBy(asc(categories.name))
    .limit(limit)
    .offset(offset);
}

export async function getAnimeSeriesCount(): Promise<number> {
  const [anime] = await db
    .select({ id: categories.id })
    .from(categories)
    .where(and(isNull(categories.parentId), eq(categories.slug, "anime")))
    .limit(1);
  if (!anime) return 0;
  const [{ c }] = await db
    .select({ c: count() })
    .from(categories)
    .where(eq(categories.parentId, anime.id));
  return Number(c);
}

export async function getEntitiesCount(opts: { categoryId?: string } = {}): Promise<number> {
  const [{ c }] = await db
    .select({ c: count() })
    .from(entities)
    .where(and(
      eq(entities.status, "approved"),
      opts.categoryId ? eq(entities.categoryId, opts.categoryId) : undefined,
    ));
  return Number(c);
}

export async function getCategoryBySlug(slug: string) {
  const [cat] = await db
    .select({
      id:           categories.id,
      parentId:     categories.parentId,
      name:         categories.name,
      slug:         categories.slug,
      description:  categories.description,
      coverImage:   categories.coverImage,
      entityLabel:  categories.entityLabel,
      matchupLabel: categories.matchupLabel,
      createdAt:    categories.createdAt,
      creatorUsername: users.username,
      creatorRole:     users.role,
    })
    .from(categories)
    .leftJoin(users, eq(categories.createdBy, users.id))
    .where(eq(categories.slug, slug))
    .limit(1);
  return cat ?? null;
}

// ---------------------------------------------------------------------------
// Entities / Characters
// ---------------------------------------------------------------------------

export async function getRecentEntities(limit = 8) {
  return db
    .select({
      id:       entities.id,
      name:     entities.name,
      slug:     entities.slug,
      imageUrl: entities.imageUrl,
      series:   { id: categories.id, name: categories.name, slug: categories.slug },
    })
    .from(entities)
    .innerJoin(categories, eq(entities.categoryId, categories.id))
    .where(eq(entities.status, "approved"))
    .orderBy(desc(entities.createdAt))
    .limit(limit);
}

export async function getAllEntities(opts: {
  categoryId?: string;
  limit?: number;
  offset?: number;
} = {}) {
  const { limit = 24, offset = 0 } = opts;
  return db
    .select({
      id:       entities.id,
      name:     entities.name,
      slug:     entities.slug,
      imageUrl: entities.imageUrl,
      series:   { id: categories.id, name: categories.name, slug: categories.slug },
    })
    .from(entities)
    .innerJoin(categories, eq(entities.categoryId, categories.id))
    .where(eq(entities.status, "approved"))
    .orderBy(asc(entities.name))
    .limit(limit)
    .offset(offset);
}

export async function getEntityBySlug(slug: string) {
  const [entity] = await db
    .select({
      id:             entities.id,
      name:           entities.name,
      slug:           entities.slug,
      bio:            entities.bio,
      imageUrl:       entities.imageUrl,
      imageSourceUrl: entities.imageSourceUrl,
      status:         entities.status,
      series: {
        id:   categories.id,
        name: categories.name,
        slug: categories.slug,
      },
      creatorUsername: users.username,
      creatorRole:     users.role,
    })
    .from(entities)
    .innerJoin(categories, eq(entities.categoryId, categories.id))
    .leftJoin(users, eq(entities.createdBy, users.id))
    .where(eq(entities.slug, slug))
    .limit(1);

  if (!entity) return null;

  const variants = await db
    .select()
    .from(entityVariants)
    .where(eq(entityVariants.entityId, entity.id))
    .orderBy(desc(entityVariants.isDefault), asc(entityVariants.name));

  // Battle record: side-aware W/L/D. Entity on side A wins when verdict='a', loses when verdict='b'.
  const battleRaw = await db.execute(sql`
    SELECT
      CASE
        WHEN (mp.side = 'a' AND v.verdict = 'a') OR (mp.side = 'b' AND v.verdict = 'b') THEN 'win'
        WHEN v.verdict = 'draw' THEN 'draw'
        ELSE 'loss'
      END AS outcome,
      COUNT(*) AS c
    FROM matchup_participants mp
    INNER JOIN entity_variants ev ON mp.variant_id = ev.id
    INNER JOIN votes v ON v.matchup_id = mp.matchup_id
    WHERE ev.entity_id = ${entity.id}
    GROUP BY 1
  `);
  const battleRows = battleRaw as unknown as any[];
  const wins   = Number(battleRows.find((r) => r.outcome === "win")?.c  ?? 0);
  const losses = Number(battleRows.find((r) => r.outcome === "loss")?.c ?? 0);
  const draws  = Number(battleRows.find((r) => r.outcome === "draw")?.c ?? 0);

  return { entity, variants, battleRecord: { wins, losses, draws } };
}

export async function getEntitiesBySeries(categoryId: string, limit = 20) {
  return db
    .select({
      id:       entities.id,
      name:     entities.name,
      slug:     entities.slug,
      imageUrl: entities.imageUrl,
      series:   { id: categories.id, name: categories.name, slug: categories.slug },
    })
    .from(entities)
    .innerJoin(categories, eq(entities.categoryId, categories.id))
    .where(and(eq(entities.categoryId, categoryId), eq(entities.status, "approved")))
    .orderBy(asc(entities.name))
    .limit(limit);
}

// ---------------------------------------------------------------------------
// Search
// ---------------------------------------------------------------------------

export async function searchEntities(query: string, limit = 10) {
  if (!query.trim()) return [];
  return db
    .select({
      id: entities.id, name: entities.name, slug: entities.slug, imageUrl: entities.imageUrl,
      series: { id: categories.id, name: categories.name },
    })
    .from(entities)
    .innerJoin(categories, eq(entities.categoryId, categories.id))
    .where(and(
      eq(entities.status, "approved"),
      ilike(entities.name, `%${query}%`),
    ))
    .limit(limit);
}

// ---------------------------------------------------------------------------
// Radar chart stats
// ---------------------------------------------------------------------------

export type RadarStat = { slug: string; name: string; sortOrder: number; value: number };

export async function getMatchupRadarStats(
  sideAParticipants: Participant[],
  sideBParticipants: Participant[]
): Promise<{ a: RadarStat[]; b: RadarStat[] }> {
  const variantA = sideAParticipants[0]?.variant.id;
  const variantB = sideBParticipants[0]?.variant.id;
  if (!variantA || !variantB) return { a: [], b: [] };

  const fetchStats = (variantId: string) =>
    db
      .select({
        slug:      attributes.slug,
        name:      attributes.name,
        sortOrder: attributes.sortOrder,
        value:     entityStats.value,
      })
      .from(entityStats)
      .innerJoin(attributes, eq(entityStats.attributeId, attributes.id))
      .where(eq(entityStats.variantId, variantId))
      .orderBy(asc(attributes.sortOrder));

  const [a, b] = await Promise.all([fetchStats(variantA), fetchStats(variantB)]);
  return { a, b };
}

// ---------------------------------------------------------------------------
// Entity stats (Phase 4)
// ---------------------------------------------------------------------------

export async function getEntityStats(variantId: string): Promise<RadarStat[]> {
  const rows = await db
    .select({
      slug:      attributes.slug,
      name:      attributes.name,
      sortOrder: attributes.sortOrder,
      value:     entityStats.value,
    })
    .from(entityStats)
    .innerJoin(attributes, eq(entityStats.attributeId, attributes.id))
    .where(eq(entityStats.variantId, variantId))
    .orderBy(asc(attributes.sortOrder));
  return rows.map((r) => ({ ...r, value: Number(r.value) }));
}

export async function getCommunityEntityStatsAvg(variantId: string): Promise<RadarStat[]> {
  const rows = await db
    .select({
      slug:      attributes.slug,
      name:      attributes.name,
      sortOrder: attributes.sortOrder,
      avg:       sql<string>`AVG(${communityEntityStats.value})`,
    })
    .from(communityEntityStats)
    .innerJoin(attributes, eq(communityEntityStats.attributeId, attributes.id))
    .where(eq(communityEntityStats.variantId, variantId))
    .groupBy(attributes.id, attributes.slug, attributes.name, attributes.sortOrder)
    .orderBy(asc(attributes.sortOrder));
  if (rows.length === 0) return [];
  return rows.map((r) => ({
    slug: r.slug, name: r.name, sortOrder: r.sortOrder,
    value: Math.round(parseFloat(r.avg)),
  }));
}

export async function getUserEntityStats(
  userId: string,
  variantId: string,
): Promise<Record<string, number>> {
  const rows = await db
    .select({ slug: attributes.slug, value: communityEntityStats.value })
    .from(communityEntityStats)
    .innerJoin(attributes, eq(communityEntityStats.attributeId, attributes.id))
    .where(and(
      eq(communityEntityStats.userId, userId),
      eq(communityEntityStats.variantId, variantId),
    ));
  return Object.fromEntries(rows.map((r) => [r.slug, Number(r.value)]));
}

// ---------------------------------------------------------------------------
// User vote
// ---------------------------------------------------------------------------

export async function getUserVoteForMatchup(userId: string, matchupId: string) {
  const [vote] = await db
    .select()
    .from(votes)
    .where(and(eq(votes.userId, userId), eq(votes.matchupId, matchupId)))
    .limit(1);
  return vote ?? null;
}

export async function searchCategories(query: string, limit = 5) {
  if (!query.trim()) return [];
  return db
    .select()
    .from(categories)
    .where(ilike(categories.name, `%${query}%`))
    .limit(limit);
}

// ---------------------------------------------------------------------------
// Community Edge  (avg score_a across all vote_attributes for a matchup)
// ---------------------------------------------------------------------------

export type CommunityEdge = {
  winner: "a" | "b" | null;
  edgePercent: number;
  voterCount: number;
};

export async function getMatchupCommunityEdge(matchupId: string): Promise<CommunityEdge> {
  return withCache(`awb:edge:${matchupId}`, 30, () => _getMatchupCommunityEdge(matchupId));
}

async function _getMatchupCommunityEdge(matchupId: string): Promise<CommunityEdge> {
  // Average per-user first (each voter counts equally regardless of how many attributes they filled)
  const perUser = db.$with("per_user").as(
    db
      .select({
        userId:  voteAttributes.userId,
        userAvg: sql<string>`AVG(${voteAttributes.scoreA})`.as("user_avg"),
      })
      .from(voteAttributes)
      .where(eq(voteAttributes.matchupId, matchupId))
      .groupBy(voteAttributes.userId)
  );

  const [row] = await db
    .with(perUser)
    .select({
      poolAvg:    sql<string>`AVG(${perUser.userAvg})`,
      voterCount: sql<string>`COUNT(*)`,
    })
    .from(perUser);

  if (!row?.poolAvg) return { winner: null, edgePercent: 0, voterCount: 0 };

  const avg        = parseFloat(row.poolAvg);
  const voterCount = parseInt(row.voterCount, 10);
  const edge = Math.round(2 * avg - 100);

  return {
    winner:      edge > 0 ? "a" : edge < 0 ? "b" : null,
    edgePercent: Math.abs(edge),
    voterCount,
  };
}

// ---------------------------------------------------------------------------
// Community stat averages — per-attribute avg score_a for the amber polygon
// ---------------------------------------------------------------------------

export async function getMatchupCommunityStatAverages(matchupId: string): Promise<RadarStat[]> {
  return withCache(`awb:stats-avg:${matchupId}`, 30, () => _getMatchupCommunityStatAverages(matchupId));
}

async function _getMatchupCommunityStatAverages(matchupId: string): Promise<RadarStat[]> {
  // Average per-user per-attribute first, then average those — prevents heavy voters skewing the polygon
  const perUserAttr = db.$with("per_user_attr").as(
    db
      .select({
        userId:      voteAttributes.userId,
        attributeId: voteAttributes.attributeId,
        userAvg:     sql<string>`AVG(${voteAttributes.scoreA})`.as("user_avg"),
      })
      .from(voteAttributes)
      .where(eq(voteAttributes.matchupId, matchupId))
      .groupBy(voteAttributes.userId, voteAttributes.attributeId)
  );

  const rows = await db
    .with(perUserAttr)
    .select({
      slug:      attributes.slug,
      name:      attributes.name,
      sortOrder: attributes.sortOrder,
      avgScoreA: sql<string>`AVG(${perUserAttr.userAvg})`,
    })
    .from(perUserAttr)
    .innerJoin(attributes, eq(perUserAttr.attributeId, attributes.id))
    .groupBy(attributes.id, attributes.slug, attributes.name, attributes.sortOrder)
    .orderBy(asc(attributes.sortOrder));

  if (rows.length === 0) return [];
  return rows.map((r) => ({
    slug:      r.slug,
    name:      r.name,
    sortOrder: r.sortOrder,
    value:     Math.round(parseFloat(r.avgScoreA)),
  }));
}

// ---------------------------------------------------------------------------
// Matchup comments
// ---------------------------------------------------------------------------

export type CommentRow = {
  id:        string;
  body:      string;
  createdAt: Date;
  parentId:  string | null;
  user:      { id: string; name: string | null; image: string | null; role: string; lifetimeXp: number; rank: import("@/lib/ranks").RankName };
  score:     number;
};

async function fetchCommentVoteScores(commentIds: string[], type: "matchup" | "entity"): Promise<Record<string, number>> {
  if (commentIds.length === 0) return {};
  const scores = await db
    .select({
      commentId: commentVotes.commentId,
      total:     sql<string>`SUM(${commentVotes.value})`,
    })
    .from(commentVotes)
    .where(and(
      eq(commentVotes.commentType, type),
      sql`${commentVotes.commentId} = ANY(ARRAY[${sql.join(commentIds.map((id) => sql`${id}::uuid`), sql`, `)}])`
    ))
    .groupBy(commentVotes.commentId);
  return Object.fromEntries(scores.map((s) => [s.commentId, parseInt(s.total, 10)]));
}

export async function getMatchupComments(matchupId: string): Promise<CommentRow[]> {
  const [rows, settings] = await Promise.all([
    db
      .select({
        id:         matchupComments.id,
        body:       matchupComments.body,
        createdAt:  matchupComments.createdAt,
        parentId:   matchupComments.parentId,
        userId:     matchupComments.userId,
        userName:   users.name,
        userImage:  users.image,
        userRole:   users.role,
        lifetimeXp: sql<string>`COALESCE((SELECT SUM(pt.amount) FROM point_transactions pt WHERE pt.user_id = ${users.id} AND pt.amount > 0), 0)`,
      })
      .from(matchupComments)
      .innerJoin(users, eq(matchupComments.userId, users.id))
      .where(eq(matchupComments.matchupId, matchupId))
      .orderBy(desc(matchupComments.createdAt)),
    getAdminSettings(),
  ]);

  if (rows.length === 0) return [];
  const scoreMap = await fetchCommentVoteScores(rows.map((r) => r.id), "matchup");
  return rows.map((r) => {
    const xp = parseInt(r.lifetimeXp, 10);
    return {
      id: r.id, body: r.body, createdAt: r.createdAt, parentId: r.parentId,
      user: { id: r.userId, name: r.userName, image: r.userImage, role: r.userRole, lifetimeXp: xp, rank: getRankFromXp(xp, settings).rank },
      score: scoreMap[r.id] ?? 0,
    };
  });
}

export async function getEntityComments(entityId: string): Promise<CommentRow[]> {
  const [rows, settings] = await Promise.all([
    db
      .select({
        id:         entityComments.id,
        body:       entityComments.body,
        createdAt:  entityComments.createdAt,
        parentId:   entityComments.parentId,
        userId:     entityComments.userId,
        userName:   users.name,
        userImage:  users.image,
        userRole:   users.role,
        lifetimeXp: sql<string>`COALESCE((SELECT SUM(pt.amount) FROM point_transactions pt WHERE pt.user_id = ${users.id} AND pt.amount > 0), 0)`,
      })
      .from(entityComments)
      .innerJoin(users, eq(entityComments.userId, users.id))
      .where(eq(entityComments.entityId, entityId))
      .orderBy(desc(entityComments.createdAt)),
    getAdminSettings(),
  ]);

  if (rows.length === 0) return [];
  const scoreMap = await fetchCommentVoteScores(rows.map((r) => r.id), "entity");
  return rows.map((r) => {
    const xp = parseInt(r.lifetimeXp, 10);
    return {
      id: r.id, body: r.body, createdAt: r.createdAt, parentId: r.parentId,
      user: { id: r.userId, name: r.userName, image: r.userImage, role: r.userRole, lifetimeXp: xp, rank: getRankFromXp(xp, settings).rank },
      score: scoreMap[r.id] ?? 0,
    };
  });
}

// ---------------------------------------------------------------------------
// Leaderboards (Phase 6)
// ---------------------------------------------------------------------------

export type EntityLeaderRow = {
  id: string;
  name: string;
  slug: string;
  imageUrl: string | null;
  seriesName: string;
  seriesSlug: string;
  totalVotes: number;
  wins: number;
  losses: number;
  draws: number;
  winRate: number;
};

export async function getTopEntities(limit = 20): Promise<EntityLeaderRow[]> {
  return withCache(`awb:lb:entities:${limit}`, 300, () => _getTopEntities(limit));
}

async function _getTopEntities(limit: number): Promise<EntityLeaderRow[]> {
  // CTE so the outer ORDER BY can cast named columns — Postgres won't cast a SELECT alias inline.
  const raw = await db.execute(sql`
    WITH stats AS (
      SELECT
        e.id,
        e.name,
        e.slug,
        e.image_url AS "imageUrl",
        c.name      AS "seriesName",
        c.slug      AS "seriesSlug",
        COUNT(v.id) AS total_votes,
        SUM(CASE WHEN (mp.side = 'a' AND v.verdict = 'a') OR (mp.side = 'b' AND v.verdict = 'b') THEN 1 ELSE 0 END) AS wins,
        SUM(CASE WHEN v.verdict = 'draw' THEN 1 ELSE 0 END) AS draws,
        COUNT(v.id)
          - SUM(CASE WHEN (mp.side = 'a' AND v.verdict = 'a') OR (mp.side = 'b' AND v.verdict = 'b') THEN 1 ELSE 0 END)
          - SUM(CASE WHEN v.verdict = 'draw' THEN 1 ELSE 0 END) AS losses
      FROM entities e
      INNER JOIN categories c            ON e.category_id = c.id
      INNER JOIN entity_variants ev      ON ev.entity_id = e.id
      INNER JOIN matchup_participants mp ON mp.variant_id = ev.id
      INNER JOIN votes v                 ON v.matchup_id = mp.matchup_id
      WHERE e.status = 'approved'
      GROUP BY e.id, e.name, e.slug, e.image_url, c.name, c.slug
      HAVING COUNT(v.id) >= 3
    )
    SELECT * FROM stats
    ORDER BY wins::float / NULLIF(total_votes, 0) DESC, total_votes DESC
    LIMIT ${limit}
  `);
  return (raw as unknown as any[]).map((r) => ({
    id:         r.id,
    name:       r.name,
    slug:       r.slug,
    imageUrl:   r.imageUrl ?? null,
    seriesName: r.seriesName,
    seriesSlug: r.seriesSlug,
    totalVotes: Number(r.total_votes),
    wins:       Number(r.wins),
    losses:     Number(r.losses),
    draws:      Number(r.draws),
    winRate:    Number(r.total_votes) > 0 ? Math.round((Number(r.wins) / Number(r.total_votes)) * 100) : 0,
  }));
}

export type UserLeaderRow = {
  id: string;
  name: string | null;
  image: string | null;
  lifetimeXp: number;
  rank: import("@/lib/ranks").RankName;
};

export async function getTopUsers(limit = 20): Promise<UserLeaderRow[]> {
  return withCache(`awb:lb:users:${limit}`, 300, () => _getTopUsers(limit));
}

async function _getTopUsers(limit: number): Promise<UserLeaderRow[]> {
  const [raw, settings] = await Promise.all([
    db.execute(sql`
      SELECT
        u.id,
        u.name,
        u.image,
        COALESCE(SUM(CASE WHEN pt.amount > 0 THEN pt.amount ELSE 0 END), 0) AS "lifetimeXp"
      FROM users u
      LEFT JOIN point_transactions pt ON pt.user_id = u.id
      WHERE u.role NOT IN ('admin', 'moderator')
      GROUP BY u.id, u.name, u.image
      ORDER BY "lifetimeXp" DESC
      LIMIT ${limit}
    `),
    getAdminSettings(),
  ]);
  return (raw as unknown as any[]).map((r) => {
    const xp = Number(r.lifetimeXp);
    return {
      id:         r.id,
      name:       r.name ?? null,
      image:      r.image ?? null,
      lifetimeXp: xp,
      rank:       getRankFromXp(xp, settings).rank,
    };
  });
}

export async function getMostDebatedMatchups(limit = 10): Promise<MatchupCard[]> {
  return withCache(`awb:lb:debated:${limit}`, 300, () => _getMostDebatedMatchups(limit));
}

async function _getMostDebatedMatchups(limit: number): Promise<MatchupCard[]> {
  const raw = await db.execute(sql`
    SELECT m.id
    FROM matchups m
    INNER JOIN votes v ON v.matchup_id = m.id
    GROUP BY m.id
    HAVING COUNT(v.id) >= 5
    ORDER BY
      ABS(
        SUM(CASE WHEN v.verdict = 'a' THEN 1 ELSE 0 END) -
        SUM(CASE WHEN v.verdict = 'b' THEN 1 ELSE 0 END)
      ) ASC,
      COUNT(v.id) DESC
    LIMIT ${limit}
  `);
  const ids = (raw as unknown as any[]).map((r) => r.id as string);
  if (ids.length === 0) return [];

  const matchupRows = await db
    .select()
    .from(matchups)
    .where(inArray(matchups.id, ids));

  const idOrder = new Map(ids.map((id, i) => [id, i]));
  const ordered = matchupRows.sort((a, b) => (idOrder.get(a.id) ?? 99) - (idOrder.get(b.id) ?? 99));

  return attachParticipantsAndVotes(ordered);
}

// 12-hour cache for homepage — contested battles don't need real-time freshness
export async function getHomepageContestedMatchups(limit = 6): Promise<MatchupCard[]> {
  return withCache(`awb:hp:contested:${limit}`, 43200, () => _getMostDebatedMatchups(limit));
}

// ---------------------------------------------------------------------------
// Admin dashboard stats (Phase 6)
// ---------------------------------------------------------------------------


export type AdminDashboardStats = {
  totalVisitors: number;
  totalVotes: number;
  votesPerVisitor: string;
  trafficSources: { source: string; count: number }[];
  topMatchupsByViews: { path: string; views: number }[];
  topMatchupsByVotes: { matchupId: string; slug: string; totalVotes: number }[];
  conversionFunnel: {
    visitors: number;
    registeredVoters: number;
    conversionRate: string;
  };
};

export async function getAdminDashboardStats(): Promise<AdminDashboardStats> {
  return withCache("awb:admin:dashboard", 60, _getAdminDashboardStats);
}

async function _getAdminDashboardStats(): Promise<AdminDashboardStats> {
  // All aggregation done in Postgres — nothing is pulled into Node memory.
  const [visitorsRaw, sourcesRaw, topPagesRaw, votesRaw, topVotesRaw] = await Promise.all([
    // Unique sessions + registered visitor count
    db.execute(sql`
      SELECT
        COUNT(DISTINCT session_id)                         AS unique_sessions,
        COUNT(DISTINCT CASE WHEN user_id IS NOT NULL THEN user_id END) AS registered_visitors
      FROM analytics_events
      WHERE event_type = 'page_view'
    `),
    // Traffic source breakdown — bucketed in SQL, not a JS loop over every row
    db.execute(sql`
      SELECT
        CASE
          WHEN referrer ILIKE '%reddit.com%'                                        THEN 'Reddit'
          WHEN referrer ILIKE '%discord.com%' OR referrer ILIKE '%discord.gg%'     THEN 'Discord'
          WHEN referrer ILIKE '%twitter.com%' OR referrer ILIKE '%x.com%'
            OR referrer ILIKE '%t.co%'                                              THEN 'Twitter/X'
          WHEN referrer ILIKE '%tiktok.com%'                                        THEN 'TikTok'
          WHEN referrer ILIKE '%youtube.com%'                                       THEN 'YouTube'
          WHEN referrer ILIKE '%google.com%'                                        THEN 'Google'
          WHEN referrer ILIKE '%facebook.com%' OR referrer ILIKE '%fb.com%'        THEN 'Facebook'
          WHEN referrer IS NULL OR referrer = ''                                    THEN 'Direct'
          ELSE 'Other'
        END AS source,
        COUNT(*) AS count
      FROM analytics_events
      WHERE event_type = 'page_view'
      GROUP BY source
      ORDER BY count DESC
    `),
    // Top battle pages by views — filtered + grouped in SQL
    db.execute(sql`
      SELECT path, COUNT(*) AS views
      FROM analytics_events
      WHERE event_type = 'page_view' AND path LIKE '/battles/%'
      GROUP BY path
      ORDER BY views DESC
      LIMIT 10
    `),
    db.execute(sql`SELECT COUNT(*) AS c FROM votes`),
    db.execute(sql`
      SELECT m.id AS "matchupId", m.slug, COUNT(v.id) AS "totalVotes"
      FROM matchups m
      INNER JOIN votes v ON v.matchup_id = m.id
      GROUP BY m.id, m.slug
      ORDER BY COUNT(v.id) DESC
      LIMIT 10
    `),
  ]);

  const visitorRow     = (visitorsRaw as unknown as any[])[0] ?? {};
  const uniqueSessions = Number(visitorRow.unique_sessions   ?? 0);
  const regVisitors    = Number(visitorRow.registered_visitors ?? 0);
  const totalVotes     = Number(((votesRaw as unknown as any[])[0])?.c ?? 0);

  return {
    totalVisitors:   uniqueSessions,
    totalVotes,
    votesPerVisitor: uniqueSessions > 0 ? (totalVotes / uniqueSessions).toFixed(2) : "0.00",
    trafficSources: (sourcesRaw as unknown as any[]).map((r) => ({
      source: r.source as string,
      count:  Number(r.count),
    })),
    topMatchupsByViews: (topPagesRaw as unknown as any[]).map((r) => ({
      path:  r.path  as string,
      views: Number(r.views),
    })),
    topMatchupsByVotes: (topVotesRaw as unknown as any[]).map((r) => ({
      matchupId:  r.matchupId  as string,
      slug:       r.slug       as string,
      totalVotes: Number(r.totalVotes),
    })),
    conversionFunnel: {
      visitors:         uniqueSessions,
      registeredVoters: regVisitors,
      conversionRate:   uniqueSessions > 0 ? ((regVisitors / uniqueSessions) * 100).toFixed(1) + "%" : "0%",
    },
  };
}

// ---------------------------------------------------------------------------
// Notifications
// ---------------------------------------------------------------------------

export type NotificationRow = {
  id: string;
  type: string;
  read: boolean;
  referenceId: string | null;
  referenceType: string | null;
  createdAt: string;
  actorName: string | null;
  contextSlug: string | null;
  bodyExcerpt: string | null;
};

// ---------------------------------------------------------------------------
// Admin content helpers
// ---------------------------------------------------------------------------

export async function getAnimeAttributes() {
  const [anime] = await db
    .select({ id: categories.id })
    .from(categories)
    .where(and(isNull(categories.parentId), eq(categories.slug, "anime")))
    .limit(1);
  if (!anime) return [];
  return db
    .select({ id: attributes.id, name: attributes.name, slug: attributes.slug, sortOrder: attributes.sortOrder })
    .from(attributes)
    .where(eq(attributes.categoryId, anime.id))
    .orderBy(asc(attributes.sortOrder));
}

export async function getPendingEntities() {
  return db.execute(sql`
    SELECT
      e.id,
      e.name,
      e.slug,
      e.image_url      AS "imageUrl",
      e.created_at     AS "createdAt",
      c.name           AS "seriesName",
      u.name           AS "creatorName",
      u.email          AS "creatorEmail"
    FROM entities e
    LEFT JOIN categories c ON e.category_id = c.id
    LEFT JOIN users u      ON e.created_by  = u.id
    WHERE e.status = 'pending'
    ORDER BY e.created_at ASC
  `) as unknown as Array<{
    id: string; name: string; slug: string; imageUrl: string | null;
    createdAt: string; seriesName: string | null;
    creatorName: string | null; creatorEmail: string | null;
  }>;
}

export async function getAdminUserList(search: string, limit = 30, offset = 0) {
  return db.execute(sql`
    SELECT
      u.id,
      u.name,
      u.email,
      u.role,
      u.is_patron      AS "isPatron",
      u.restricted_until AS "restrictedUntil",
      u.created_at     AS "createdAt",
      COALESCE(SUM(pt.amount) FILTER (WHERE pt.amount > 0), 0) AS xp
    FROM users u
    LEFT JOIN point_transactions pt ON pt.user_id = u.id
    WHERE (${search} = '' OR u.name ILIKE ${'%' + search + '%'} OR u.email ILIKE ${'%' + search + '%'})
    GROUP BY u.id
    ORDER BY u.created_at DESC
    LIMIT ${limit} OFFSET ${offset}
  `) as unknown as Array<{
    id: string; name: string | null; email: string;
    role: string; isPatron: boolean; restrictedUntil: string | null;
    createdAt: string; xp: number;
  }>;
}

// ---------------------------------------------------------------------------
// Notifications
// ---------------------------------------------------------------------------

export async function getUnreadNotificationCount(userId: string): Promise<number> {
  const [row] = await db
    .select({ count: count() })
    .from(notifications)
    .where(and(eq(notifications.userId, userId), eq(notifications.read, false)));
  return Number(row?.count ?? 0);
}

export async function getNotifications(userId: string, limit = 30): Promise<NotificationRow[]> {
  const raw = await db.execute(sql`
    SELECT
      n.id,
      n.type,
      n.read,
      n.reference_id   AS "referenceId",
      n.reference_type AS "referenceType",
      n.created_at     AS "createdAt",
      COALESCE(u_mc.name, u_ec.name) AS "actorName",
      CASE
        WHEN n.reference_type = 'matchup_comment' THEN mp.slug
        WHEN n.reference_type = 'entity_comment'  THEN ent_ec.slug
        WHEN n.reference_type = 'entity'           THEN ent.slug
      END AS "contextSlug",
      CASE
        WHEN n.reference_type = 'matchup_comment' THEN LEFT(mc.body, 80)
        WHEN n.reference_type = 'entity_comment'  THEN LEFT(ec.body, 80)
        WHEN n.type = 'admin_point_adjustment'    THEN
          CONCAT(CASE WHEN pt.amount > 0 THEN '+' ELSE '' END, pt.amount::text, ' — ', LEFT(pt.note, 60))
      END AS "bodyExcerpt"
    FROM notifications n
    LEFT JOIN matchup_comments mc  ON n.reference_type = 'matchup_comment' AND mc.id = n.reference_id
    LEFT JOIN users u_mc           ON mc.user_id = u_mc.id
    LEFT JOIN matchups mp          ON mc.matchup_id = mp.id
    LEFT JOIN entity_comments ec   ON n.reference_type = 'entity_comment'  AND ec.id = n.reference_id
    LEFT JOIN users u_ec           ON ec.user_id = u_ec.id
    LEFT JOIN entities ent_ec      ON ec.entity_id = ent_ec.id
    LEFT JOIN entities ent         ON n.reference_type = 'entity'           AND ent.id = n.reference_id
    LEFT JOIN point_transactions pt ON n.type = 'admin_point_adjustment'   AND pt.id = n.reference_id
    WHERE n.user_id = ${userId}
    ORDER BY n.created_at DESC
    LIMIT ${limit}
  `);
  return raw as unknown as NotificationRow[];
}

// ---------------------------------------------------------------------------
// Share prediction page data
// ---------------------------------------------------------------------------

export type ShareParticipant = {
  name: string;
  imageUrl: string | null;
  seriesName: string;
};

export type SharePageData = {
  vote: { id: string; verdict: string; difficulty: string };
  matchupSlug: string;
  labelA: string;
  labelB: string;
  userName: string | null;
  userStats: Record<string, number>;   // slug → scoreA (user's prediction)
  communityStats: RadarStat[];          // community averages (dashed line)
  radarStatsA: RadarStat[];             // entity stats for side A (radar base)
  radarStatsB: RadarStat[];             // entity stats for side B (radar base)
  statOrder: string[];                  // attribute slugs in display order
  participantsA: ShareParticipant[];
  participantsB: ShareParticipant[];
  communityEdge: CommunityEdge;
  voteSummary: VoteSummary;
};

export async function getSharePageData(voteId: string): Promise<SharePageData | null> {
  // Fetch vote
  const [voteRow] = await db
    .select({ id: votes.id, verdict: votes.verdict, difficulty: votes.difficulty, matchupId: votes.matchupId, userId: votes.userId })
    .from(votes)
    .where(eq(votes.id, voteId))
    .limit(1);
  if (!voteRow) return null;

  // Fetch matchup + participants + user in parallel
  const [matchup] = await db.select({ slug: matchups.slug, sideALabel: matchups.sideALabel, sideBLabel: matchups.sideBLabel })
    .from(matchups).where(eq(matchups.id, voteRow.matchupId)).limit(1);
  if (!matchup) return null;

  const [participants, userRow, userStats, communityStats, communityEdge, voteCounts] = await Promise.all([
    fetchParticipants(voteRow.matchupId),
    db.select({ name: users.name }).from(users).where(eq(users.id, voteRow.userId)).limit(1),
    getUserVoteAttributes(voteRow.userId, voteRow.matchupId),
    getMatchupCommunityStatAverages(voteRow.matchupId),
    getMatchupCommunityEdge(voteRow.matchupId),
    db.select({ verdict: votes.verdict, c: count() }).from(votes).where(eq(votes.matchupId, voteRow.matchupId)).groupBy(votes.verdict),
  ]);

  const sideA = participants.filter((p) => p.side === "a");
  const sideB = participants.filter((p) => p.side === "b");
  const labelA = deriveSideLabel(matchup.sideALabel, sideA);
  const labelB = deriveSideLabel(matchup.sideBLabel, sideB);

  // Fetch entity stats now that we have variant IDs from participants
  const radarStats = await getMatchupRadarStats(sideA, sideB);

  const a = Number(voteCounts.find((v) => v.verdict === "a")?.c  ?? 0);
  const b = Number(voteCounts.find((v) => v.verdict === "b")?.c  ?? 0);
  const d = Number(voteCounts.find((v) => v.verdict === "draw")?.c ?? 0);

  return {
    vote: { id: voteRow.id, verdict: voteRow.verdict, difficulty: voteRow.difficulty },
    matchupSlug: matchup.slug,
    labelA,
    labelB,
    userName: userRow[0]?.name ?? null,
    userStats,
    communityStats,
    radarStatsA: radarStats.a,
    radarStatsB: radarStats.b,
    statOrder: communityStats.map((s) => s.slug),
    participantsA: sideA.map((p) => ({
      name: p.entity.name,
      imageUrl: p.variant.imageUrl ?? p.entity.imageUrl,
      seriesName: p.series.name,
    })),
    participantsB: sideB.map((p) => ({
      name: p.entity.name,
      imageUrl: p.variant.imageUrl ?? p.entity.imageUrl,
      seriesName: p.series.name,
    })),
    communityEdge,
    voteSummary: computeVoteSummary(a, b, d),
  };
}

// ---------------------------------------------------------------------------
// User contributions (profile page)
// ---------------------------------------------------------------------------

export type ContribCharacter = {
  id: string;
  name: string;
  slug: string;
  imageUrl: string | null;
  status: "pending" | "approved" | "rejected";
  seriesName: string;
  seriesSlug: string;
};

export async function getUserContribCharacters(
  userId: string,
  includeAll: boolean,
): Promise<ContribCharacter[]> {
  const rows = await db
    .select({
      id:         entities.id,
      name:       entities.name,
      slug:       entities.slug,
      imageUrl:   entities.imageUrl,
      status:     entities.status,
      seriesName: categories.name,
      seriesSlug: categories.slug,
    })
    .from(entities)
    .innerJoin(categories, eq(entities.categoryId, categories.id))
    .where(and(
      eq(entities.createdBy, userId),
      includeAll ? undefined : eq(entities.status, "approved"),
    ))
    .orderBy(desc(entities.createdAt))
    .limit(50);
  return rows as ContribCharacter[];
}

export type ContribBattle = {
  id: string;
  slug: string;
  labelA: string;
  labelB: string;
  totalVotes: number;
  createdAt: Date;
};

export async function getUserContribBattles(userId: string): Promise<ContribBattle[]> {
  const rows = await db
    .select({
      id:        matchups.id,
      slug:      matchups.slug,
      sideALabel: matchups.sideALabel,
      sideBLabel: matchups.sideBLabel,
      createdAt: matchups.createdAt,
    })
    .from(matchups)
    .where(eq(matchups.createdBy, userId))
    .orderBy(desc(matchups.createdAt))
    .limit(50);

  if (rows.length === 0) return [];

  const ids = rows.map((r) => r.id);

  const [allParticipants, voteCounts] = await Promise.all([
    db
      .select({
        matchupId:   matchupParticipants.matchupId,
        side:        matchupParticipants.side,
        sortOrder:   matchupParticipants.sortOrder,
        entityName:  entities.name,
        variantName: entityVariants.name,
      })
      .from(matchupParticipants)
      .innerJoin(entityVariants, eq(matchupParticipants.variantId, entityVariants.id))
      .innerJoin(entities,       eq(entityVariants.entityId, entities.id))
      .where(sql`${matchupParticipants.matchupId} = ANY(ARRAY[${sql.join(ids.map((id) => sql`${id}::uuid`), sql`, `)}])`)
      .orderBy(asc(matchupParticipants.side), asc(matchupParticipants.sortOrder)),
    db
      .select({ matchupId: votes.matchupId, c: count() })
      .from(votes)
      .where(sql`${votes.matchupId} = ANY(ARRAY[${sql.join(ids.map((id) => sql`${id}::uuid`), sql`, `)}])`)
      .groupBy(votes.matchupId),
  ]);

  return rows.map((m) => {
    const ps = allParticipants.filter((p) => p.matchupId === m.id);
    const firstA = ps.find((p) => p.side === "a");
    const firstB = ps.find((p) => p.side === "b");

    function participantLabel(p: typeof firstA): string {
      if (!p) return "TBD";
      const entity  = p.entityName.trim();
      const variant = p.variantName.trim();
      return variant.toLowerCase() === entity.toLowerCase() ? entity : `${entity} (${variant})`;
    }

    return {
      id:         m.id,
      slug:       m.slug,
      labelA:     m.sideALabel ?? participantLabel(firstA),
      labelB:     m.sideBLabel ?? participantLabel(firstB),
      totalVotes: Number(voteCounts.find((v) => v.matchupId === m.id)?.c ?? 0),
      createdAt:  m.createdAt,
    };
  });
}

export type ContribSeries = {
  id: string;
  name: string;
  slug: string;
  coverImage: string | null;
  parentName: string | null;
};

export async function getUserContribSeries(userId: string): Promise<ContribSeries[]> {
  const rows = await db
    .select({
      id:         categories.id,
      name:       categories.name,
      slug:       categories.slug,
      coverImage: categories.coverImage,
      parentId:   categories.parentId,
    })
    .from(categories)
    .where(and(eq(categories.createdBy, userId), isNotNull(categories.parentId)))
    .orderBy(desc(categories.createdAt))
    .limit(50);

  if (rows.length === 0) return [];

  const uniqueParentIds = [...new Set(rows.map((r) => r.parentId!))];
  const parentRows = await db
    .select({ id: categories.id, name: categories.name })
    .from(categories)
    .where(inArray(categories.id, uniqueParentIds));
  const parentMap = Object.fromEntries(parentRows.map((p) => [p.id, p.name]));

  return rows.map((r) => ({
    id:         r.id,
    name:       r.name,
    slug:       r.slug,
    coverImage: r.coverImage,
    parentName: r.parentId ? (parentMap[r.parentId] ?? null) : null,
  }));
}
