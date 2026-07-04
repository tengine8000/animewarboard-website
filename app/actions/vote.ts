"use server";

import { auth } from "@/auth";
import { db } from "@/db";
import { votes, voteAttributes, attributes, matchups, pointTransactions, users } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getAdminSettings } from "@/lib/points";

export type VotePayload = {
  matchupId:   string;
  matchupSlug: string;
  verdict:     "a" | "b" | "draw";
  difficulty:  "very_easy" | "easy" | "medium" | "hard" | "extreme";
  statValues:  Record<string, number>;
};

export type VoteResult =
  | { ok: true; voteId: string }
  | { ok: false; error: "not_authenticated" | "invalid_payload" | "db_error" };

export async function submitVoteAction(payload: VotePayload): Promise<VoteResult> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: "not_authenticated" };

  const { matchupId, matchupSlug, verdict, difficulty, statValues } = payload;
  if (!matchupId || !verdict || !difficulty) return { ok: false, error: "invalid_payload" };

  const userId = session.user.id;

  let voteId: string;

  try {
    // Check if this is the voter's first vote on this matchup (before upsert)
    const [existingVote] = await db
      .select({ id: votes.id })
      .from(votes)
      .where(and(eq(votes.matchupId, matchupId), eq(votes.userId, userId)))
      .limit(1);
    const isFirstVote = !existingVote;

    // 1. Upsert verdict + difficulty — return id so the client can link to the share page
    const [voteRow] = await db
      .insert(votes)
      .values({ matchupId, userId, verdict, difficulty })
      .onConflictDoUpdate({
        target: [votes.matchupId, votes.userId],
        set: { verdict, difficulty },
      })
      .returning({ id: votes.id });
    voteId = voteRow.id;

    // Award XP to the battle creator on the voter's first vote
    if (isFirstVote) {
      const [matchupRow] = await db
        .select({ createdBy: matchups.createdBy })
        .from(matchups)
        .where(eq(matchups.id, matchupId))
        .limit(1);

      if (matchupRow?.createdBy && matchupRow.createdBy !== userId) {
        const settings = await getAdminSettings();
        const amount = settings["battle_vote_points"] ?? 2;
        if (amount > 0) {
          const [voterRow] = await db
            .select({ username: users.username, name: users.name })
            .from(users)
            .where(eq(users.id, userId))
            .limit(1);
          const voterHandle = voterRow?.username
            ? `@${voterRow.username}`
            : voterRow?.name ?? `user:${userId.slice(0, 8)}`;
          await db.insert(pointTransactions).values({
            userId:        matchupRow.createdBy,
            amount,
            type:          "battle_vote_received",
            referenceId:   matchupId,
            referenceType: "matchup",
            note:          `Vote by ${voterHandle}`,
          });
        }
      }
    }

    // 2. Persist slider values into vote_attributes
    if (statValues && Object.keys(statValues).length > 0) {
      const attrRows = await db
        .select({ id: attributes.id, slug: attributes.slug })
        .from(attributes);

      const slugToId = Object.fromEntries(attrRows.map((a) => [a.slug, a.id]));

      const rows = Object.entries(statValues)
        .filter(([slug]) => slugToId[slug])
        .map(([slug, scoreA]) => ({
          matchupId,
          userId,
          attributeId: slugToId[slug],
          scoreA: Math.max(0, Math.min(100, Math.round(scoreA))) as number,
        }));

      if (rows.length > 0) {
        await db
          .insert(voteAttributes)
          .values(rows)
          .onConflictDoUpdate({
            target: [voteAttributes.matchupId, voteAttributes.userId, voteAttributes.attributeId],
            set: { scoreA: sql`excluded.score_a` },
          });
      }
    }
  } catch {
    return { ok: false, error: "db_error" };
  }

  revalidatePath(`/battles/${matchupSlug}`);
  return { ok: true, voteId };
}
