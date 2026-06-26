import type { MetadataRoute } from "next";
import { db } from "@/db";
import { categories, entities } from "@/db/schema";
import { eq, asc, isNull, and } from "drizzle-orm";

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://animewarboard.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Find the Anime parent category
  const [anime] = await db
    .select({ id: categories.id })
    .from(categories)
    .where(and(isNull(categories.parentId), eq(categories.slug, "anime")))
    .limit(1);

  const [series, chars] = await Promise.all([
    anime
      ? db
          .select({ slug: categories.slug })
          .from(categories)
          .where(eq(categories.parentId, anime.id))
          .orderBy(asc(categories.name))
      : Promise.resolve([]),
    db
      .select({ slug: entities.slug })
      .from(entities)
      .where(eq(entities.status, "approved"))
      .orderBy(asc(entities.name)),
  ]);

  return [
    { url: BASE, changeFrequency: "daily", priority: 1 },
    ...series.map((s) => ({
      url: `${BASE}/anime/${s.slug}`,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    ...chars.map((c) => ({
      url: `${BASE}/characters/${c.slug}`,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
  ];
}
