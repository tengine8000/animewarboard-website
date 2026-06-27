"use server";

import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/db";
import {
  categories, entities, entityVariants, entityStats,
  notifications, users,
} from "@/db/schema";
import { and, eq, isNull, ilike } from "drizzle-orm";
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
