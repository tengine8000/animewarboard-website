"use server";

import { auth } from "@/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export type UpdateDisplayNameResult =
  | { ok: true; name: string }
  | { ok: false; error: string };

export async function updateDisplayNameAction(name: string): Promise<UpdateDisplayNameResult> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: "Not authenticated." };

  const trimmed = name.trim();
  if (trimmed.length < 2 || trimmed.length > 50) {
    return { ok: false, error: "Display name must be 2–50 characters." };
  }

  await db.update(users).set({ name: trimmed }).where(eq(users.id, session.user.id));
  return { ok: true, name: trimmed };
}
