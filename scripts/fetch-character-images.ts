/**
 * Fetches character images from the Jikan API (unofficial MAL API)
 * and updates entity imageUrl + imageSourceUrl in the DB.
 *
 * run: npm run fetch:images
 *
 * Rate limit: Jikan allows ~3 req/s. This script sleeps 400ms between calls.
 * Images are stored as cdn.myanimelist.net URLs (already in next.config.ts allowlist).
 */

import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { eq } from "drizzle-orm";
import { entities } from "../db/schema";

const client = postgres(process.env.DATABASE_URL!, { max: 1 });
const db = drizzle(client);

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function fetchCharacterImage(name: string): Promise<{ imageUrl: string; sourceUrl: string } | null> {
  const url = `https://api.jikan.moe/v4/characters?q=${encodeURIComponent(name)}&limit=3`;
  try {
    const res = await fetch(url);
    if (!res.ok) {
      console.warn(`  ⚠ Jikan ${res.status} for "${name}"`);
      return null;
    }
    const json = await res.json() as {
      data: Array<{
        name: string;
        images: { jpg: { image_url: string } };
        url: string;
      }>;
    };

    // Pick the best match (exact or closest)
    const candidates = json.data ?? [];
    const exact = candidates.find((c) =>
      c.name.toLowerCase() === name.toLowerCase()
    );
    const pick = exact ?? candidates[0];
    if (!pick) return null;

    return {
      imageUrl:  pick.images.jpg.image_url,
      sourceUrl: pick.url,
    };
  } catch (err) {
    console.warn(`  ⚠ fetch error for "${name}":`, (err as Error).message);
    return null;
  }
}

async function main() {
  const allEntities = await db.select({ id: entities.id, name: entities.name, imageUrl: entities.imageUrl }).from(entities);

  const toFetch = allEntities.filter((e) => !e.imageUrl);
  console.log(`Found ${allEntities.length} characters, ${toFetch.length} missing images.`);

  let updated = 0;
  for (const entity of toFetch) {
    process.stdout.write(`  Fetching: ${entity.name}... `);
    const result = await fetchCharacterImage(entity.name);

    if (result) {
      await db.update(entities)
        .set({ imageUrl: result.imageUrl, imageSourceUrl: result.sourceUrl })
        .where(eq(entities.id, entity.id));
      console.log(`✓ ${result.imageUrl.slice(0, 60)}...`);
      updated++;
    } else {
      console.log("✗ no result");
    }

    await sleep(450); // stay under Jikan rate limit
  }

  console.log(`\n✅ Done. Updated ${updated}/${toFetch.length} characters.`);
  await client.end();
}

main().catch((err) => { console.error(err); process.exit(1); });
