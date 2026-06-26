import { db } from "@/db";
import { pointTransactions, adminSettings } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { getRankFromXp } from "@/lib/ranks";

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
