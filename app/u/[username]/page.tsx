export const dynamic = "force-dynamic";

import { db } from "@/db";
import { users, votes } from "@/db/schema";
import { eq, count } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Calendar, Swords, Flame, Coins, Zap, BookOpen, Tv } from "lucide-react";
import type { Metadata } from "next";
import { auth } from "@/auth";
import { getUserPointSummary } from "@/lib/points";
import { RANK_COLORS, RANK_ICONS } from "@/lib/ranks";
import { RankBadge } from "@/components/rank-badge";
import {
  getUserContribCharacters,
  getUserContribBattles,
  getUserContribSeries,
} from "@/lib/queries";

export async function generateMetadata({ params }: { params: Promise<{ username: string }> }): Promise<Metadata> {
  const { username } = await params;
  return { title: `${username} — AnimeWarBoard` };
}

const CLIP = "polygon(12px 0, calc(100% - 12px) 0, 100% 12px, 100% calc(100% - 12px), calc(100% - 12px) 100%, 12px 100%, 0 calc(100% - 12px), 0 12px)";

function ClipCard({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ clipPath: CLIP, background: "var(--color-border)", padding: "1px" }}>
      <div style={{ clipPath: CLIP, background: "var(--color-surface)" }}>
        {children}
      </div>
    </div>
  );
}

type Tab = "characters" | "battles" | "anime";

const TABS: { id: Tab; label: string }[] = [
  { id: "characters", label: "Characters" },
  { id: "battles",    label: "Battles"    },
  { id: "anime",      label: "Anime"      },
];

const STATUS_BADGE: Record<string, { label: string; color: string; bg: string }> = {
  pending:  { label: "Pending",  color: "#f59e0b", bg: "rgba(245,158,11,0.1)"  },
  rejected: { label: "Rejected", color: "#f87171", bg: "rgba(248,113,113,0.1)" },
};

export default async function PublicProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ username: string }>;
  searchParams: Promise<Record<string, string>>;
}) {
  const [{ username }, sp, session] = await Promise.all([params, searchParams, auth()]);

  const [dbUser] = await db.select().from(users).where(eq(users.username, username)).limit(1);
  if (!dbUser) notFound();

  const isOwner = session?.user?.id === dbUser.id;
  const activeTab = (sp.tab as Tab | undefined) ?? "characters";

  const [[{ c: voteCount }], pointSummary] = await Promise.all([
    db.select({ c: count() }).from(votes).where(eq(votes.userId, dbUser.id)),
    getUserPointSummary(dbUser.id),
  ]);

  const [characters, battles, series] = await Promise.all([
    activeTab === "characters" ? getUserContribCharacters(dbUser.id, isOwner) : Promise.resolve(null),
    activeTab === "battles"    ? getUserContribBattles(dbUser.id)             : Promise.resolve(null),
    activeTab === "anime"      ? getUserContribSeries(dbUser.id)              : Promise.resolve(null),
  ]);

  const { balance, lifetimeXp, rank, nextRank, xpToNext, progressPercent } = pointSummary;

  const joinedAt = dbUser.createdAt
    ? new Date(dbUser.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })
    : null;

  const displayName = dbUser.name ?? username;
  const initial     = displayName[0].toUpperCase();
  const rankColor   = RANK_COLORS[rank];
  const rankIcon    = RANK_ICONS[rank];

  function tabHref(tab: Tab) {
    return `/u/${username}?tab=${tab}`;
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-4">

      {/* Profile header */}
      <ClipCard>
        <div className="p-6 space-y-4">
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
      </ClipCard>

      {/* Rank progress */}
      <ClipCard>
        <div className="p-6 space-y-4">
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
      </ClipCard>

      {/* Stats grid */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { icon: <Swords size={16} />, value: Number(voteCount).toLocaleString(), label: "Predictions", color: "var(--color-accent)" },
          { icon: <Flame size={16} />,  value: (dbUser.loginStreak ?? 0).toString(),   label: "Day Streak",  color: "#f59e0b" },
          { icon: <Coins size={16} />,  value: balance.toLocaleString(),               label: "Points",      color: "#22c55e" },
        ].map(({ icon, value, label, color }) => (
          <ClipCard key={label}>
            <div className="p-4 text-center">
              <div className="flex justify-center mb-1" style={{ color }}>{icon}</div>
              <p className="text-2xl font-black" style={{ color }}>{value}</p>
              <p className="text-[10px] font-semibold uppercase tracking-widest mt-1" style={{ color: "var(--color-text-muted)" }}>{label}</p>
            </div>
          </ClipCard>
        ))}
      </div>

      {/* Contributions */}
      <ClipCard>
        {/* Tab bar */}
        <div className="flex" style={{ borderBottom: "1px solid var(--color-border)" }}>
          {TABS.map((tab) => {
            const isActive = tab.id === activeTab;
            return (
              <Link
                key={tab.id}
                href={tabHref(tab.id)}
                className="flex-1 text-center py-3 text-[11px] font-black tracking-widest uppercase transition-colors"
                style={{
                  color:        isActive ? "var(--color-accent)" : "var(--color-text-ghost)",
                  borderBottom: isActive ? "2px solid var(--color-accent)" : "2px solid transparent",
                  marginBottom: -1,
                }}
              >
                {tab.label}
              </Link>
            );
          })}
        </div>

        {/* Characters */}
        {activeTab === "characters" && (
          <div>
            {!characters || characters.length === 0 ? (
              <p className="text-sm text-center py-10" style={{ color: "var(--color-text-ghost)" }}>
                No characters submitted yet.
              </p>
            ) : (
              <div>
                {characters.map((c, i) => (
                  <Link
                    key={c.id}
                    href={`/characters/${c.slug}`}
                    className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-[var(--color-surface-hover)]"
                    style={{ borderTop: i === 0 ? "none" : "1px solid var(--color-border)" }}
                  >
                    <div className="shrink-0 w-10 h-10 rounded-lg overflow-hidden"
                      style={{ background: "var(--color-border)" }}>
                      {c.imageUrl ? (
                        <Image
                          src={c.imageUrl}
                          alt={c.name}
                          width={40}
                          height={40}
                          className="w-full h-full object-cover object-top"
                          unoptimized={c.imageUrl.startsWith("/uploads/")}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-sm font-black"
                          style={{ color: "var(--color-text-ghost)" }}>
                          {c.name[0]}
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold truncate">{c.name}</p>
                      <p className="text-[11px] truncate" style={{ color: "var(--color-text-ghost)" }}>{c.seriesName}</p>
                    </div>

                    {isOwner && c.status !== "approved" && STATUS_BADGE[c.status] && (
                      <span
                        className="shrink-0 text-[9px] font-black tracking-widest uppercase px-2 py-0.5"
                        style={{
                          color:      STATUS_BADGE[c.status].color,
                          background: STATUS_BADGE[c.status].bg,
                          border:     `1px solid ${STATUS_BADGE[c.status].color}44`,
                        }}
                      >
                        {STATUS_BADGE[c.status].label}
                      </span>
                    )}
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Battles */}
        {activeTab === "battles" && (
          <div>
            {!battles || battles.length === 0 ? (
              <p className="text-sm text-center py-10" style={{ color: "var(--color-text-ghost)" }}>
                No battles created yet.
              </p>
            ) : (
              <div>
                {battles.map((b, i) => (
                  <Link
                    key={b.id}
                    href={`/battles/${b.slug}`}
                    className="flex items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-[var(--color-surface-hover)]"
                    style={{ borderTop: i === 0 ? "none" : "1px solid var(--color-border)" }}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold truncate">
                        <span style={{ color: "var(--color-side-a)" }}>{b.labelA}</span>
                        <span className="mx-2 font-black" style={{ color: "var(--color-text-ghost)" }}>vs</span>
                        <span style={{ color: "var(--color-side-b)" }}>{b.labelB}</span>
                      </p>
                      <p className="text-[11px] mt-0.5" style={{ color: "var(--color-text-ghost)" }}>
                        {new Date(b.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </p>
                    </div>

                    <div className="shrink-0 flex items-center gap-1 text-[11px] font-black"
                      style={{ color: "var(--color-text-muted)" }}>
                      <Swords size={11} />
                      {b.totalVotes.toLocaleString()}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Anime */}
        {activeTab === "anime" && (
          <div>
            {!series || series.length === 0 ? (
              <p className="text-sm text-center py-10" style={{ color: "var(--color-text-ghost)" }}>
                No anime series added yet.
              </p>
            ) : (
              <div>
                {series.map((s, i) => (
                  <Link
                    key={s.id}
                    href={`/anime/${s.slug}`}
                    className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-[var(--color-surface-hover)]"
                    style={{ borderTop: i === 0 ? "none" : "1px solid var(--color-border)" }}
                  >
                    <div className="shrink-0 w-10 h-10 rounded-lg overflow-hidden"
                      style={{ background: "var(--color-border)" }}>
                      {s.coverImage ? (
                        <Image
                          src={s.coverImage}
                          alt={s.name}
                          width={40}
                          height={40}
                          className="w-full h-full object-cover"
                          unoptimized={s.coverImage.startsWith("/uploads/")}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center"
                          style={{ color: "var(--color-text-ghost)" }}>
                          <Tv size={16} />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold truncate">{s.name}</p>
                      {s.parentName && (
                        <p className="text-[11px] truncate" style={{ color: "var(--color-text-ghost)" }}>{s.parentName}</p>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
      </ClipCard>

    </div>
  );
}
