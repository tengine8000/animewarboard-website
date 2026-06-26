/**
 * seeds:
 *  - search_vec triggers (idempotent)
 *  - Anime top-level category
 *  - Naruto, Bleach, One Piece series
 *  - 9 attributes (Speed, Strength, Durability, Stamina, Battle IQ, Range, Regen, Hax, Versatility)
 *  - 30 characters across the three series (10 each)
 *  - variants per character (default + key forms)
 *  - entity_stats for each default variant
 *  - 8 matchups (incl. 1 team match: Naruto+Sasuke vs Madara)
 *
 * run: npm run seed:content
 * safe to re-run — all upserts use onConflict
 */

import "dotenv/config";
import crypto from "crypto";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { sql } from "drizzle-orm";
import {
  categories, attributes, entities, entityVariants, entityStats, matchups, matchupParticipants,
} from "../db/schema";

const client = postgres(process.env.DATABASE_URL!, { max: 1 });
const db = drizzle(client);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function slug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function canonicalHash(sideA: string[], sideB: string[]): string {
  const a = [...sideA].sort().join("|");
  const b = [...sideB].sort().join("|");
  const [first, second] = [a, b].sort();
  return crypto.createHash("sha256").update(`${first}::${second}`).digest("hex");
}

async function upsertCategory(vals: typeof categories.$inferInsert) {
  const [row] = await db.insert(categories).values(vals)
    .onConflictDoUpdate({ target: categories.slug, set: { name: vals.name } })
    .returning();
  return row;
}

async function upsertAttribute(vals: typeof attributes.$inferInsert) {
  const [row] = await db.insert(attributes).values(vals)
    .onConflictDoUpdate({ target: [attributes.categoryId, attributes.slug], set: { name: vals.name } })
    .returning();
  return row;
}

async function upsertEntity(vals: typeof entities.$inferInsert) {
  const [row] = await db.insert(entities).values(vals)
    .onConflictDoUpdate({
      target: entities.slug,
      set: { name: vals.name, bio: vals.bio, status: "approved" },
    })
    .returning();
  return row;
}

async function upsertVariant(vals: typeof entityVariants.$inferInsert) {
  const [row] = await db.insert(entityVariants).values(vals)
    .onConflictDoUpdate({ target: entityVariants.slug, set: { name: vals.name } })
    .returning();
  return row;
}

async function upsertStat(vals: typeof entityStats.$inferInsert) {
  await db.insert(entityStats).values(vals)
    .onConflictDoUpdate({
      target: [entityStats.variantId, entityStats.attributeId],
      set: { value: vals.value },
    });
}

async function upsertMatchup(vals: typeof matchups.$inferInsert) {
  const [row] = await db.insert(matchups).values(vals)
    .onConflictDoUpdate({ target: matchups.canonicalHash, set: { slug: vals.slug } })
    .returning();
  return row;
}

async function upsertParticipant(vals: typeof matchupParticipants.$inferInsert) {
  await db.insert(matchupParticipants).values(vals)
    .onConflictDoNothing();
}

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

const ATTRS = [
  { name: "Speed",        slug: "speed",        sort: 0, desc: "Raw movement speed and reaction time" },
  { name: "Strength",     slug: "strength",     sort: 1, desc: "Physical striking power and lifting force" },
  { name: "Durability",   slug: "durability",   sort: 2, desc: "Ability to take damage and keep fighting" },
  { name: "Stamina",      slug: "stamina",      sort: 3, desc: "How long they can sustain peak performance" },
  { name: "Battle IQ",    slug: "battle-iq",    sort: 4, desc: "In-fight intelligence and adaptability" },
  { name: "Range",        slug: "range",        sort: 5, desc: "Maximum effective attack distance" },
  { name: "Regeneration", slug: "regeneration", sort: 6, desc: "Speed and extent of healing during battle" },
  { name: "Hax",          slug: "hax",          sort: 7, desc: "Broken or hard-to-counter abilities (reality warping, time manipulation, etc.)" },
  { name: "Versatility",  slug: "versatility",  sort: 8, desc: "Breadth of fighting styles and adapting to opponents" },
];

type Stats = [number, number, number, number, number, number, number, number, number];
//           speed  str    dur    stam   biq    range  regen  hax    vers

const NARUTO_CHARS: {
  name: string;
  bio: string;
  variants: { name: string; isDefault: boolean; stats: Stats }[];
}[] = [
  {
    name: "Naruto Uzumaki",
    bio: "The Seventh Hokage of Konohagakure and jinchūriki of Kurama, the Nine-Tails. Once shunned as an orphan, he defied every expectation through sheer willpower and the power of bonds, becoming the strongest shinobi in history. His Baryon Mode — burning his and Kurama's chakra as fuel — is his most terrifying form.",
    variants: [
      { name: "Base",                    isDefault: true,  stats: [88, 82, 82, 95, 70, 80, 80, 75, 85] },
      { name: "Sage Mode",               isDefault: false, stats: [92, 88, 88, 88, 82, 85, 82, 82, 88] },
      { name: "Nine-Tails Chakra Mode",  isDefault: false, stats: [96, 92, 90, 92, 74, 88, 88, 86, 90] },
      { name: "Baryon Mode",             isDefault: false, stats: [98, 95, 90, 40, 72, 85, 65, 88, 90] },
    ],
  },
  {
    name: "Sasuke Uchiha",
    bio: "Sole surviving loyal member of the Uchiha clan and Naruto's eternal rival. A prodigy from birth, his Mangekyō Sharingan and later Rinnegan make him one of the most versatile fighters alive. After years as Konoha's shadow protector, his analytical genius and mastery of dōjutsu are unmatched.",
    variants: [
      { name: "Base",                isDefault: true,  stats: [90, 82, 80, 82, 94, 82, 65, 85, 88] },
      { name: "Mangekyō Sharingan",  isDefault: false, stats: [93, 84, 82, 82, 96, 88, 68, 92, 90] },
      { name: "Rinnegan",            isDefault: false, stats: [97, 88, 88, 88, 96, 95, 70, 96, 94] },
    ],
  },
  {
    name: "Itachi Uchiha",
    bio: "S-rank shinobi and founding Akatsuki member who secretly sacrificed everything to protect Konoha from within. His genjutsu mastery — especially Tsukuyomi and Izanami — operates on a level no other user has matched. Every action he took was a calculated move in a game only he fully understood.",
    variants: [
      { name: "Base", isDefault: true, stats: [94, 78, 75, 72, 99, 85, 55, 99, 92] },
    ],
  },
  {
    name: "Kakashi Hatake",
    bio: "The Copy Ninja, former ANBU Black Ops captain, and Sixth Hokage of Konoha. Famous for copying over 1,000 jutsu with the Sharingan gifted by his dying teammate Obito Uchiha. A master of every ninja art, he leads by intelligence and precision rather than raw power.",
    variants: [
      { name: "Base",       isDefault: true,  stats: [88, 78, 78, 75, 97, 82, 60, 85, 90] },
      { name: "Six Paths",  isDefault: false, stats: [90, 80, 80, 75, 97, 85, 62, 90, 90] },
    ],
  },
  {
    name: "Madara Uchiha",
    bio: "The legendary co-founder of Konoha and the most powerful Uchiha who ever lived. His ambition to cast the entire world into the Infinite Tsukuyomi nearly succeeded. As a Ten-Tails jinchūriki, he transcended conventional combat entirely and could only be stopped by two of history's strongest heroes.",
    variants: [
      { name: "Base",                  isDefault: true,  stats: [96, 96, 96, 95, 99, 95, 92, 97, 96] },
      { name: "Ten-Tails Jinchūriki", isDefault: false, stats: [99, 99, 99, 99, 99, 99, 99, 99, 99] },
    ],
  },
  {
    name: "Minato Namikaze",
    bio: "The Fourth Hokage and the Yellow Flash of the Leaf — widely considered the fastest shinobi in history. His Flying Thunder God Technique made him untouchable in combat. He sealed the Nine-Tails into his newborn son Naruto at the cost of his own life, a decision that shaped the entire shinobi world.",
    variants: [
      { name: "Base", isDefault: true, stats: [99, 82, 80, 80, 97, 90, 65, 88, 88] },
    ],
  },
  {
    name: "Pain",
    bio: "Nagato Uzumaki, wielder of the Rinnegan and the true leader of Akatsuki. Channeling his power through the six bodies of the Paths of Pain, he single-handedly leveled all of Konoha with the Shinra Tensei. His philosophy that true peace comes only through shared suffering defined the war arc.",
    variants: [
      { name: "Deva Path", isDefault: true, stats: [90, 85, 80, 78, 95, 88, 70, 95, 85] },
    ],
  },
  {
    name: "Rock Lee",
    bio: "A taijutsu prodigy who cannot use ninjutsu or genjutsu — a supposed impossibility in the ninja world. Through years of brutal training under Might Guy, he developed raw speed and explosive power that shocked even jōnin-level fighters. His Eight Inner Gates represent pure human potential pushed to its absolute limit.",
    variants: [
      { name: "Base",              isDefault: true,  stats: [93, 88, 72, 82, 78, 30, 68, 20, 52] },
      { name: "Eight Inner Gates", isDefault: false, stats: [99, 96, 75, 85, 78, 30, 70, 30, 55] },
    ],
  },
  {
    name: "Gaara",
    bio: "The Fifth Kazekage of Sunagakure and former jinchūriki of Shukaku the One-Tail. Once consumed by bloodlust and isolation, his friendship with Naruto transformed him into a compassionate leader. His sand-based defense is among the most impenetrable in the series, and he controls it with surgical precision.",
    variants: [
      { name: "Base", isDefault: true, stats: [85, 80, 92, 88, 88, 95, 75, 85, 82] },
    ],
  },
  {
    name: "Jiraiya",
    bio: "One of the Legendary Sannin, teacher of the Fourth Hokage and later of Naruto himself. A master of natural energy (sage jutsu) and one of the world's foremost intelligence operatives. He died infiltrating the Akatsuki's inner circle — a sacrifice that set the stage for the entire Fourth Shinobi War.",
    variants: [
      { name: "Base",      isDefault: true,  stats: [84, 82, 80, 80, 90, 85, 68, 82, 85] },
      { name: "Sage Mode", isDefault: false, stats: [87, 85, 82, 82, 92, 88, 70, 88, 88] },
    ],
  },
];

const BLEACH_CHARS: typeof NARUTO_CHARS = [
  {
    name: "Ichigo Kurosaki",
    bio: "A human born with abnormal spiritual pressure who became a Substitute Soul Reaper. His unique heritage — Shinigami, Hollow, Fullbring, and Quincy — makes him one of the most versatile fighters in existence. His True Bankai, Zangetsu, channels the full merged power of all his natures into a single overwhelming strike.",
    variants: [
      { name: "Base",        isDefault: true,  stats: [90, 85, 82, 80, 70, 75, 82, 78, 78] },
      { name: "Bankai",      isDefault: false, stats: [97, 92, 88, 85, 72, 80, 85, 85, 82] },
      { name: "True Bankai", isDefault: false, stats: [99, 95, 92, 88, 72, 82, 88, 90, 85] },
    ],
  },
  {
    name: "Sosuke Aizen",
    bio: "Former Captain of the Fifth Division and the architect of Soul Society's greatest betrayal. His Zanpakutō Kyōka Suigetsu creates complete hypnosis — anyone who sees its release is permanently under its control, making him effectively undefeatable in direct combat. His transcendent evolution places him beyond the laws of mortality.",
    variants: [
      { name: "Base",         isDefault: true,  stats: [96, 90, 92, 95, 99, 88, 95, 96, 95] },
      { name: "Transcendent", isDefault: false, stats: [99, 97, 98, 99, 99, 95, 99, 99, 98] },
    ],
  },
  {
    name: "Yhwach",
    bio: "Son of the Soul King and progenitor of all Quincy. His Almighty ability grants omniscience over all future events, allowing him to alter any outcome he perceives. He is considered the most powerful character in Bleach canon — only the unique convergence of Ichigo, Aizen, and Uryū's abilities could end him.",
    variants: [
      { name: "Base",               isDefault: true,  stats: [96, 95, 97, 97, 97, 96, 97, 99, 96] },
      { name: "Almighty Activated", isDefault: false, stats: [98, 98, 99, 99, 98, 98, 99, 100, 98] },
    ],
  },
  {
    name: "Kenpachi Zaraki",
    bio: "Captain of the Eleventh Division and the most purely battle-hungry fighter in Soul Society. He never learned his Zanpakutō's name until adulthood and still decimated opponents with brute force alone. His Bankai is so destructive it nearly destroys his own body with every use.",
    variants: [
      { name: "Base",   isDefault: true,  stats: [92, 96, 94, 92, 68, 38, 88, 65, 60] },
      { name: "Bankai", isDefault: false, stats: [97, 99, 97, 95, 70, 40, 90, 75, 65] },
    ],
  },
  {
    name: "Byakuya Kuchiki",
    bio: "Captain of the Sixth Division and head of the noble Kuchiki clan. A man of absolute law and pride whose Senbonzakura Kageyoshi — a million blades of shattered cherry blossom petals — is among the most visually striking and deadly Bankai in Soul Society's history.",
    variants: [
      { name: "Base",   isDefault: true,  stats: [93, 78, 80, 78, 90, 88, 68, 86, 85] },
      { name: "Bankai", isDefault: false, stats: [95, 80, 82, 80, 92, 90, 70, 90, 88] },
    ],
  },
  {
    name: "Tōshirō Hitsugaya",
    bio: "The youngest Shinigami to achieve captain rank, commanding the Tenth Division. His ice Zanpakutō Hyōrinmaru gives him mastery over all atmospheric moisture. His Bankai Daiguren Hyōrinmaru creates an ice dragon of continental scale — but it drains his reishi rapidly with each use.",
    variants: [
      { name: "Base",             isDefault: true,  stats: [93, 78, 80, 78, 86, 85, 68, 85, 85] },
      { name: "Bankai",           isDefault: false, stats: [95, 80, 82, 80, 88, 88, 70, 87, 87] },
      { name: "Mature Shinigami", isDefault: false, stats: [96, 82, 85, 82, 88, 88, 72, 88, 88] },
    ],
  },
  {
    name: "Kisuke Urahara",
    bio: "Former Captain of the Twelfth Division and founder of the Shinigami Research and Development Institute. The mastermind behind most of Ichigo's training and the architect of the strategy that ultimately defeated Yhwach. His genius-level intellect and mastery of Kidō make him Soul Society's most dangerous wild card.",
    variants: [
      { name: "Base",   isDefault: true,  stats: [94, 80, 80, 78, 99, 85, 68, 90, 90] },
      { name: "Bankai", isDefault: false, stats: [97, 82, 82, 80, 99, 88, 70, 95, 92] },
    ],
  },
  {
    name: "Yoruichi Shihōin",
    bio: "Former Captain of the Second Division and commander of the Onmitsukidō, widely considered the fastest Shinigami in history. She can transform into a black cat and is a master of Shunpo and unarmed Hohō combat. Her elite speed and battle experience make her a match for almost any opponent.",
    variants: [
      { name: "Base", isDefault: true, stats: [99, 82, 78, 80, 90, 50, 72, 75, 78] },
    ],
  },
  {
    name: "Grimmjow Jaegerjaquez",
    bio: "The Sixth Espada and self-proclaimed King of Hueco Mundo. His feral aggression and raw combat instinct make him one of the most dangerous Arrancars. His Resurrección Pantera transforms him into a humanoid panther and dramatically amplifies his already terrifying speed and striking power.",
    variants: [
      { name: "Base",         isDefault: true,  stats: [94, 88, 86, 84, 76, 75, 82, 78, 75] },
      { name: "Resurrección", isDefault: false, stats: [97, 92, 90, 88, 78, 80, 85, 82, 78] },
    ],
  },
  {
    name: "Ulquiorra Cifer",
    bio: "The Fourth Espada and the only Arrancar confirmed to possess a second Resurreccion. While most Espada rank above him in raw power, Ulquiorra's Segunda Etapa — a form no other Espada has reached — places him in an entirely different class. Cold, logical, and absolute in his nihilism.",
    variants: [
      { name: "Base",          isDefault: true,  stats: [95, 88, 90, 90, 86, 85, 86, 85, 82] },
      { name: "Segunda Etapa", isDefault: false, stats: [98, 95, 96, 95, 88, 88, 90, 90, 85] },
    ],
  },
];

const ONE_PIECE_CHARS: typeof NARUTO_CHARS = [
  {
    name: "Monkey D. Luffy",
    bio: "Captain of the Straw Hat Pirates, son of Revolutionary Dragon, and the man destined to find the One Piece. His awakened Nika Fruit — Gear Fifth — makes him the most unpredictable and powerful fighter alive, granting cartoon-logic reality manipulation. His rubber body, iron will, and Conqueror's Haki make him nearly impossible to put down.",
    variants: [
      { name: "Base",     isDefault: true,  stats: [88, 88, 86, 90, 78, 72, 85, 72, 88] },
      { name: "Gear 4th", isDefault: false, stats: [96, 96, 94, 88, 80, 85, 88, 88, 94] },
      { name: "Gear 5th", isDefault: false, stats: [99, 99, 98, 96, 80, 90, 92, 97, 99] },
    ],
  },
  {
    name: "Roronoa Zoro",
    bio: "First mate of the Straw Hat Pirates and the man determined to become the world's greatest swordsman by surpassing Dracule Mihawk. His three-sword Santoryu style, paired with Conqueror's Haki coating on his blades, makes him a force that can cut through steel, wind, and the very laws of physics.",
    variants: [
      { name: "Base", isDefault: true,  stats: [92, 92, 90, 90, 84, 65, 75, 72, 80] },
      { name: "Enma", isDefault: false, stats: [96, 95, 94, 92, 86, 72, 78, 78, 82] },
    ],
  },
  {
    name: "Shanks",
    bio: "One of the Four Emperors and captain of the Red Hair Pirates. Shanks possesses the most powerful Conqueror's Haki ever shown — a single burst knocked out an entire Marine fleet and cracked the sky. Despite losing his arm saving Luffy, he remains arguably the most feared individual in the One Piece world.",
    variants: [
      { name: "Base", isDefault: true, stats: [97, 97, 96, 95, 98, 95, 85, 95, 96] },
    ],
  },
  {
    name: "Edward Newgate",
    bio: "Called the World's Strongest Man and the only pirate ever confirmed to match Gol D. Roger in battle. His Tremor-Tremor Fruit — the most destructive Paramecia — could crack the earth, split the sea, and cause tsunamis of global scale. He died standing, refusing to flee, protecting his crew at Marineford.",
    variants: [
      { name: "Base", isDefault: true, stats: [88, 100, 98, 88, 94, 99, 72, 95, 88] },
    ],
  },
  {
    name: "Dracule Mihawk",
    bio: "The World's Greatest Swordsman, wielder of Yoru — the world's most powerful blade. Mihawk's swordsmanship is so refined he can reshape tidal waves with a swing and cut through warships as if they were paper. He serves as Zoro's ultimate goal and respects fewer than a handful of fighters alive.",
    variants: [
      { name: "Base", isDefault: true, stats: [96, 92, 92, 90, 97, 85, 78, 78, 85] },
    ],
  },
  {
    name: "Kaido",
    bio: "One of the Four Emperors and the creature called the World's Strongest Living Being. He has survived every execution attempt, every torture, and countless defeats at sea — earning his reputation as an unkillable monster. His Dragon Zoan Devil Fruit and mastery of all three forms of Haki make him a walking natural disaster.",
    variants: [
      { name: "Base",        isDefault: true,  stats: [92, 99, 98, 98, 88, 88, 94, 90, 88] },
      { name: "Dragon Form", isDefault: false, stats: [95, 100, 99, 99, 90, 90, 95, 95, 90] },
    ],
  },
  {
    name: "Charlotte Linlin",
    bio: "One of the Four Emperors known as Big Mom. She commands a terrifying soul-based Devil Fruit that allows her to steal lifespans, create homies from inorganic objects, and project her own soul into weapons. Her raw physical power rivals Kaido's, and she achieved Conqueror's Haki at age six.",
    variants: [
      { name: "Base", isDefault: true, stats: [90, 99, 97, 98, 88, 92, 90, 92, 88] },
    ],
  },
  {
    name: "Trafalgar Law",
    bio: "Warlord of the Sea, captain of the Heart Pirates, and the most surgical fighter in One Piece. His Ope Ope no Mi is called the Ultimate Devil Fruit — its ROOM ability lets him rearrange matter, teleport, and disassemble opponents with absolute precision. He values strategy over brute force and rarely loses a battle of wits.",
    variants: [
      { name: "Base", isDefault: true, stats: [92, 82, 82, 85, 94, 88, 78, 98, 92] },
    ],
  },
  {
    name: "Silvers Rayleigh",
    bio: "The Dark King, first mate of the Roger Pirates, and the man who trained Monkey D. Luffy in Haki for two years. Even in old age and retirement, Rayleigh is considered one of the most powerful living beings in the world. His mastery of all three Haki types places him among the all-time greats.",
    variants: [
      { name: "Base", isDefault: true, stats: [95, 92, 92, 90, 97, 85, 80, 88, 92] },
    ],
  },
  {
    name: "Portgas D. Ace",
    bio: "Son of the Pirate King Gol D. Roger and Second Division Commander of Whitebeard's crew. His Mera Mera no Mi gave him total mastery over fire — he could create walls of flame, generate explosions, and transform his body into fire entirely. His death at Marineford remains one of the most impactful moments in the series.",
    variants: [
      { name: "Base", isDefault: true, stats: [90, 88, 85, 88, 85, 90, 80, 88, 85] },
    ],
  },
];

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log("🔧 Setting up search_vec triggers...");
  await db.execute(sql`
    CREATE OR REPLACE FUNCTION entities_search_vec_update()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.search_vec := to_tsvector('english', coalesce(NEW.name, ''));
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
  `);
  await db.execute(sql`
    DROP TRIGGER IF EXISTS entities_search_vec_trigger ON entities;
    CREATE TRIGGER entities_search_vec_trigger
    BEFORE INSERT OR UPDATE OF name ON entities
    FOR EACH ROW EXECUTE FUNCTION entities_search_vec_update();
  `);
  await db.execute(sql`
    CREATE OR REPLACE FUNCTION categories_search_vec_update()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.search_vec := to_tsvector('english',
        coalesce(NEW.name, '') || ' ' || coalesce(NEW.description, ''));
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
  `);
  await db.execute(sql`
    DROP TRIGGER IF EXISTS categories_search_vec_trigger ON categories;
    CREATE TRIGGER categories_search_vec_trigger
    BEFORE INSERT OR UPDATE OF name, description ON categories
    FOR EACH ROW EXECUTE FUNCTION categories_search_vec_update();
  `);

  // ── Anime top-level category ──────────────────────────────────────────────
  console.log("📂 Seeding categories...");
  const anime = await upsertCategory({
    name: "Anime", slug: "anime",
    description: "Japanese animated series and films",
    entityLabel: "Character", matchupLabel: "Battle",
  });

  const narutoSeries = await upsertCategory({
    name: "Naruto", slug: "naruto", parentId: anime.id,
    description: "Masashi Kishimoto's ninja world saga",
    entityLabel: "Character", matchupLabel: "Battle",
  });
  const bleachSeries = await upsertCategory({
    name: "Bleach", slug: "bleach", parentId: anime.id,
    description: "Tite Kubo's Soul Reaper epic",
    entityLabel: "Character", matchupLabel: "Battle",
  });
  const opSeries = await upsertCategory({
    name: "One Piece", slug: "one-piece", parentId: anime.id,
    description: "Eiichiro Oda's pirate adventure",
    entityLabel: "Character", matchupLabel: "Battle",
  });

  // ── Attributes (attached to top-level Anime) ─────────────────────────────
  console.log("📐 Seeding attributes...");
  const attrMap: Record<string, string> = {};
  for (const a of ATTRS) {
    const row = await upsertAttribute({
      categoryId: anime.id,
      name: a.name, slug: a.slug,
      description: a.desc,
      sortOrder: a.sort,
    });
    attrMap[a.slug] = row.id;
  }

  // Helper: seed one character
  async function seedChar(
    seriesId: string,
    char: typeof NARUTO_CHARS[number]
  ) {
    const entitySlug = slug(char.name);
    const entity = await upsertEntity({
      categoryId: seriesId,
      name: char.name,
      slug: entitySlug,
      bio: char.bio,
      status: "approved",
    });

    const variantIds: Record<string, string> = {};
    for (const v of char.variants) {
      const vSlug = slug(`${char.name} ${v.name === "Base" ? "base" : v.name}`);
      const variant = await upsertVariant({
        entityId: entity.id,
        name: v.name,
        slug: vSlug,
        isDefault: v.isDefault,
      });
      variantIds[v.name] = variant.id;

      // Stats for every variant
      const statKeys = ["speed","strength","durability","stamina","battle-iq","range","regeneration","hax","versatility"];
      for (let i = 0; i < statKeys.length; i++) {
        await upsertStat({
          variantId:   variant.id,
          attributeId: attrMap[statKeys[i]],
          value:       v.stats[i],
        });
      }
    }
    return { entity, variantIds };
  }

  // ── Characters ────────────────────────────────────────────────────────────
  console.log("🥷 Seeding Naruto characters...");
  const narutoChars: Record<string, { entity: typeof entities.$inferSelect; variantIds: Record<string, string> }> = {};
  for (const c of NARUTO_CHARS) {
    narutoChars[c.name] = await seedChar(narutoSeries.id, c);
    process.stdout.write(`  ✓ ${c.name}\n`);
  }

  console.log("⚔️  Seeding Bleach characters...");
  const bleachChars: typeof narutoChars = {};
  for (const c of BLEACH_CHARS) {
    bleachChars[c.name] = await seedChar(bleachSeries.id, c);
    process.stdout.write(`  ✓ ${c.name}\n`);
  }

  console.log("🏴‍☠️  Seeding One Piece characters...");
  const opChars: typeof narutoChars = {};
  for (const c of ONE_PIECE_CHARS) {
    opChars[c.name] = await seedChar(opSeries.id, c);
    process.stdout.write(`  ✓ ${c.name}\n`);
  }

  // ── Matchups ──────────────────────────────────────────────────────────────
  console.log("🔥 Seeding matchups...");

  const MATCHUPS: {
    sideA: { chars: typeof narutoChars; name: string; variant: string }[];
    sideB: { chars: typeof narutoChars; name: string; variant: string }[];
    sideALabel?: string;
    sideBLabel?: string;
  }[] = [
    // 1. The eternal debate
    {
      sideA: [{ chars: narutoChars, name: "Naruto Uzumaki",   variant: "Baryon Mode"   }],
      sideB: [{ chars: bleachChars, name: "Ichigo Kurosaki",  variant: "True Bankai"   }],
    },
    // 2. Big 3 showdown
    {
      sideA: [{ chars: narutoChars, name: "Naruto Uzumaki",   variant: "Baryon Mode" }],
      sideB: [{ chars: opChars,     name: "Monkey D. Luffy",  variant: "Gear 5th"    }],
    },
    // 3. God tier Bleach
    {
      sideA: [{ chars: bleachChars, name: "Sosuke Aizen",     variant: "Transcendent" }],
      sideB: [{ chars: narutoChars, name: "Madara Uchiha",    variant: "Ten-Tails Jinchūriki" }],
    },
    // 4. Intelligence matchup
    {
      sideA: [{ chars: narutoChars, name: "Itachi Uchiha",    variant: "Base" }],
      sideB: [{ chars: bleachChars, name: "Sosuke Aizen",     variant: "Base" }],
    },
    // 5. Luffy vs the strongest creature
    {
      sideA: [{ chars: opChars,     name: "Monkey D. Luffy",  variant: "Gear 5th"    }],
      sideB: [{ chars: opChars,     name: "Kaido",            variant: "Dragon Form"  }],
    },
    // 6. Speed king vs monster
    {
      sideA: [{ chars: bleachChars, name: "Kenpachi Zaraki",  variant: "Bankai" }],
      sideB: [{ chars: narutoChars, name: "Madara Uchiha",    variant: "Base"   }],
    },
    // 7. Rivals debate
    {
      sideA: [{ chars: narutoChars, name: "Sasuke Uchiha",    variant: "Rinnegan"    }],
      sideB: [{ chars: bleachChars, name: "Ichigo Kurosaki",  variant: "True Bankai" }],
    },
    // 8. Team match: Naruto + Sasuke vs Madara (Ten-Tails)
    {
      sideA: [
        { chars: narutoChars, name: "Naruto Uzumaki", variant: "Baryon Mode" },
        { chars: narutoChars, name: "Sasuke Uchiha",  variant: "Rinnegan"    },
      ],
      sideB: [
        { chars: narutoChars, name: "Madara Uchiha",  variant: "Ten-Tails Jinchūriki" },
      ],
      sideALabel: "Naruto & Sasuke",
      sideBLabel: "Madara (Ten-Tails)",
    },
  ];

  for (const m of MATCHUPS) {
    const sideASlugs = m.sideA.map(p => {
      const varName = p.variant === "Base"
        ? `${slug(p.name)}-base`
        : slug(`${p.name} ${p.variant}`);
      return varName;
    });
    const sideBSlugs = m.sideB.map(p => {
      const varName = p.variant === "Base"
        ? `${slug(p.name)}-base`
        : slug(`${p.name} ${p.variant}`);
      return varName;
    });

    const hash = canonicalHash(sideASlugs, sideBSlugs);

    const labelA = m.sideALabel ?? m.sideA.map(p =>
      p.variant === "Base" ? p.name : `${p.name} (${p.variant})`
    ).join(" & ");
    const labelB = m.sideBLabel ?? m.sideB.map(p =>
      p.variant === "Base" ? p.name : `${p.name} (${p.variant})`
    ).join(" & ");

    const matchupSlug = slug(`${labelA} vs ${labelB}`).slice(0, 100);

    const matchup = await upsertMatchup({
      categoryId:    anime.id,
      slug:          matchupSlug,
      canonicalHash: hash,
      sideALabel:    m.sideALabel ?? null,
      sideBLabel:    m.sideBLabel ?? null,
    });

    let sortA = 0;
    for (const p of m.sideA) {
      const variantId = p.chars[p.name].variantIds[p.variant];
      if (!variantId) { console.warn(`  ⚠ variant not found: ${p.name} / ${p.variant}`); continue; }
      await upsertParticipant({ matchupId: matchup.id, side: "a", variantId, sortOrder: sortA++ });
    }
    let sortB = 0;
    for (const p of m.sideB) {
      const variantId = p.chars[p.name].variantIds[p.variant];
      if (!variantId) { console.warn(`  ⚠ variant not found: ${p.name} / ${p.variant}`); continue; }
      await upsertParticipant({ matchupId: matchup.id, side: "b", variantId, sortOrder: sortB++ });
    }

    console.log(`  ✓ ${labelA} vs ${labelB}`);
  }

  console.log("\n✅ Content seed complete.");
  console.log(`   Categories: 4 (Anime + 3 series)`);
  console.log(`   Attributes: ${ATTRS.length}`);
  console.log(`   Characters: ${NARUTO_CHARS.length + BLEACH_CHARS.length + ONE_PIECE_CHARS.length}`);
  console.log(`   Matchups:   ${MATCHUPS.length}`);
  await client.end();
}

main().catch((err) => { console.error(err); process.exit(1); });
