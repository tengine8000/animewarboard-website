// Pure rank constants — no DB imports, safe to use in client components

export const RANKS = [
  { name: "Private",       settingKey: null,                          defaultXp: 0     },
  { name: "Corporal",      settingKey: "corporal_xp_threshold",       defaultXp: 100   },
  { name: "Sergeant",      settingKey: "sergeant_xp_threshold",       defaultXp: 300   },
  { name: "Lieutenant",    settingKey: "lieutenant_xp_threshold",     defaultXp: 750   },
  { name: "Colonel",       settingKey: "colonel_xp_threshold",        defaultXp: 2000  },
  { name: "General",       settingKey: "general_xp_threshold",        defaultXp: 5000  },
  { name: "Field Marshal", settingKey: "field_marshal_xp_threshold",  defaultXp: 15000 },
] as const;

export type RankName = (typeof RANKS)[number]["name"];

export const RANK_COLORS: Record<RankName, string> = {
  "Private":       "#64748b",
  "Corporal":      "#22c55e",
  "Sergeant":      "#06b6d4",
  "Lieutenant":    "#3b82f6",
  "Colonel":       "#a855f7",
  "General":       "#f59e0b",
  "Field Marshal": "#ef4444",
};

export const RANK_ICONS: Record<RankName, string> = {
  "Private":       "▪",
  "Corporal":      "◈",
  "Sergeant":      "◆",
  "Lieutenant":    "★",
  "Colonel":       "⬡",
  "General":       "⭐",
  "Field Marshal": "⚔",
};

// Sergeant and above can submit community stat ratings
export const SERGEANT_RANK_INDEX = RANKS.findIndex((r) => r.name === "Sergeant");

export function getRankFromXp(
  lifetimeXp: number,
  settings: Record<string, number>,
): { rank: RankName; rankIndex: number; nextRank: RankName | null; xpToNext: number | null; progressPercent: number } {
  const thresholds = RANKS.map((r) => ({
    name: r.name as RankName,
    xp:   r.settingKey ? (settings[r.settingKey] ?? r.defaultXp) : 0,
  }));

  let rankIdx = 0;
  for (let i = thresholds.length - 1; i >= 0; i--) {
    if (lifetimeXp >= thresholds[i].xp) { rankIdx = i; break; }
  }

  const rank     = thresholds[rankIdx].name;
  const nextNode = thresholds[rankIdx + 1] ?? null;
  const nextRank = nextNode?.name ?? null;
  const xpToNext = nextNode ? nextNode.xp - lifetimeXp : null;
  const progressPercent = nextNode
    ? Math.min(100, Math.round(((lifetimeXp - thresholds[rankIdx].xp) / (nextNode.xp - thresholds[rankIdx].xp)) * 100))
    : 100;

  return { rank, rankIndex: rankIdx, nextRank, xpToNext, progressPercent };
}
