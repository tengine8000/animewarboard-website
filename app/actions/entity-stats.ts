"use server";

import { auth } from "@/auth";
import { db } from "@/db";
import { communityEntityStats, attributes } from "@/db/schema";
import { inArray, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function submitEntityStatsAction(
  variantId: string,
  entitySlug: string,
  statValues: Record<string, number>,
) {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: "not_authenticated" as const };

  const userId = session.user.id;
  const slugs  = Object.keys(statValues);
  if (slugs.length === 0) return { ok: false, error: "no_stats" as const };

  // Resolve slug → attributeId (only for attributes that belong to this variant's category)
  const attrRows = await db
    .select({ id: attributes.id, slug: attributes.slug })
    .from(attributes)
    .where(inArray(attributes.slug, slugs));

  if (attrRows.length === 0) return { ok: false, error: "invalid_stats" as const };

  // Upsert one row per attribute
  await db
    .insert(communityEntityStats)
    .values(
      attrRows.map((a) => ({
        variantId,
        attributeId: a.id,
        userId,
        value:       Math.max(0, Math.min(100, Math.round(statValues[a.slug] ?? 50))),
      }))
    )
    .onConflictDoUpdate({
      target: [communityEntityStats.variantId, communityEntityStats.attributeId, communityEntityStats.userId],
      set:    { value: sql`excluded.value`, updatedAt: new Date() },
    });

  revalidatePath(`/characters/${entitySlug}`);
  return { ok: true as const };
}
