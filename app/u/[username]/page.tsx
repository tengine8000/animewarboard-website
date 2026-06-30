import { db } from "@/db";
import { users, votes } from "@/db/schema";
import { eq, count } from "drizzle-orm";
import { notFound } from "next/navigation";
import { Calendar, Swords, Flame, Coins, Zap } from "lucide-react";
import type { Metadata } from "next";
import { getUserPointSummary } from "@/lib/points";
import { RANK_COLORS, RANK_ICONS } from "@/lib/ranks";
import { RankBadge } from "@/components/rank-badge";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ username: string }> }): Promise<Metadata> {
  const { username } = await params;
  return { title: `${username} — AnimeWarBoard` };
}

export default async function PublicProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;

  const [dbUser] = await db.select().from(users).where(eq(users.username, username)).limit(1);
  if (!dbUser) notFound();

  const [[{ c: voteCount }], pointSummary] = await Promise.all([
    db.select({ c: count() }).from(votes).where(eq(votes.userId, dbUser.id)),
    getUserPointSummary(dbUser.id),
  ]);

  const { balance, lifetimeXp, rank, nextRank, xpToNext, progressPercent } = pointSummary;

  const joinedAt = dbUser.createdAt
    ? new Date(dbUser.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })
    : null;

  const displayName = dbUser.name ?? username;
  const initial     = displayName[0].toUpperCase();
  const rankColor   = RANK_COLORS[rank];
  const rankIcon    = RANK_ICONS[rank];

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-4">

      {/* Profile header */}
      <div className="p-6 space-y-4" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
        <div className="flex items-start gap-5">
          <div className="shrink-0">
            {dbUser.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={dbUser.image} alt={displayName} className="w-16 h-16 rounded-xl object-cover" />
            ) : (
              <div className="w-16 h-16 rounded-xl flex items-center justify-center text-white text-2xl font-black"
                style={{ background: rankColor }}>
                {initial}
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0 space-y-2">
            <div>
              <h1 className="text-2xl font-black tracking-tight truncate">{displayName}</h1>
              <p className="text-sm font-mono" style={{ color: "var(--color-text-ghost)" }}>@{username}</p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <RankBadge rank={rank} size="sm" />
              {dbUser.isPatron && (
                <span className="text-[10px] font-black tracking-widest uppercase rounded-full border px-2 py-0.5"
                  style={{ color: "#f59e0b", borderColor: "#f59e0b66", background: "#f59e0b14" }}>
                  ★ Patron
                </span>
              )}
              {joinedAt && (
                <span className="flex items-center gap-1 text-xs" style={{ color: "var(--color-text-ghost)" }}>
                  <Calendar size={10} />
                  Joined {joinedAt}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Rank progress */}
      <div className="p-6 space-y-4" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-black tracking-widest uppercase" style={{ color: "var(--color-text-ghost)" }}>
            Rank Progress
          </p>
          <div className="flex items-center gap-1 text-xs font-black" style={{ color: rankColor }}>
            <Zap size={11} />
            {lifetimeXp.toLocaleString()} XP
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-5xl select-none" style={{ filter: `drop-shadow(0 0 8px ${rankColor}99)` }}>
            {rankIcon}
          </div>
          <div className="flex-1 space-y-2">
            <div className="flex justify-between text-xs font-black">
              <span style={{ color: rankColor }}>{rank}</span>
              {nextRank
                ? <span style={{ color: "var(--color-text-ghost)" }}>{nextRank}</span>
                : <span style={{ color: "#f59e0b" }}>Max Rank</span>}
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--color-border)" }}>
              <div className="h-full rounded-full transition-all" style={{ width: `${progressPercent}%`, background: rankColor }} />
            </div>
            {xpToNext !== null && (
              <p className="text-[10px]" style={{ color: "var(--color-text-ghost)" }}>
                {xpToNext.toLocaleString()} XP to {nextRank}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { icon: <Swords size={16} />, value: Number(voteCount).toLocaleString(), label: "Predictions", color: "var(--color-accent)" },
          { icon: <Flame size={16} />,  value: (dbUser.loginStreak ?? 0).toString(),   label: "Day Streak",  color: "#f59e0b" },
          { icon: <Coins size={16} />,  value: balance.toLocaleString(),               label: "Points",      color: "#22c55e" },
        ].map(({ icon, value, label, color }) => (
          <div key={label} className="p-4 text-center" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
            <div className="flex justify-center mb-1" style={{ color }}>{icon}</div>
            <p className="text-2xl font-black" style={{ color }}>{value}</p>
            <p className="text-[10px] font-semibold uppercase tracking-widest mt-1" style={{ color: "var(--color-text-muted)" }}>{label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
