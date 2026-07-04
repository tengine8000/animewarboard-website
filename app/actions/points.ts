"use server";

import { auth } from "@/auth";
import { db } from "@/db";
import { users, pointTransactions, adminSettings, rankUpgrades } from "@/db/schema";
import { eq, sql, desc } from "drizzle-orm";
import { getUserPointHistory, getUserRankHistory, type PointTxRow, type RankUpgradeRow } from "@/lib/points";
import { getRankFromXp } from "@/lib/ranks";

export type DailyLoginResult =
  | { awarded: false }
  | { awarded: true; dailyPoints: number; signupBonus: number | null; streakBonus: number | null; streak: number; rankUp: string | null };

export async function awardDailyLoginAction(): Promise<DailyLoginResult> {
  const session = await auth();
  if (!session?.user?.id) return { awarded: false };

  const userId = session.user.id;
  const today  = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

  const [user] = await db
    .select({ lastLoginDate: users.lastLoginDate, loginStreak: users.loginStreak })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user) return { awarded: false };
  if (user.lastLoginDate === today) return { awarded: false };

  const isFirstLogin = !user.lastLoginDate;

  // Load relevant settings in one query
  const cfgRows = await db
    .select({ key: adminSettings.key, value: adminSettings.value })
    .from(adminSettings)
    .where(sql`${adminSettings.key} IN ('daily_login_points', 'login_streak_bonus_day', 'streak_bonus_multiplier', 'signup_bonus_points')`);
  const cfg = Object.fromEntries(cfgRows.map((r) => [r.key, r.value]));

  const dailyPoints      = cfg.daily_login_points      ?? 10;
  const streakBonusDay   = cfg.login_streak_bonus_day  ?? 7;
  const streakMultiplier = cfg.streak_bonus_multiplier ?? 2;
  const signupBonusPts   = cfg.signup_bonus_points     ?? 50;

  // Consecutive streak: was the user's last login yesterday?
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split("T")[0];
  const newStreak = user.lastLoginDate === yesterdayStr ? (user.loginStreak ?? 0) + 1 : 1;

  // Update the user row
  await db.update(users)
    .set({ lastLoginDate: today, loginStreak: newStreak })
    .where(eq(users.id, userId));

  // Write daily_login transaction
  await db.insert(pointTransactions).values({
    userId,
    amount:        dailyPoints,
    type:          "daily_login",
    referenceType: "system",
    note:          `Daily login — day ${newStreak} streak`,
  });

  // Streak bonus fires on every multiple of streakBonusDay (day 7, 14, 21, …)
  let streakBonus: number | null = null;
  if (newStreak % streakBonusDay === 0) {
    streakBonus = dailyPoints * (streakMultiplier - 1);
    await db.insert(pointTransactions).values({
      userId,
      amount:        streakBonus,
      type:          "streak_bonus",
      referenceType: "system",
      note:          `${newStreak}-day streak bonus`,
    });
  }

  // One-time signup bonus for first-ever login
  let signupBonus: number | null = null;
  if (isFirstLogin && signupBonusPts > 0) {
    signupBonus = signupBonusPts;
    await db.insert(pointTransactions).values({
      userId,
      amount:        signupBonus,
      type:          "signup_bonus",
      referenceType: "system",
      note:          "Welcome bonus",
    });
  }

  // Detect rank change
  const [xpRow] = await db
    .select({
      total: sql<string>`COALESCE(SUM(CASE WHEN ${pointTransactions.amount} > 0 THEN ${pointTransactions.amount} ELSE 0 END), 0)`,
    })
    .from(pointTransactions)
    .where(eq(pointTransactions.userId, userId));
  const newLifetimeXp = parseInt(xpRow?.total ?? "0", 10);

  const [lastRankRow] = await db
    .select({ rank: rankUpgrades.rank })
    .from(rankUpgrades)
    .where(eq(rankUpgrades.userId, userId))
    .orderBy(desc(rankUpgrades.achievedAt))
    .limit(1);

  const prevRankName = lastRankRow?.rank ?? "Private";
  const { rank: newRankName } = getRankFromXp(newLifetimeXp, cfg);

  let rankUp: string | null = null;
  if (newRankName !== prevRankName) {
    rankUp = newRankName;
    await db.insert(rankUpgrades).values({ userId, rank: newRankName });
  }

  return { awarded: true, dailyPoints, signupBonus, streakBonus, streak: newStreak, rankUp };
}

export async function getRankHistoryAction(): Promise<RankUpgradeRow[] | null> {
  const session = await auth();
  if (!session?.user?.id) return null;
  return getUserRankHistory(session.user.id);
}

export async function getPointHistoryAction(opts: {
  page: number;
  type?: string;
  dateRange?: "7d" | "30d" | "90d" | "all";
}): Promise<{ rows: PointTxRow[]; total: number; pageCount: number } | null> {
  const session = await auth();
  if (!session?.user?.id) return null;
  return getUserPointHistory(session.user.id, opts);
}
