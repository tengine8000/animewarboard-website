"use server";

import { createHash } from "crypto";
import { auth } from "@/auth";
import { db } from "@/db";
import { matchups, matchupParticipants, entityVariants, entities, categories } from "@/db/schema";
import { eq, inArray } from "drizzle-orm";
import { redirect } from "next/navigation";
import { getUserPointSummary } from "@/lib/points";
import { CORPORAL_RANK_INDEX, type RankName } from "@/lib/ranks";

type CreateMatchupPayload = {
  sideAVariantIds: string[];
  sideBVariantIds: string[];
  sideALabel?: string;
  sideBLabel?: string;
};

type CreateMatchupResult =
  | { ok: true;  slug: string }
  | { ok: false; error: "rank_gate"; required: RankName; current: RankName; xpNeeded: number | null }
  | { ok: false; error: string };

function computeCanonicalHash(sideA: string[], sideB: string[]): string {
  const a = [...sideA].sort().join(",");
  const b = [...sideB].sort().join(",");
  const [first, second] = a <= b ? [a, b] : [b, a];
  return createHash("sha256").update(`${first}::${second}`).digest("hex");
}

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

async function uniqueSlug(base: string): Promise<string> {
  let candidate = base;
  let suffix = 2;
  while (true) {
    const [exists] = await db.select({ id: matchups.id }).from(matchups).where(eq(matchups.slug, candidate)).limit(1);
    if (!exists) return candidate;
    candidate = `${base}-${suffix++}`;
  }
}

export async function createMatchupAction(payload: CreateMatchupPayload): Promise<CreateMatchupResult> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: "not_authenticated" };

  const { rankIndex, rank, xpToNext } = await getUserPointSummary(session.user.id);
  if (rankIndex < CORPORAL_RANK_INDEX) {
    return { ok: false, error: "rank_gate", required: "Corporal", current: rank, xpNeeded: xpToNext };
  }

  const { sideAVariantIds, sideBVariantIds, sideALabel, sideBLabel } = payload;

  if (sideAVariantIds.length === 0) return { ok: false, error: "Side A needs at least one character." };
  if (sideBVariantIds.length === 0) return { ok: false, error: "Side B needs at least one character." };

  const allIds = [...sideAVariantIds, ...sideBVariantIds];

  // Validate no variant appears on both sides
  const sideASet = new Set(sideAVariantIds);
  for (const id of sideBVariantIds) {
    if (sideASet.has(id)) return { ok: false, error: "The same character can't be on both sides." };
  }

  // Fetch variant info (names for slug, categoryId for matchup)
  const variantRows = await db
    .select({
      id:         entityVariants.id,
      name:       entityVariants.name,
      categoryId: categories.id,
    })
    .from(entityVariants)
    .innerJoin(entities,   eq(entityVariants.entityId, entities.id))
    .innerJoin(categories, eq(entities.categoryId, categories.id))
    .where(inArray(entityVariants.id, allIds));

  if (variantRows.length !== allIds.length) {
    return { ok: false, error: "One or more characters not found." };
  }

  const variantMap = Object.fromEntries(variantRows.map((v) => [v.id, v]));

  // All variants must be from the same top-level category
  const categoryIds = [...new Set(variantRows.map((v) => v.categoryId))];
  if (categoryIds.length > 1) {
    return { ok: false, error: "All characters must be from the same universe category." };
  }
  const categoryId = categoryIds[0];

  // Compute canonical hash
  const canonicalHash = computeCanonicalHash(sideAVariantIds, sideBVariantIds);

  // Check for existing matchup
  const [existing] = await db
    .select({ slug: matchups.slug })
    .from(matchups)
    .where(eq(matchups.canonicalHash, canonicalHash))
    .limit(1);

  if (existing) {
    return { ok: true, slug: existing.slug };
  }

  // Build slug from participant names
  const namesA = sideAVariantIds.map((id) => variantMap[id]?.name ?? "").join(" and ");
  const namesB = sideBVariantIds.map((id) => variantMap[id]?.name ?? "").join(" and ");
  const baseSlug = slugify(`${namesA}-vs-${namesB}`).slice(0, 80);
  const slug = await uniqueSlug(baseSlug);

  // Determine labels (only set if multiple participants on that side)
  const labelA = sideALabel?.trim() || (sideAVariantIds.length > 1 ? sideALabel ?? null : null);
  const labelB = sideBLabel?.trim() || (sideBVariantIds.length > 1 ? sideBLabel ?? null : null);

  // Insert matchup + participants
  await db.transaction(async (tx) => {
    const [matchup] = await tx
      .insert(matchups)
      .values({
        categoryId,
        slug,
        canonicalHash,
        sideALabel: labelA ?? null,
        sideBLabel: labelB ?? null,
        createdBy: session.user!.id!,
      })
      .returning({ id: matchups.id });

    const participants = [
      ...sideAVariantIds.map((variantId, i) => ({ matchupId: matchup.id, side: "a" as const, variantId, sortOrder: i })),
      ...sideBVariantIds.map((variantId, i) => ({ matchupId: matchup.id, side: "b" as const, variantId, sortOrder: i })),
    ];

    await tx.insert(matchupParticipants).values(participants);
  });

  return { ok: true, slug };
}
