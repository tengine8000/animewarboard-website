export const dynamic = "force-dynamic";

import Link from "next/link";
import Image from "next/image";
import { Trophy, Swords, Flame, Zap } from "lucide-react";
import { getTopEntities, getTopUsers, getMostDebatedMatchups } from "@/lib/queries";
import { MatchupCard } from "@/components/matchup-card";
import { RankBadge } from "@/components/rank-badge";
import { RANK_COLORS } from "@/lib/ranks";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Leaderboards",
  description: "Top characters by win rate, top community members by XP, and the most contested battles on AnimeWarBoard.",
};

const CLIP = "polygon(12px 0, calc(100% - 12px) 0, 100% 12px, 100% calc(100% - 12px), calc(100% - 12px) 100%, 12px 100%, 0 calc(100% - 12px), 0 12px)";

function ClipCard({ children, borderColor }: { children: React.ReactNode; borderColor?: string }) {
  return (
    <div style={{ clipPath: CLIP, background: borderColor ?? "var(--color-border)", padding: "1px" }}>
      <div style={{ clipPath: CLIP, background: "var(--color-surface)" }}>{children}</div>
    </div>
  );
}

function MedalBadge({ rank }: { rank: number }) {
  const colors = ["#f59e0b", "#9ca3af", "#b45309"];
  const labels = ["1st", "2nd", "3rd"];
  if (rank <= 3) {
    return (
      <span className="text-xs font-black w-8 text-center" style={{ color: colors[rank - 1] }}>
        {labels[rank - 1]}
      </span>
    );
  }
  return <span className="text-xs font-bold w-8 text-center" style={{ color: "var(--color-text-ghost)" }}>#{rank}</span>;
}

export default async function LeaderboardsPage() {
  const [topEntities, topUsers, mostDebated] = await Promise.all([
    getTopEntities(20),
    getTopUsers(20),
    getMostDebatedMatchups(6),
  ]);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-12">

      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Trophy size={20} style={{ color: "var(--color-accent)" }} />
          <h1 className="text-3xl font-black tracking-tight">Leaderboards</h1>
        </div>
        <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
          Live rankings based on community votes, XP earned, and battle outcomes.
        </p>
      </div>

      {/* Top Characters */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <Swords size={14} style={{ color: "var(--color-accent)" }} />
          <h2 className="text-[10px] font-black tracking-widest uppercase" style={{ color: "var(--color-text-ghost)" }}>
            Top Characters — Win Rate
          </h2>
        </div>
        <ClipCard>
          {topEntities.length === 0 ? (
            <div className="py-12 text-center text-sm" style={{ color: "var(--color-text-ghost)" }}>
              Not enough battle data yet. Come back after more predictions are submitted.
            </div>
          ) : (
            topEntities.map((e, i) => (
              <div
                key={e.id}
                className="flex items-center gap-4 px-5 py-3"
                style={{ borderTop: i === 0 ? "none" : "1px solid var(--color-border)" }}
              >
                <MedalBadge rank={i + 1} />

                <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 flex items-center justify-center"
                  style={{ background: "var(--color-bg)" }}>
                  {e.imageUrl ? (
                    <Image src={e.imageUrl} alt={e.name} width={40} height={40} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-lg font-black" style={{ color: "var(--color-text-ghost)" }}>
                      {e.name[0]}
                    </span>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <Link href={`/characters/${e.slug}`} className="text-sm font-black hover:underline">
                    {e.name}
                  </Link>
                  <p className="text-[10px]" style={{ color: "var(--color-text-ghost)" }}>
                    <Link href={`/anime/${e.seriesSlug}`} className="hover:underline">{e.seriesName}</Link>
                  </p>
                </div>

                {/* W/L/D */}
                <div className="hidden sm:flex items-center gap-3 text-xs font-mono shrink-0">
                  <span className="font-black" style={{ color: "#22c55e" }}>{e.wins}W</span>
                  <span style={{ color: "#ef4444" }}>{e.losses}L</span>
                  <span style={{ color: "var(--color-text-ghost)" }}>{e.draws}D</span>
                </div>

                {/* Win rate bar */}
                <div className="w-20 shrink-0 space-y-0.5">
                  <div className="flex justify-between text-[9px] font-black">
                    <span style={{ color: "#22c55e" }}>{e.winRate}%</span>
                    <span style={{ color: "var(--color-text-ghost)" }}>{e.totalVotes}v</span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--color-border)" }}>
                    <div className="h-full rounded-full" style={{ width: `${e.winRate}%`, background: "#22c55e" }} />
                  </div>
                </div>
              </div>
            ))
          )}
        </ClipCard>
      </section>

      {/* Top Community Members */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <Zap size={14} style={{ color: "var(--color-accent)" }} />
          <h2 className="text-[10px] font-black tracking-widest uppercase" style={{ color: "var(--color-text-ghost)" }}>
            Top Community Members — Lifetime XP
          </h2>
        </div>
        <ClipCard>
          {topUsers.length === 0 ? (
            <div className="py-12 text-center text-sm" style={{ color: "var(--color-text-ghost)" }}>
              No users yet.
            </div>
          ) : (
            topUsers.map((u, i) => {
              const rankColor = RANK_COLORS[u.rank];
              const initial = ((u.name ?? "?")[0]).toUpperCase();
              return (
                <div
                  key={u.id}
                  className="flex items-center gap-4 px-5 py-3"
                  style={{ borderTop: i === 0 ? "none" : "1px solid var(--color-border)" }}
                >
                  <MedalBadge rank={i + 1} />

                  <div className="w-9 h-9 rounded-lg overflow-hidden shrink-0 flex items-center justify-center"
                    style={{ background: rankColor }}>
                    {u.image ? (
                      <Image src={u.image} alt={u.name ?? ""} width={36} height={36} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-sm font-black text-white">{initial}</span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-black truncate">{u.name ?? "Anonymous"}</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <RankBadge rank={u.rank} size="xs" />
                    </div>
                  </div>

                  <div className="flex items-center gap-1 text-sm font-black shrink-0" style={{ color: rankColor }}>
                    <Zap size={11} />
                    {u.lifetimeXp.toLocaleString()} XP
                  </div>
                </div>
              );
            })
          )}
        </ClipCard>
      </section>

      {/* Most Debated Battles */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <Flame size={14} style={{ color: "var(--color-accent)" }} />
          <h2 className="text-[10px] font-black tracking-widest uppercase" style={{ color: "var(--color-text-ghost)" }}>
            Most Contested Battles — Community Still Can&apos;t Decide
          </h2>
        </div>
        {mostDebated.length === 0 ? (
          <ClipCard>
            <div className="py-12 text-center text-sm" style={{ color: "var(--color-text-ghost)" }}>
              No battles with enough votes yet (minimum 5 needed).
            </div>
          </ClipCard>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {mostDebated.map((m) => <MatchupCard key={m.id} matchup={m} />)}
          </div>
        )}
      </section>

    </div>
  );
}
