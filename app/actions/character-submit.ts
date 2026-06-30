"use server";

import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { entities, entityVariants, entityStats } from "@/db/schema";
import { ilike } from "drizzle-orm";
import { getUserPointSummary } from "@/lib/points";
import { SERGEANT_RANK_INDEX } from "@/lib/ranks";
import { getAnimeAttributes } from "@/lib/queries";

function slugify(str: string): string {
  return str.toLowerCase().trim()
    .replace(/[^\w\s-]/g, "").replace(/[\s_]+/g, "-").replace(/^-+|-+$/g, "");
}

async function uniqueSlug(
  table: typeof entities | typeof entityVariants,
  base: string,
): Promise<string> {
  let slug = slugify(base);
  const [existing] = await db
    .select({ id: (table as typeof entities).id })
    .from(table as typeof entities)
    .where(ilike((table as typeof entities).slug, slug))
    .limit(1);
  if (existing) slug = `${slug}-${Date.now().toString(36)}`;
  return slug;
}

export async function submitCharacterAction(fd: FormData): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?returnTo=/characters/submit");

  const { rankIndex } = await getUserPointSummary(session.user.id);
  if (rankIndex < SERGEANT_RANK_INDEX) redirect("/characters/submit?error=rank_gate");

  const name        = ((fd.get("name") as string) ?? "").trim();
  const categoryId  = (fd.get("categoryId") as string | null) ?? "";
  const bio         = (fd.get("bio") as string | null)?.trim() || null;
  const variantName = ((fd.get("variantName") as string | null)?.trim()) || "Base";
  const imageUrl    = (fd.get("imageUrl") as string | null) || null;

  if (!name || !categoryId) redirect("/characters/submit?error=missing_fields");

  const entitySlug  = await uniqueSlug(entities, name);
  const variantSlug = await uniqueSlug(entityVariants, `${name}-${variantName}`);

  const [entity] = await db.insert(entities).values({
    categoryId,
    name,
    slug:      entitySlug,
    bio,
    imageUrl,
    status:    "pending",
    createdBy: session.user.id,
  }).returning({ id: entities.id });

  const [variant] = await db.insert(entityVariants).values({
    entityId:  entity.id,
    name:      variantName,
    slug:      variantSlug,
    imageUrl,
    isDefault: true,
  }).returning({ id: entityVariants.id });

  const attrs = await getAnimeAttributes();
  const statRows = attrs.map((a) => {
    const raw = fd.get(`stat_${a.id}`) as string | null;
    const val = raw ? Math.max(0, Math.min(100, parseInt(raw, 10))) : 50;
    return { variantId: variant.id, attributeId: a.id, value: val };
  });
  if (statRows.length) await db.insert(entityStats).values(statRows);

  revalidatePath("/admin/submissions");
  redirect("/characters/submit?success=1");
}
