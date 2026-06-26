import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { entityVariants, entities, categories } from "@/db/schema";
import { eq, ilike, and } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (!q || q.length < 2) return NextResponse.json([]);

  const rows = await db
    .select({
      variantId:   entityVariants.id,
      variantName: entityVariants.name,
      entityName:  entities.name,
      entitySlug:  entities.slug,
      seriesName:  categories.name,
      imageUrl:    entityVariants.imageUrl,
    })
    .from(entityVariants)
    .innerJoin(entities,   eq(entityVariants.entityId, entities.id))
    .innerJoin(categories, eq(entities.categoryId, categories.id))
    .where(and(
      eq(entities.status, "approved"),
      ilike(entities.name, `%${q}%`)
    ))
    .orderBy(entities.name)
    .limit(8);

  return NextResponse.json(rows);
}
