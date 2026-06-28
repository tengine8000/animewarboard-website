"use server";

import { auth } from "@/auth";
import { db } from "@/db";
import { votes, voteAttributes, attributes, matchups } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

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

    // 2. Persist slider values into vote_attributes
    if (statValues && Object.keys(statValues).length > 0) {
      // Resolve attribute slugs → IDs for this matchup's category
      const attrRows = await db
        .select({ id: attributes.id, slug: attributes.slug })
        .from(attributes)
        .innerJoin(matchups, eq(attributes.categoryId, matchups.categoryId))
        .where(eq(matchups.id, matchupId));

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
