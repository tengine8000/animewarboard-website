"use server";

import { auth } from "@/auth";
import { db } from "@/db";
import { users, pointTransactions, adminSettings } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

export async function awardDailyLoginAction(): Promise<{ awarded: boolean; points?: number }> {
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

  // Load the three relevant settings in one query
  const cfgRows = await db
    .select({ key: adminSettings.key, value: adminSettings.value })
    .from(adminSettings)
    .where(sql`${adminSettings.key} IN ('daily_login_points', 'login_streak_bonus_day', 'streak_bonus_multiplier')`);
  const cfg = Object.fromEntries(cfgRows.map((r) => [r.key, r.value]));

  const dailyPoints      = cfg.daily_login_points      ?? 10;
  const streakBonusDay   = cfg.login_streak_bonus_day  ?? 7;
  const streakMultiplier = cfg.streak_bonus_multiplier ?? 2;

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

  let totalAwarded = dailyPoints;

  // Streak bonus fires on every multiple of streakBonusDay (day 7, 14, 21, …)
  if (newStreak % streakBonusDay === 0) {
    const bonusPoints = dailyPoints * (streakMultiplier - 1);
    await db.insert(pointTransactions).values({
      userId,
      amount:        bonusPoints,
      type:          "streak_bonus",
      referenceType: "system",
      note:          `${newStreak}-day streak bonus`,
    });
    totalAwarded += bonusPoints;
  }

  return { awarded: true, points: totalAwarded };
}
