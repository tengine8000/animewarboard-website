import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

const ADJECTIVES = [
  "blazing", "silent", "fierce", "cursed", "divine", "phantom", "hollow",
  "eternal", "raging", "frozen", "ancient", "celestial", "shadow", "wild",
  "fallen", "sacred", "rising", "crimson", "jade", "void", "iron", "storm",
  "lost", "dark", "thunder", "chaos", "hidden", "bound", "swift", "burning",
  "golden", "silver", "spectral", "wicked", "noble", "ruthless", "broken",
  "undying", "exiled", "blood", "fated", "cursed", "reborn", "shattered",
];

const NOUNS = [
  "shinigami", "hokage", "saiyan", "shinobi", "ronin", "samurai", "sensei",
  "nakama", "kunoichi", "anbu", "jonin", "chunin", "genin", "kage", "sennin",
  "akatsuki", "titan", "espada", "quincy", "berserk", "dragon", "demon",
  "jinchuuriki", "uchiha", "zanpakuto", "bankai", "tsukuyomi", "jutsu",
  "chakra", "katana", "hollowfied", "alchemist", "paladin", "hunter",
  "berserker", "wanderer", "avenger", "guardian", "reaper", "phantom",
];

function rand<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randNum(): number {
  // 1–999 so it reads naturally: blazing_shinigami_42
  return Math.floor(Math.random() * 999) + 1;
}

function buildCandidate(): string {
  return `${rand(ADJECTIVES)}_${rand(NOUNS)}_${randNum()}`;
}

export async function generateUniqueUsername(): Promise<string> {
  for (let attempt = 0; attempt < 10; attempt++) {
    const candidate = buildCandidate();
    const [existing] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.username, candidate))
      .limit(1);
    if (!existing) return candidate;
  }
  // Extremely unlikely fallback: widen the number range
  return `${rand(ADJECTIVES)}_${rand(NOUNS)}_${Date.now() % 100000}`;
}
