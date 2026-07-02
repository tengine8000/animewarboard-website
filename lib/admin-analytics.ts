import { db } from "@/db";
import {
  users, matchups, votes, entities, categories, pointTransactions,
} from "@/db/schema";
import { eq, sql, count, and, isNull } from "drizzle-orm";
import { getAdminSettings } from "@/lib/points";
import { getRankFromXp } from "@/lib/ranks";

// ---------------------------------------------------------------------------
// Platform Pulse
// ---------------------------------------------------------------------------

export type PlatformPulse = {
  users:       { total: number; inPeriod: number; today: number };
  battles:     { total: number; inPeriod: number; today: number };
  votes:       { total: number; inPeriod: number; today: number };
  pending:     number;
  xpDistributed: number;
  totalSeries: number;
};

export async function getPlatformPulse(days: number): Promise<PlatformPulse> {
  const [raw] = await db.execute(sql`
    SELECT
      (SELECT COUNT(*)::int FROM users)                                                                       AS total_users,
      (SELECT COUNT(*)::int FROM users WHERE created_at >= NOW() - (${days}  * INTERVAL '1 day'))            AS users_period,
      (SELECT COUNT(*)::int FROM users WHERE created_at >= DATE_TRUNC('day', NOW()))                         AS users_today,
      (SELECT COUNT(*)::int FROM matchups)                                                                    AS total_battles,
      (SELECT COUNT(*)::int FROM matchups WHERE created_at >= NOW() - (${days} * INTERVAL '1 day'))          AS battles_period,
      (SELECT COUNT(*)::int FROM matchups WHERE created_at >= DATE_TRUNC('day', NOW()))                       AS battles_today,
      (SELECT COUNT(*)::int FROM votes)                                                                       AS total_votes,
      (SELECT COUNT(*)::int FROM votes WHERE created_at >= NOW() - (${days} * INTERVAL '1 day'))             AS votes_period,
      (SELECT COUNT(*)::int FROM votes WHERE created_at >= DATE_TRUNC('day', NOW()))                         AS votes_today,
      (SELECT COUNT(*)::int FROM entities WHERE status = 'pending')                                          AS pending_submissions,
      (SELECT COALESCE(SUM(amount), 0)::int FROM point_transactions WHERE amount > 0)                       AS xp_distributed,
      (SELECT COUNT(*)::int FROM categories WHERE parent_id IS NOT NULL)                                     AS total_series
  `);

  const r = raw as any;
  return {
    users:         { total: Number(r.total_users),   inPeriod: Number(r.users_period),   today: Number(r.users_today)   },
    battles:       { total: Number(r.total_battles), inPeriod: Number(r.battles_period), today: Number(r.battles_today) },
    votes:         { total: Number(r.total_votes),   inPeriod: Number(r.votes_period),   today: Number(r.votes_today)   },
    pending:       Number(r.pending_submissions),
    xpDistributed: Number(r.xp_distributed),
    totalSeries:   Number(r.total_series),
  };
}

// ---------------------------------------------------------------------------
// Activity Trend (daily breakdown)
// ---------------------------------------------------------------------------

export type DayTrend = {
  day:        string;   // "Jul 1"
  newUsers:   number;
  newBattles: number;
  newVotes:   number;
};

export async function getActivityTrend(days: number): Promise<DayTrend[]> {
  const rows = await db.execute(sql`
    WITH date_series AS (
      SELECT generate_series(
        DATE_TRUNC('day', NOW()) - ((${days} - 1) * INTERVAL '1 day'),
        DATE_TRUNC('day', NOW()),
        INTERVAL '1 day'
      )::date AS day
    )
    SELECT
      ds.day,
      COUNT(DISTINCT u.id)::int  AS new_users,
      COUNT(DISTINCT m.id)::int  AS new_battles,
      COUNT(DISTINCT v.id)::int  AS new_votes
    FROM date_series ds
    LEFT JOIN users     u ON u.created_at::date = ds.day
    LEFT JOIN matchups  m ON m.created_at::date = ds.day
    LEFT JOIN votes     v ON v.created_at::date = ds.day
    GROUP BY ds.day
    ORDER BY ds.day
  `);

  return (rows as any[]).map((r) => ({
    day:        new Date(r.day).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    newUsers:   Number(r.new_users),
    newBattles: Number(r.new_battles),
    newVotes:   Number(r.new_votes),
  }));
}

// ---------------------------------------------------------------------------
// Content Health
// ---------------------------------------------------------------------------

export type ContentHealth = {
  characters: { approved: number; pending: number; rejected: number };
  battlesWithZeroVotes: number;
  topSeries: { name: string; slug: string; count: number }[];
};

export async function getContentHealth(): Promise<ContentHealth> {
  const [statusRaw, zeroRaw, seriesRaw] = await Promise.all([
    db.execute(sql`
      SELECT status, COUNT(*)::int AS c FROM entities GROUP BY status
    `),
    db.execute(sql`
      SELECT COUNT(*)::int AS c
      FROM matchups m
      WHERE NOT EXISTS (SELECT 1 FROM votes v WHERE v.matchup_id = m.id)
    `),
    db.execute(sql`
      SELECT c.name, c.slug, COUNT(e.id)::int AS char_count
      FROM categories c
      INNER JOIN entities e ON e.category_id = c.id AND e.status = 'approved'
      WHERE c.parent_id IS NOT NULL
      GROUP BY c.id, c.name, c.slug
      ORDER BY char_count DESC
      LIMIT 10
    `),
  ]);

  const statusMap: Record<string, number> = {};
  for (const r of statusRaw as any[]) statusMap[r.status] = Number(r.c);

  return {
    characters: {
      approved: statusMap["approved"] ?? 0,
      pending:  statusMap["pending"]  ?? 0,
      rejected: statusMap["rejected"] ?? 0,
    },
    battlesWithZeroVotes: Number((zeroRaw as any[])[0]?.c ?? 0),
    topSeries: (seriesRaw as any[]).map((r) => ({
      name:  r.name,
      slug:  r.slug,
      count: Number(r.char_count),
    })),
  };
}

// ---------------------------------------------------------------------------
// Community Stats
// ---------------------------------------------------------------------------

export type RankBucket = { rank: string; count: number };

export type CommunityStats = {
  topVoters:   { name: string | null; username: string | null; count: number }[];
  topCreators: { name: string | null; username: string | null; count: number }[];
  rankDistribution: RankBucket[];
};

export async function getCommunityStats(): Promise<CommunityStats> {
  const [votersRaw, creatorsRaw, xpRaw, settings] = await Promise.all([
    db.execute(sql`
      SELECT u.name, u.username, COUNT(v.id)::int AS vote_count
      FROM users u
      INNER JOIN votes v ON v.user_id = u.id
      GROUP BY u.id, u.name, u.username
      ORDER BY vote_count DESC
      LIMIT 10
    `),
    db.execute(sql`
      SELECT u.name, u.username, COUNT(m.id)::int AS battle_count
      FROM users u
      INNER JOIN matchups m ON m.created_by = u.id
      GROUP BY u.id, u.name, u.username
      ORDER BY battle_count DESC
      LIMIT 10
    `),
    db.execute(sql`
      SELECT
        u.id,
        COALESCE(SUM(CASE WHEN pt.amount > 0 THEN pt.amount ELSE 0 END), 0)::int AS lifetime_xp
      FROM users u
      LEFT JOIN point_transactions pt ON pt.user_id = u.id
      GROUP BY u.id
    `),
    getAdminSettings(),
  ]);

  // Compute rank distribution in JS
  const rankCounts: Record<string, number> = {};
  for (const r of xpRaw as any[]) {
    const { rank } = getRankFromXp(Number(r.lifetime_xp), settings);
    rankCounts[rank] = (rankCounts[rank] ?? 0) + 1;
  }
  const RANK_ORDER = ["Civilian", "Corporal", "Sergeant", "Lieutenant", "Colonel", "General", "Field Marshal"];
  const rankDistribution: RankBucket[] = RANK_ORDER
    .filter((r) => rankCounts[r] !== undefined)
    .map((r) => ({ rank: r, count: rankCounts[r] }));

  return {
    topVoters:   (votersRaw   as any[]).map((r) => ({ name: r.name ?? null, username: r.username ?? null, count: Number(r.vote_count)   })),
    topCreators: (creatorsRaw as any[]).map((r) => ({ name: r.name ?? null, username: r.username ?? null, count: Number(r.battle_count) })),
    rankDistribution,
  };
}
