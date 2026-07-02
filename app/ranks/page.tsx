export const dynamic = "force-dynamic";

import { auth } from "@/auth";
import Link from "next/link";
import { Zap, Coins } from "lucide-react";
import { getAdminSettings, getUserPointSummary } from "@/lib/points";
import { RANKS, RANK_COLORS } from "@/lib/ranks";
import { RankBadge } from "@/components/rank-badge";
import { RankIcon } from "@/components/rank-icons";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Ranks & XP",
  description: "Learn how to earn XP, climb the military rank ladder, and unlock features on AnimeWarBoard.",
};

const CLIP = "polygon(12px 0, calc(100% - 12px) 0, 100% 12px, 100% calc(100% - 12px), calc(100% - 12px) 100%, 12px 100%, 0 calc(100% - 12px), 0 12px)";

const RANK_UNLOCKS: Record<string, string> = {
  "Private":       "Vote on battles · Leave comments",
  "Corporal":      "Create new battles",
  "Sergeant":      "Community stat slider voting",
  "Lieutenant":    "Submit new characters (pending approval)",
  "Colonel":       "Content flagging",
  "General":       "High-trust badge · Priority support",
  "Field Marshal": "Rare prestige · Permanent leaderboard crown",
};

type EarnRow = { label: string; settingKey: string | null; defaultPts: number; note?: string };

const EARN_ROWS: EarnRow[] = [
  { label: "Daily login",                    settingKey: "daily_login_points",         defaultPts: 10 },
  { label: "7-day login streak bonus",       settingKey: null,                         defaultPts: 10, note: "base × (multiplier − 1), fires every 7th consecutive day" },
  { label: "Comment upvoted",                settingKey: "comment_upvote_points",      defaultPts: 5  },
  { label: "Battle vote upvoted",            settingKey: "vote_upvote_points",         defaultPts: 3  },
  { label: "Character stat rating (first)",  settingKey: "entity_stat_rating_points",  defaultPts: 5  },
  { label: "Character submitted & approved", settingKey: "entity_approved_points",     defaultPts: 50 },
  { label: "Account age milestone",          settingKey: "account_milestone_points",   defaultPts: 20 },
];

function ClipCard({ children, borderColor }: { children: React.ReactNode; borderColor?: string }) {
  return (
    <div style={{ clipPath: CLIP, background: borderColor ?? "var(--color-border)", padding: "1px" }}>
      <div style={{ clipPath: CLIP, background: "var(--color-surface)" }}>
        {children}
      </div>
    </div>
  );
}

export default async function RanksPage() {
  const [session, settings] = await Promise.all([auth(), getAdminSettings()]);
  const userId = session?.user?.id ?? null;
  const pointSummary = userId ? await getUserPointSummary(userId) : null;

  const thresholds = RANKS.map((r) => ({
    name:  r.name,
    xp:    r.settingKey ? (settings[r.settingKey] ?? r.defaultXp) : 0,
    color: RANK_COLORS[r.name],
  }));

  const streakBonus = (() => {
    const base       = settings.daily_login_points      ?? 10;
    const multiplier = settings.streak_bonus_multiplier ?? 2;
    return base * (multiplier - 1);
  })();

  const userRankIndex = pointSummary ? RANKS.findIndex((r) => r.name === pointSummary.rank) : -1;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">

      {/* Header */}
      <div>
        <h1 className="text-3xl font-black tracking-tight">Ranks & XP</h1>
        <p className="text-sm mt-1" style={{ color: "var(--color-text-muted)" }}>
          Earn XP by engaging with the community. Climb the ranks. Unlock more of the platform.
        </p>
      </div>

      {/* Current rank card — logged-in users only */}
      {pointSummary && session?.user && (
        <ClipCard borderColor={`${RANK_COLORS[pointSummary.rank]}88`}>
          <div className="p-5 space-y-4">
            <div className="flex items-center gap-4">
              <div className="inline-flex items-center shrink-0 select-none" style={{ filter: `drop-shadow(0 0 6px ${RANK_COLORS[pointSummary.rank]}99)` }}>
                <RankIcon rank={pointSummary.rank} size={40} />
              </div>
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-lg font-black truncate">{session.user.name ?? "You"}</span>
                  <Link href="/profile" className="text-xs font-semibold shrink-0 hover:underline" style={{ color: "var(--color-accent)" }}>
                    View Profile →
                  </Link>
                </div>
                <div>
                  <RankBadge rank={pointSummary.rank} size="sm" />
                </div>
                <div className="flex items-center gap-4 text-xs" style={{ color: "var(--color-text-muted)" }}>
                  <span className="flex items-center gap-1"><Zap size={10} /> {pointSummary.lifetimeXp.toLocaleString()} XP</span>
                  <span className="flex items-center gap-1"><Coins size={10} /> {pointSummary.balance.toLocaleString()} pts</span>
                </div>
              </div>
            </div>
            {pointSummary.nextRank && (
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] font-bold">
                  <span style={{ color: RANK_COLORS[pointSummary.rank] }}>{pointSummary.rank}</span>
                  <span style={{ color: RANK_COLORS[pointSummary.nextRank] }}>
                    {pointSummary.nextRank} — {pointSummary.xpToNext?.toLocaleString()} XP away
                  </span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--color-border)" }}>
                  <div className="h-full rounded-full transition-all"
                    style={{ width: `${pointSummary.progressPercent}%`, background: RANK_COLORS[pointSummary.rank] }} />
                </div>
              </div>
            )}
          </div>
        </ClipCard>
      )}

      {/* Guest CTA */}
      {!session && (
        <ClipCard>
          <div className="px-5 py-4 text-sm text-center">
            <Link href="/login" className="font-semibold hover:underline" style={{ color: "var(--color-accent)" }}>
              Join AnimeWarBoard
            </Link>{" "}
            <span style={{ color: "var(--color-text-muted)" }}>to start earning XP and climbing the ranks.</span>
          </div>
        </ClipCard>
      )}

      {/* Rank progression */}
      <section className="space-y-3">
        <h2 className="text-[10px] font-black tracking-widest uppercase" style={{ color: "var(--color-text-ghost)" }}>
          Military Ranks
        </h2>
        <ClipCard>
          {thresholds.map((r, i) => {
            const isCurrentRank = !!(pointSummary && RANKS[userRankIndex]?.name === r.name);
            const isPastRank    = !!(pointSummary && userRankIndex > i);
            return (
              <div
                key={r.name}
                className="flex items-center gap-4 px-5 py-4"
                style={{
                  borderTop: i === 0 ? "none" : "1px solid var(--color-border)",
                  background: isCurrentRank ? `${r.color}0d` : "transparent",
                }}
              >
                <div className="inline-flex items-center justify-center w-8 shrink-0 select-none"
                  style={{ opacity: isPastRank || isCurrentRank ? 1 : 0.4, color: r.color }}>
                  <RankIcon rank={r.name} size={24} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm font-black" style={{ color: r.color }}>{r.name}</span>
                    {isCurrentRank && (
                      <span className="text-[9px] font-black tracking-widest uppercase rounded-full px-2 py-0.5"
                        style={{ background: `${r.color}22`, color: r.color }}>
                        Current
                      </span>
                    )}
                    {isPastRank && (
                      <span className="text-[10px]" style={{ color: "var(--color-text-ghost)" }}>✓</span>
                    )}
                  </div>
                  <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                    {RANK_UNLOCKS[r.name]}
                  </p>
                </div>
                <p className="text-sm font-black tabular-nums shrink-0" style={{ color: r.color }}>
                  {r.xp === 0 ? "Start" : `${r.xp.toLocaleString()} XP`}
                </p>
              </div>
            );
          })}
        </ClipCard>
      </section>

      {/* How to earn XP */}
      <section className="space-y-3">
        <h2 className="text-[10px] font-black tracking-widest uppercase" style={{ color: "var(--color-text-ghost)" }}>
          How to Earn XP
        </h2>
        <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
          Every point you earn also counts as Lifetime XP. Your rank is based on Lifetime XP — it never decreases, even if you spend points.
        </p>
        <ClipCard>
          {EARN_ROWS.map((row, i) => {
            const pts = row.settingKey ? (settings[row.settingKey] ?? row.defaultPts) : streakBonus;
            return (
              <div key={row.label} className="flex items-center justify-between gap-4 px-5 py-3"
                style={{ borderTop: i === 0 ? "none" : "1px solid var(--color-border)" }}>
                <div>
                  <p className="text-sm font-semibold">{row.label}</p>
                  {row.note && (
                    <p className="text-[10px] mt-0.5" style={{ color: "var(--color-text-ghost)" }}>{row.note}</p>
                  )}
                </div>
                <span className="text-sm font-black shrink-0" style={{ color: "#22c55e" }}>+{pts} XP</span>
              </div>
            );
          })}
        </ClipCard>
      </section>

      {/* Points vs XP explainer */}
      <section className="space-y-3">
        <h2 className="text-[10px] font-black tracking-widest uppercase" style={{ color: "var(--color-text-ghost)" }}>
          Points vs. Lifetime XP
        </h2>
        <ClipCard>
          <div className="p-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Zap size={14} style={{ color: "#f59e0b" }} />
                  <span className="text-sm font-black" style={{ color: "#f59e0b" }}>Lifetime XP</span>
                </div>
                <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                  Only ever goes up. Determines your military rank. Never affected by spending.
                </p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Coins size={14} style={{ color: "#22c55e" }} />
                  <span className="text-sm font-black" style={{ color: "#22c55e" }}>Spendable Points</span>
                </div>
                <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                  A wallet that goes up and down. Used for premium actions like content flagging or boosting a battle.
                </p>
              </div>
            </div>
            <div className="text-xs font-mono p-3" style={{ background: "var(--color-bg)", color: "var(--color-text-muted)", border: "1px solid var(--color-border)" }}>
              <p>Action taken</p>
              <p className="ml-3">├── Spendable Points  (wallet — goes up and down)</p>
              <p className="ml-3">└── Lifetime XP       (rank bar — only ever goes up)</p>
              <p className="mt-1">Rank = f(Lifetime XP)</p>
              <p>Spending points ≠ losing rank. Ever.</p>
            </div>
          </div>
        </ClipCard>
      </section>

    </div>
  );
}
