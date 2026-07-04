import { db } from "@/db";
import { pointTransactions, adminSettings, rankUpgrades, transactionTypeEnum } from "@/db/schema";
import { eq, and, gte, desc, count, asc, sql, SQL } from "drizzle-orm";
import { getRankFromXp, RANK_COLORS, RANK_ICONS, type RankName } from "@/lib/ranks";

type TxType = typeof transactionTypeEnum.enumValues[number];
export type RankUpgradeRow = {
  id: string;
  rank: string;
  color: string;
  icon: string;
  achievedAt: string;
};

export type PointTxRow = {
  id: string;
  amount: number;
  type: string;
  note: string | null;
  createdAt: string;
};

export async function getUserRankHistory(userId: string): Promise<RankUpgradeRow[]> {
  const rows = await db
    .select({ id: rankUpgrades.id, rank: rankUpgrades.rank, achievedAt: rankUpgrades.achievedAt })
    .from(rankUpgrades)
    .where(eq(rankUpgrades.userId, userId))
    .orderBy(asc(rankUpgrades.achievedAt));

  return rows.map((r) => ({
    id:         r.id,
    rank:       r.rank,
    color:      RANK_COLORS[r.rank as RankName] ?? "#64748b",
    icon:       RANK_ICONS[r.rank as RankName]  ?? "▪",
    achievedAt: r.achievedAt instanceof Date ? r.achievedAt.toISOString() : String(r.achievedAt),
  }));
}

export async function getAdminSettings(): Promise<Record<string, number>> {
  const rows = await db.select({ key: adminSettings.key, value: adminSettings.value }).from(adminSettings);
  return Object.fromEntries(rows.map((r) => [r.key, r.value]));
}

export async function getUserPointSummary(userId: string) {
  const settings = await getAdminSettings();

  const [row] = await db
    .select({
      balance:    sql<string>`COALESCE(SUM(${pointTransactions.amount}), 0)`,
      lifetimeXp: sql<string>`COALESCE(SUM(CASE WHEN ${pointTransactions.amount} > 0 THEN ${pointTransactions.amount} ELSE 0 END), 0)`,
    })
    .from(pointTransactions)
    .where(eq(pointTransactions.userId, userId));

  const balance    = parseInt(row?.balance    ?? "0", 10);
  const lifetimeXp = parseInt(row?.lifetimeXp ?? "0", 10);

  return { balance, lifetimeXp, ...getRankFromXp(lifetimeXp, settings), settings };
}

export async function getUserPointHistory(
  userId: string,
  opts: {
    page: number;
    pageSize?: number;
    type?: string;
    dateRange?: "7d" | "30d" | "90d" | "all";
  }
): Promise<{ rows: PointTxRow[]; total: number; pageCount: number }> {
  const pageSize = opts.pageSize ?? 20;
  const offset   = (opts.page - 1) * pageSize;

  const conditions: SQL[] = [eq(pointTransactions.userId, userId)];

  if (opts.type && opts.type !== "all") {
    conditions.push(eq(pointTransactions.type, opts.type as TxType));
  }

  if (opts.dateRange && opts.dateRange !== "all") {
    const days = { "7d": 7, "30d": 30, "90d": 90 }[opts.dateRange];
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    conditions.push(gte(pointTransactions.createdAt, cutoff));
  }

  const where = and(...conditions);

  const [totalRow] = await db
    .select({ total: count() })
    .from(pointTransactions)
    .where(where);

  const total     = totalRow?.total ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));

  const rows = await db
    .select({
      id:        pointTransactions.id,
      amount:    pointTransactions.amount,
      type:      pointTransactions.type,
      note:      pointTransactions.note,
      createdAt: pointTransactions.createdAt,
    })
    .from(pointTransactions)
    .where(where)
    .orderBy(desc(pointTransactions.createdAt))
    .limit(pageSize)
    .offset(offset);

  return {
    rows: rows.map((r) => ({
      ...r,
      createdAt: r.createdAt instanceof Date ? r.createdAt.toISOString() : String(r.createdAt),
    })),
    total,
    pageCount,
  };
}
