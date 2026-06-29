"use server";

import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/db";
import {
  categories, entities, entityVariants, entityStats,
  notifications, users, matchups, matchupParticipants, votes,
} from "@/db/schema";
import { and, eq, isNull, ilike, inArray } from "drizzle-orm";
import { createHash } from "crypto";
import { revalidatePath } from "next/cache";
import { getAnimeAttributes } from "@/lib/queries";

function slugify(str: string): string {
  return str.toLowerCase().trim()
    .replace(/[^\w\s-]/g, "").replace(/[\s_]+/g, "-").replace(/^-+|-+$/g, "");
}

async function uniqueSlug(
  table: typeof entities | typeof categories | typeof entityVariants,
  base: string,
): Promise<string> {
  let slug = slugify(base);
  let [existing] = await db.select({ id: (table as typeof entities).id })
    .from(table as typeof entities)
    .where(ilike((table as typeof entities).slug, slug))
    .limit(1);
  if (existing) slug = `${slug}-${Date.now().toString(36)}`;
  return slug;
}

function requireAdmin() {
  // auth() called at top of each action
}

// ---------------------------------------------------------------------------
// Create Series
// ---------------------------------------------------------------------------

export async function createSeriesAction(fd: FormData): Promise<void> {
  const session = await auth();
  if ((session?.user as any)?.role !== "admin") redirect("/");

  const name        = ((fd.get("name") as string) ?? "").trim();
  const description = (fd.get("description") as string | null)?.trim() || null;
  const coverImage  = (fd.get("coverImage") as string | null) || null;

  if (!name) redirect("/admin/series/new?error=name_required");

  const [anime] = await db
    .select({ id: categories.id })
    .from(categories)
    .where(and(isNull(categories.parentId), eq(categories.slug, "anime")))
    .limit(1);
  if (!anime) redirect("/admin/series/new?error=no_parent");

  const slug = await uniqueSlug(categories, name);
  await db.insert(categories).values({ parentId: anime.id, name, slug, description, coverImage });

  revalidatePath("/anime");
  redirect("/admin/series/new?success=1");
}

// ---------------------------------------------------------------------------
// Create Character
// ---------------------------------------------------------------------------

export async function createCharacterAction(fd: FormData): Promise<void> {
  const session = await auth();
  if ((session?.user as any)?.role !== "admin") redirect("/");
  const userId = session!.user!.id;

  const name        = ((fd.get("name") as string) ?? "").trim();
  const categoryId  = (fd.get("categoryId") as string | null) ?? "";
  const bio         = (fd.get("bio") as string | null)?.trim() || null;
  const variantName = ((fd.get("variantName") as string | null)?.trim()) || "Base";
  const imageUrl    = (fd.get("imageUrl") as string | null) || null;

  if (!name || !categoryId) redirect("/admin/characters/new?error=missing_fields");

  const entitySlug  = await uniqueSlug(entities, name);
  const variantSlug = await uniqueSlug(entityVariants, `${name}-${variantName}`);

  const [entity] = await db.insert(entities).values({
    categoryId,
    name,
    slug:      entitySlug,
    bio,
    imageUrl,
    status:    "approved",
    createdBy: userId,
  }).returning({ id: entities.id });

  const [variant] = await db.insert(entityVariants).values({
    entityId:  entity.id,
    name:      variantName,
    slug:      variantSlug,
    imageUrl,
    isDefault: true,
  }).returning({ id: entityVariants.id });

  // Insert stat rows for all attributes that have a value in the form
  const attrs = await getAnimeAttributes();
  const statRows = attrs
    .map((a) => {
      const raw = fd.get(`stat_${a.id}`) as string | null;
      const val = raw ? Math.max(0, Math.min(100, parseInt(raw, 10))) : 50;
      return { variantId: variant.id, attributeId: a.id, value: val };
    });
  if (statRows.length) await db.insert(entityStats).values(statRows);

  revalidatePath("/characters");
  redirect("/admin/characters/new?success=1");
}

// ---------------------------------------------------------------------------
// Update Character
// ---------------------------------------------------------------------------

export async function updateCharacterAction(entityId: string, fd: FormData): Promise<void> {
  const session = await auth();
  if ((session?.user as any)?.role !== "admin") redirect("/");

  const name     = ((fd.get("name") as string) ?? "").trim();
  const bio      = (fd.get("bio") as string | null)?.trim() || null;
  const imageUrl = (fd.get("imageUrl") as string | null) || null;
  const status   = (fd.get("status") as string | null) || "approved";

  if (!name) redirect(`/admin/characters/${entityId}/edit?error=name_required`);

  await db.update(entities)
    .set({ name, bio, imageUrl, status: status as "pending" | "approved" | "rejected" })
    .where(eq(entities.id, entityId));

  revalidatePath("/characters");
  revalidatePath("/admin/characters");
  redirect(`/admin/characters/${entityId}/edit?success=1`);
}

// ---------------------------------------------------------------------------
// Delete Character
// ---------------------------------------------------------------------------

export async function deleteCharacterAction(entityId: string): Promise<void> {
  const session = await auth();
  if ((session?.user as any)?.role !== "admin") redirect("/");

  await db.delete(entities).where(eq(entities.id, entityId));

  revalidatePath("/characters");
  revalidatePath("/admin/characters");
  redirect("/admin/characters?deleted=1");
}

// ---------------------------------------------------------------------------
// Update Series
// ---------------------------------------------------------------------------

export async function updateSeriesAction(categoryId: string, fd: FormData): Promise<void> {
  const session = await auth();
  if ((session?.user as any)?.role !== "admin") redirect("/");

  const name        = ((fd.get("name") as string) ?? "").trim();
  const description = (fd.get("description") as string | null)?.trim() || null;
  const coverImage  = (fd.get("coverImage") as string | null) || null;

  if (!name) redirect(`/admin/series/${categoryId}/edit?error=name_required`);

  await db.update(categories)
    .set({ name, description, coverImage })
    .where(eq(categories.id, categoryId));

  revalidatePath("/anime");
  revalidatePath("/admin/series");
  redirect(`/admin/series/${categoryId}/edit?success=1`);
}

// ---------------------------------------------------------------------------
// Delete Series
// ---------------------------------------------------------------------------

export async function deleteSeriesAction(categoryId: string): Promise<void> {
  const session = await auth();
  if ((session?.user as any)?.role !== "admin") redirect("/");

  await db.delete(categories).where(eq(categories.id, categoryId));

  revalidatePath("/anime");
  revalidatePath("/admin/series");
  redirect("/admin/series?deleted=1");
}

// ---------------------------------------------------------------------------
// Create Variant
// ---------------------------------------------------------------------------

export async function createVariantAction(entityId: string, fd: FormData): Promise<void> {
  const session = await auth();
  if ((session?.user as any)?.role !== "admin") redirect("/");

  const name     = ((fd.get("name") as string) ?? "").trim();
  const imageUrl = (fd.get("imageUrl") as string | null) || null;

  if (!name) redirect(`/admin/characters/${entityId}/variants/new?error=name_required`);

  const variantSlug = await uniqueSlug(entityVariants, `${entityId}-${name}`);

  const [variant] = await db.insert(entityVariants).values({
    entityId,
    name,
    slug:      variantSlug,
    imageUrl,
    isDefault: false,
  }).returning({ id: entityVariants.id });

  const attrs = await getAnimeAttributes();
  const statRows = attrs.map((a) => {
    const raw = fd.get(`stat_${a.id}`) as string | null;
    return { variantId: variant.id, attributeId: a.id, value: Math.max(0, Math.min(100, parseInt(raw ?? "50", 10))) };
  });
  if (statRows.length) await db.insert(entityStats).values(statRows);

  revalidatePath(`/admin/characters/${entityId}/edit`);
  redirect(`/admin/characters/${entityId}/edit?success=1`);
}

// ---------------------------------------------------------------------------
// Update Variant
// ---------------------------------------------------------------------------

export async function updateVariantAction(variantId: string, entityId: string, fd: FormData): Promise<void> {
  const session = await auth();
  if ((session?.user as any)?.role !== "admin") redirect("/");

  const name     = ((fd.get("name") as string) ?? "").trim();
  const imageUrl = (fd.get("imageUrl") as string | null) || null;

  if (!name) redirect(`/admin/characters/${entityId}/variants/${variantId}/edit?error=name_required`);

  await db.update(entityVariants).set({ name, imageUrl }).where(eq(entityVariants.id, variantId));

  const attrs = await getAnimeAttributes();
  for (const a of attrs) {
    const raw = fd.get(`stat_${a.id}`) as string | null;
    if (raw === null) continue;
    const value = Math.max(0, Math.min(100, parseInt(raw, 10)));
    await db.insert(entityStats)
      .values({ variantId, attributeId: a.id, value })
      .onConflictDoUpdate({
        target: [entityStats.variantId, entityStats.attributeId],
        set:    { value },
      });
  }

  revalidatePath(`/admin/characters/${entityId}/edit`);
  redirect(`/admin/characters/${entityId}/variants/${variantId}/edit?success=1`);
}

// ---------------------------------------------------------------------------
// Delete Variant
// ---------------------------------------------------------------------------

export async function deleteVariantAction(variantId: string, entityId: string): Promise<void> {
  const session = await auth();
  if ((session?.user as any)?.role !== "admin") redirect("/");

  // Block if it's the only variant
  const all = await db.select({ id: entityVariants.id }).from(entityVariants).where(eq(entityVariants.entityId, entityId));
  if (all.length <= 1) redirect(`/admin/characters/${entityId}/edit?error=last_variant`);

  await db.delete(entityVariants).where(eq(entityVariants.id, variantId));

  // If the deleted one was the default, promote the first remaining variant
  const [first] = await db.select({ id: entityVariants.id }).from(entityVariants).where(eq(entityVariants.entityId, entityId)).limit(1);
  if (first) await db.update(entityVariants).set({ isDefault: true }).where(eq(entityVariants.id, first.id));

  revalidatePath(`/admin/characters/${entityId}/edit`);
  redirect(`/admin/characters/${entityId}/edit`);
}

// ---------------------------------------------------------------------------
// Set Default Variant
// ---------------------------------------------------------------------------

export async function setDefaultVariantAction(variantId: string, entityId: string): Promise<void> {
  const session = await auth();
  if ((session?.user as any)?.role !== "admin") redirect("/");

  await db.update(entityVariants).set({ isDefault: false }).where(eq(entityVariants.entityId, entityId));
  await db.update(entityVariants).set({ isDefault: true }).where(eq(entityVariants.id, variantId));

  revalidatePath(`/admin/characters/${entityId}/edit`);
  redirect(`/admin/characters/${entityId}/edit`);
}

// ---------------------------------------------------------------------------
// Participant helpers
// ---------------------------------------------------------------------------

function computeCanonicalHash(sideA: string[], sideB: string[]): string {
  const a = [...sideA].sort().join(",");
  const b = [...sideB].sort().join(",");
  const [first, second] = a <= b ? [a, b] : [b, a];
  return createHash("sha256").update(`${first}::${second}`).digest("hex");
}

async function recomputeMatchupHash(matchupId: string): Promise<void> {
  const rows = await db
    .select({ side: matchupParticipants.side, variantId: matchupParticipants.variantId })
    .from(matchupParticipants)
    .where(eq(matchupParticipants.matchupId, matchupId));
  const sideA = rows.filter((r) => r.side === "a").map((r) => r.variantId);
  const sideB = rows.filter((r) => r.side === "b").map((r) => r.variantId);
  const hash  = computeCanonicalHash(sideA, sideB);
  await db.update(matchups).set({ canonicalHash: hash }).where(eq(matchups.id, matchupId));
}

// ---------------------------------------------------------------------------
// Add Participant
// ---------------------------------------------------------------------------

export async function addParticipantAction(
  matchupId: string,
  variantId: string,
  side: "a" | "b",
): Promise<{ ok: true } | { ok: false; error: string }> {
  const session = await auth();
  if ((session?.user as any)?.role !== "admin") return { ok: false, error: "Unauthorized" };

  // Check variant exists and is approved
  const [variant] = await db
    .select({ id: entityVariants.id })
    .from(entityVariants)
    .innerJoin(entities, eq(entityVariants.entityId, entities.id))
    .where(and(eq(entityVariants.id, variantId), eq(entities.status, "approved")))
    .limit(1);
  if (!variant) return { ok: false, error: "Character not found." };

  // No same variant on both sides
  const [alreadyIn] = await db
    .select({ id: matchupParticipants.id })
    .from(matchupParticipants)
    .where(and(eq(matchupParticipants.matchupId, matchupId), eq(matchupParticipants.variantId, variantId)))
    .limit(1);
  if (alreadyIn) return { ok: false, error: "This character is already in the battle." };

  // Compute next sort order for this side
  const existing = await db
    .select({ sortOrder: matchupParticipants.sortOrder })
    .from(matchupParticipants)
    .where(and(eq(matchupParticipants.matchupId, matchupId), eq(matchupParticipants.side, side)));
  const nextOrder = existing.length;

  await db.insert(matchupParticipants).values({ matchupId, variantId, side, sortOrder: nextOrder });
  await recomputeMatchupHash(matchupId);

  revalidatePath(`/admin/battles/${matchupId}/edit`);
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Remove Participant
// ---------------------------------------------------------------------------

export async function removeParticipantAction(
  participantId: string,
  matchupId: string,
  side: "a" | "b",
): Promise<{ ok: true } | { ok: false; error: string }> {
  const session = await auth();
  if ((session?.user as any)?.role !== "admin") return { ok: false, error: "Unauthorized" };

  // Block if this is the last participant on that side
  const sideRows = await db
    .select({ id: matchupParticipants.id })
    .from(matchupParticipants)
    .where(and(eq(matchupParticipants.matchupId, matchupId), eq(matchupParticipants.side, side)));
  if (sideRows.length <= 1) return { ok: false, error: "Each side must have at least one participant." };

  await db.delete(matchupParticipants).where(eq(matchupParticipants.id, participantId));
  await recomputeMatchupHash(matchupId);

  revalidatePath(`/admin/battles/${matchupId}/edit`);
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Update Matchup (side labels)
// ---------------------------------------------------------------------------

export async function updateMatchupAction(matchupId: string, fd: FormData): Promise<void> {
  const session = await auth();
  if ((session?.user as any)?.role !== "admin") redirect("/");

  const sideALabel = (fd.get("sideALabel") as string | null)?.trim() || null;
  const sideBLabel = (fd.get("sideBLabel") as string | null)?.trim() || null;

  await db.update(matchups).set({ sideALabel, sideBLabel }).where(eq(matchups.id, matchupId));

  revalidatePath(`/battles`);
  redirect(`/admin/battles/${matchupId}/edit?success=1`);
}

// ---------------------------------------------------------------------------
// Delete Matchup
// ---------------------------------------------------------------------------

export async function deleteMatchupAction(matchupId: string): Promise<void> {
  const session = await auth();
  if ((session?.user as any)?.role !== "admin") redirect("/");

  await db.delete(matchups).where(eq(matchups.id, matchupId));

  revalidatePath("/battles");
  revalidatePath("/admin/battles");
  redirect("/admin/battles?deleted=1");
}

// ---------------------------------------------------------------------------
// Approve / Reject Entity Submission
// ---------------------------------------------------------------------------

export async function approveEntityAction(entityId: string) {
  const session = await auth();
  if (!["admin", "moderator"].includes((session?.user as any)?.role)) redirect("/");

  const [entity] = await db
    .update(entities)
    .set({ status: "approved" })
    .where(eq(entities.id, entityId))
    .returning({ createdBy: entities.createdBy });

  if (entity?.createdBy) {
    await db.insert(notifications).values({
      userId:        entity.createdBy,
      type:          "entity_approved",
      referenceId:   entityId,
      referenceType: "entity",
    }).catch(() => {});
  }

  revalidatePath("/admin/submissions");
}

export async function rejectEntityAction(entityId: string) {
  const session = await auth();
  if (!["admin", "moderator"].includes((session?.user as any)?.role)) redirect("/");

  const [entity] = await db
    .update(entities)
    .set({ status: "rejected" })
    .where(eq(entities.id, entityId))
    .returning({ createdBy: entities.createdBy });

  if (entity?.createdBy) {
    await db.insert(notifications).values({
      userId:        entity.createdBy,
      type:          "entity_rejected",
      referenceId:   entityId,
      referenceType: "entity",
    }).catch(() => {});
  }

  revalidatePath("/admin/submissions");
}
