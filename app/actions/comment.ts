"use server";

import { auth } from "@/auth";
import { db } from "@/db";
import { matchupComments, entityComments, commentVotes } from "@/db/schema";
import { and, desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export type CommentResult = { ok: boolean; error?: string };

export async function postCommentAction(
  type:       "matchup" | "entity",
  targetId:   string,
  targetSlug: string,
  body:       string,
  parentId?:  string
): Promise<CommentResult> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: "not_authenticated" };

  const trimmed = body.trim();
  if (trimmed.length < 3)    return { ok: false, error: "too_short" };
  if (trimmed.length > 2000) return { ok: false, error: "too_long" };

  const userId = session.user.id;

  // 30-second rate limit — check latest comment by this user across both tables
  const table = type === "matchup" ? matchupComments : entityComments;
  const [last] = await db
    .select({ createdAt: table.createdAt })
    .from(table)
    .where(eq(table.userId, userId))
    .orderBy(desc(table.createdAt))
    .limit(1);

  if (last && Date.now() - last.createdAt.getTime() < 30_000) {
    return { ok: false, error: "rate_limited" };
  }

  try {
    if (type === "matchup") {
      await db.insert(matchupComments).values({
        matchupId: targetId, userId, body: trimmed, parentId: parentId ?? null,
      });
    } else {
      await db.insert(entityComments).values({
        entityId: targetId, userId, body: trimmed, parentId: parentId ?? null,
      });
    }
  } catch {
    return { ok: false, error: "db_error" };
  }

  const path = type === "matchup" ? `/battles/${targetSlug}` : `/characters/${targetSlug}`;
  revalidatePath(path);
  return { ok: true };
}

export async function toggleCommentVoteAction(
  commentId:   string,
  targetSlug:  string,
  commentType: "matchup" | "entity",
  value:       1 | -1
): Promise<{ ok: boolean }> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false };

  try {
    const [existing] = await db
      .select({ id: commentVotes.id, value: commentVotes.value })
      .from(commentVotes)
      .where(and(
        eq(commentVotes.commentId, commentId),
        eq(commentVotes.commentType, commentType),
        eq(commentVotes.userId, session.user.id)
      ))
      .limit(1);

    if (existing?.value === value) {
      await db.delete(commentVotes).where(eq(commentVotes.id, existing.id));
    } else {
      await db
        .insert(commentVotes)
        .values({ commentId, commentType, userId: session.user.id, value })
        .onConflictDoUpdate({
          target: [commentVotes.commentId, commentVotes.commentType, commentVotes.userId],
          set: { value },
        });
    }
  } catch {
    return { ok: false };
  }

  const path = commentType === "matchup" ? `/battles/${targetSlug}` : `/characters/${targetSlug}`;
  revalidatePath(path);
  return { ok: true };
}
