"use server";

import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { users, matchupComments, entityComments, pointTransactions, notifications } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

type AdminOrMod = "admin" | "moderator";

function requireRole(role: string | undefined, allowed: AdminOrMod[]): boolean {
  return allowed.includes(role as AdminOrMod);
}

// ---------------------------------------------------------------------------
// User management (admin only)
// ---------------------------------------------------------------------------

export async function setUserRoleAction(
  targetUserId: string,
  role: "user" | "moderator" | "banned",
): Promise<void> {
  const session = await auth();
  if ((session?.user as any)?.role !== "admin") return;
  if (!session?.user?.id || targetUserId === session.user.id) return;

  await db.update(users).set({ role }).where(eq(users.id, targetUserId));
  revalidatePath("/admin/users");
}

export async function setPatronAction(
  targetUserId: string,
  isPatron: boolean,
): Promise<void> {
  const session = await auth();
  if ((session?.user as any)?.role !== "admin") return;

  await db.update(users).set({ isPatron }).where(eq(users.id, targetUserId));
  revalidatePath("/admin/users");
}

export async function setPostingRestrictionAction(
  targetUserId: string,
  until: string | null,
): Promise<void> {
  const session = await auth();
  if (!requireRole((session?.user as any)?.role, ["admin", "moderator"])) return;

  const restrictedUntil = until ? new Date(until) : null;
  await db.update(users).set({ restrictedUntil }).where(eq(users.id, targetUserId));
  revalidatePath("/admin/users");
}

// ---------------------------------------------------------------------------
// Comment moderation (admin + moderator)
// ---------------------------------------------------------------------------

export async function deleteCommentAction(
  commentId: string,
  commentType: "matchup" | "entity",
  targetSlug: string,
): Promise<{ ok: boolean }> {
  const session = await auth();
  if (!requireRole((session?.user as any)?.role, ["admin", "moderator"])) return { ok: false };

  if (commentType === "matchup") {
    await db.delete(matchupComments).where(eq(matchupComments.id, commentId));
    revalidatePath(`/battles/${targetSlug}`);
  } else {
    await db.delete(entityComments).where(eq(entityComments.id, commentId));
    revalidatePath(`/characters/${targetSlug}`);
  }
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Manual point adjustment (admin only)
// ---------------------------------------------------------------------------

export async function manualPointAdjustAction(
  targetUserId: string,
  amount: number,
  note: string,
): Promise<void> {
  const session = await auth();
  if ((session?.user as any)?.role !== "admin") return;

  if (!amount || Math.abs(amount) > 100_000 || !note.trim()) return;

  const [tx] = await db.insert(pointTransactions).values({
    userId:        targetUserId,
    amount,
    type:          "admin_adjustment",
    referenceType: null,
    referenceId:   null,
    note:          note.trim(),
  }).returning({ id: pointTransactions.id });

  if (tx) {
    await db.insert(notifications).values({
      userId:        targetUserId,
      type:          "admin_point_adjustment",
      referenceId:   tx.id,
      referenceType: null,
    }).catch(() => {});
  }

  revalidatePath("/admin/users");
}
