"use server";

import { auth } from "@/auth";
import { db } from "@/db";
import { users, adminSettings } from "@/db/schema";
import { eq } from "drizzle-orm";

export type UpdateUsernameResult =
  | { ok: true; username: string }
  | { ok: false; error: string };

const USERNAME_RE = /^[a-z0-9_]{3,20}$/;

export async function updateUsernameAction(username: string): Promise<UpdateUsernameResult> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: "Not authenticated." };

  const raw = username.trim().toLowerCase();
  if (!USERNAME_RE.test(raw)) {
    return { ok: false, error: "Username must be 3–20 characters: lowercase letters, numbers, underscores only." };
  }

  const userId = session.user.id;

  // Fetch current user + cooldown setting in parallel
  const [[dbUser], cooldownRow] = await Promise.all([
    db.select({ usernameChangedAt: users.usernameChangedAt }).from(users).where(eq(users.id, userId)).limit(1),
    db.select({ value: adminSettings.value }).from(adminSettings).where(eq(adminSettings.key, "username_change_cooldown_days")).limit(1),
  ]);

  const cooldownDays = cooldownRow[0]?.value ?? 30;

  if (dbUser?.usernameChangedAt) {
    const msSinceLast = Date.now() - new Date(dbUser.usernameChangedAt).getTime();
    const msRequired  = cooldownDays * 24 * 60 * 60 * 1000;
    if (msSinceLast < msRequired) {
      const daysLeft = Math.ceil((msRequired - msSinceLast) / (24 * 60 * 60 * 1000));
      return { ok: false, error: `You can change your username again in ${daysLeft} day${daysLeft === 1 ? "" : "s"}.` };
    }
  }

  // Check uniqueness
  const [taken] = await db.select({ id: users.id }).from(users).where(eq(users.username, raw)).limit(1);
  if (taken && taken.id !== userId) {
    return { ok: false, error: "That username is already taken." };
  }

  await db.update(users).set({ username: raw, usernameChangedAt: new Date() }).where(eq(users.id, userId));
  return { ok: true, username: raw };
}
