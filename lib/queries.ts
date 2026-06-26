import { db } from "@/db";
import {
  matchups, matchupParticipants, entityVariants, entities, categories,
  votes, anonymousVotes, attributes, entityStats, communityEntityStats,
  voteAttributes, matchupComments, entityComments, commentVotes, users,
} from "@/db/schema";
import { eq, desc, asc, sql, count, and, isNull, ilike, inArray } from "drizzle-orm";

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

  const rows = await db
    .select({ m: matchups, voteCount: count(votes.id) })
    .from(matchups)
    .leftJoin(votes, eq(votes.matchupId, matchups.id))
    .groupBy(matchups.id)
    .orderBy(
      sort === "recent" ? desc(matchups.createdAt) : desc(count(votes.id))
    )
    .limit(limit)
    .offset(offset)
    .then((rs) => rs.map((r) => r.m));
  return attachParticipantsAndVotes(rows);
}

export async function getMatchupBySlug(slug: string): Promise<
  (MatchupCard & { matchup: typeof matchups.$inferSelect; voteSummary: VoteSummary }) | null
> {
  const [matchup] = await db
    .select()
    .from(matchups)
    .where(eq(matchups.slug, slug))
    .limit(1);
  if (!matchup) return null;

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

export async function getAnimeSeries() {
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
    .orderBy(asc(categories.name));
}

export async function getCategoryBySlug(slug: string) {
  const [cat] = await db
    .select()
    .from(categories)
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
    })
    .from(entities)
    .innerJoin(categories, eq(entities.categoryId, categories.id))
    .where(eq(entities.slug, slug))
    .limit(1);

  if (!entity) return null;

  const variants = await db
    .select()
    .from(entityVariants)
    .where(eq(entityVariants.entityId, entity.id))
    .orderBy(desc(entityVariants.isDefault), asc(entityVariants.name));

  // Battle record: count W/L/D across all matchups this entity appears in
  const battleRecord = await db
    .select({ verdict: votes.verdict, c: count() })
    .from(matchupParticipants)
    .innerJoin(entityVariants, eq(matchupParticipants.variantId, entityVariants.id))
    .innerJoin(votes, and(
      eq(votes.matchupId, matchupParticipants.matchupId),
    ))
    .where(eq(entityVariants.entityId, entity.id))
    .groupBy(votes.verdict);

  const w = Number(battleRecord.find((r) => r.verdict === "a")?.c ?? 0) +
            Number(battleRecord.find((r) => r.verdict === "b")?.c ?? 0);

  return { entity, variants, battleRecord: { wins: w, losses: 0, draws: 0 } };
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
  const [row] = await db
    .select({
      avgScoreA:  sql<string>`AVG(${voteAttributes.scoreA})`,
      voterCount: sql<string>`COUNT(DISTINCT ${voteAttributes.userId})`,
    })
    .from(voteAttributes)
    .where(eq(voteAttributes.matchupId, matchupId));

  if (!row?.avgScoreA) return { winner: null, edgePercent: 0, voterCount: 0 };

  const avg        = parseFloat(row.avgScoreA);
  const voterCount = parseInt(row.voterCount, 10);
  // edge: positive = Fighter A leads, negative = Fighter B leads
  // e.g. avg=65 → 2*65-100 = +30, so Fighter A leads by 30%
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
  const rows = await db
    .select({
      slug:      attributes.slug,
      name:      attributes.name,
      sortOrder: attributes.sortOrder,
      avgScoreA: sql<string>`AVG(${voteAttributes.scoreA})`,
    })
    .from(voteAttributes)
    .innerJoin(attributes, eq(voteAttributes.attributeId, attributes.id))
    .where(eq(voteAttributes.matchupId, matchupId))
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
  user:      { id: string; name: string | null; image: string | null };
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
  const rows = await db
    .select({
      id:        matchupComments.id,
      body:      matchupComments.body,
      createdAt: matchupComments.createdAt,
      parentId:  matchupComments.parentId,
      userId:    matchupComments.userId,
      userName:  users.name,
      userImage: users.image,
    })
    .from(matchupComments)
    .innerJoin(users, eq(matchupComments.userId, users.id))
    .where(eq(matchupComments.matchupId, matchupId))
    .orderBy(desc(matchupComments.createdAt));

  if (rows.length === 0) return [];
  const scoreMap = await fetchCommentVoteScores(rows.map((r) => r.id), "matchup");
  return rows.map((r) => ({
    id: r.id, body: r.body, createdAt: r.createdAt, parentId: r.parentId,
    user: { id: r.userId, name: r.userName, image: r.userImage },
    score: scoreMap[r.id] ?? 0,
  }));
}

export async function getEntityComments(entityId: string): Promise<CommentRow[]> {
  const rows = await db
    .select({
      id:        entityComments.id,
      body:      entityComments.body,
      createdAt: entityComments.createdAt,
      parentId:  entityComments.parentId,
      userId:    entityComments.userId,
      userName:  users.name,
      userImage: users.image,
    })
    .from(entityComments)
    .innerJoin(users, eq(entityComments.userId, users.id))
    .where(eq(entityComments.entityId, entityId))
    .orderBy(desc(entityComments.createdAt));

  if (rows.length === 0) return [];
  const scoreMap = await fetchCommentVoteScores(rows.map((r) => r.id), "entity");
  return rows.map((r) => ({
    id: r.id, body: r.body, createdAt: r.createdAt, parentId: r.parentId,
    user: { id: r.userId, name: r.userName, image: r.userImage },
    score: scoreMap[r.id] ?? 0,
  }));
}
