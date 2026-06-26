"use server";

import { auth } from "@/auth";
import { db } from "@/db";
import { communityEntityStats, attributes, pointTransactions, adminSettings } from "@/db/schema";
import { inArray, sql, eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function submitEntityStatsAction(
  variantId: string,
  entitySlug: string,
  statValues: Record<string, number>,
): Promise<{ ok: true; pointsAwarded: number } | { ok: false; error: string }> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: "not_authenticated" };

  const userId = session.user.id;
  const slugs  = Object.keys(statValues);
  if (slugs.length === 0) return { ok: false, error: "no_stats" };

  // Resolve slug → attributeId
  const attrRows = await db
    .select({ id: attributes.id, slug: attributes.slug })
    .from(attributes)
    .where(inArray(attributes.slug, slugs));

  if (attrRows.length === 0) return { ok: false, error: "invalid_stats" };

  // Check if this is a first submission (for point award)
  const [existing] = await db
    .select({ id: communityEntityStats.id })
    .from(communityEntityStats)
    .where(and(
      eq(communityEntityStats.userId, userId),
      eq(communityEntityStats.variantId, variantId),
    ))
    .limit(1);
  const isFirstSubmission = !existing;

  // Upsert one row per attribute
  await db
    .insert(communityEntityStats)
    .values(
      attrRows.map((a) => ({
        variantId,
        attributeId: a.id,
        userId,
        value: Math.max(0, Math.min(100, Math.round(statValues[a.slug] ?? 50))),
      }))
    )
    .onConflictDoUpdate({
      target: [communityEntityStats.variantId, communityEntityStats.attributeId, communityEntityStats.userId],
      set:    { value: sql`excluded.value`, updatedAt: new Date() },
    });

  // Award XP only on first submission
  let pointsAwarded = 0;
  if (isFirstSubmission) {
    const [cfg] = await db
      .select({ value: adminSettings.value })
      .from(adminSettings)
      .where(eq(adminSettings.key, "entity_stat_rating_points"))
      .limit(1);
    pointsAwarded = cfg?.value ?? 5;
    await db.insert(pointTransactions).values({
      userId,
      amount:        pointsAwarded,
      type:          "entity_stat_rated",
      referenceType: "entity",
      note:          "First community stat rating submission",
    });
  }

  revalidatePath(`/characters/${entitySlug}`);
  return { ok: true, pointsAwarded };
}
