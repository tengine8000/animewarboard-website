import { db } from "@/db";
import { matchups } from "@/db/schema";
import { eq } from "drizzle-orm";

const ALPHABET = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";

function randomCode(): string {
  let suffix = "";
  for (let i = 0; i < 7; i++) {
    suffix += ALPHABET[Math.floor(Math.random() * 36)];
  }
  return `AWB-${suffix}`;
}

export async function generateUniqueBattleCode(): Promise<string> {
  for (let attempt = 0; attempt < 10; attempt++) {
    const code = randomCode();
    const [existing] = await db
      .select({ id: matchups.id })
      .from(matchups)
      .where(eq(matchups.code, code))
      .limit(1);
    if (!existing) return code;
  }
  throw new Error("Could not generate a unique battle code after 10 attempts.");
}

export async function getMatchupByCode(rawCode: string) {
  const code = rawCode.toUpperCase().startsWith("AWB-")
    ? rawCode.toUpperCase()
    : `AWB-${rawCode.toUpperCase()}`;
  const [row] = await db
    .select({ slug: matchups.slug })
    .from(matchups)
    .where(eq(matchups.code, code))
    .limit(1);
  return row ?? null;
}
