export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const alt = "AnimeWarBoard user profile";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

import { ImageResponse } from "next/og";
import { db } from "@/db";
import { users, votes } from "@/db/schema";
import { eq, count } from "drizzle-orm";
import { getUserPointSummary } from "@/lib/points";
import { RANK_COLORS, RANK_ICONS } from "@/lib/ranks";

const BG      = "#0b0d18";
const SURFACE = "#161926";
const BORDER  = "#2a2f4a";
const GHOST   = "#4a5070";
const MUTED   = "#7c82a0";
const ACCENT  = "#f97316";
const WHITE   = "#e8eaf6";

export default async function Image({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;

  const [dbUser] = await db
    .select()
    .from(users)
    .where(eq(users.username, username))
    .limit(1);

  if (!dbUser) {
    return new ImageResponse(
      <div style={{ display: "flex", width: "100%", height: "100%", background: BG, alignItems: "center", justifyContent: "center" }}>
        <span style={{ color: MUTED, fontSize: 24 }}>User not found</span>
      </div>,
      size,
    );
  }

  const [[{ c: voteCount }], pointSummary] = await Promise.all([
    db.select({ c: count() }).from(votes).where(eq(votes.userId, dbUser.id)),
    getUserPointSummary(dbUser.id),
  ]);

  const { balance, lifetimeXp, rank, nextRank, progressPercent } = pointSummary;
  const rankColor = RANK_COLORS[rank];
  const rankIcon  = RANK_ICONS[rank];
  const displayName = dbUser.name ?? username;
  const initial     = displayName[0].toUpperCase();
  const streak      = dbUser.loginStreak ?? 0;

  const stats = [
    { label: "PREDICTIONS", value: Number(voteCount).toLocaleString(), color: ACCENT },
    { label: "DAY STREAK",  value: streak.toLocaleString(),             color: "#f59e0b" },
    { label: "POINTS",      value: balance.toLocaleString(),            color: "#22c55e" },
  ];

  return new ImageResponse(
    <div style={{ display: "flex", flexDirection: "column", width: "100%", height: "100%", background: BG, fontFamily: "sans-serif" }}>

      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 40px", height: 56, background: SURFACE,
        borderBottomWidth: "1px", borderBottomStyle: "solid", borderBottomColor: BORDER, flexShrink: 0,
      }}>
        <span style={{ fontSize: 12, fontWeight: 900, letterSpacing: "0.15em", color: ACCENT }}>
          MEMBER PROFILE
        </span>
        <span style={{ fontSize: 10, fontWeight: 700, color: GHOST, letterSpacing: "0.08em" }}>
          ANIMEWARBOARD.COM
        </span>
      </div>

      {/* Body */}
      <div style={{ display: "flex", flex: 1, padding: "48px 64px", gap: 64, alignItems: "center" }}>

        {/* Left — avatar + name */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20, flexShrink: 0 }}>
          {/* Avatar */}
          <div style={{
            display: "flex", width: 160, height: 160, borderRadius: "20px",
            background: `${rankColor}22`,
            boxShadow: `0 0 0 3px ${rankColor}, 0 0 40px ${rankColor}66`,
            alignItems: "center", justifyContent: "center",
          }}>
            <span style={{ color: rankColor, fontSize: 80, fontWeight: 900 }}>{initial}</span>
          </div>

          {/* Rank icon + name */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 40, filter: `drop-shadow(0 0 10px ${rankColor}99)` }}>{rankIcon}</span>
            <span style={{
              fontSize: 11, fontWeight: 900, letterSpacing: "0.18em", textTransform: "uppercase",
              color: rankColor,
            }}>
              {rank}
            </span>
          </div>
        </div>

        {/* Right — details */}
        <div style={{ display: "flex", flexDirection: "column", gap: 24, flex: 1 }}>

          {/* Name + username */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={{ fontSize: 48, fontWeight: 900, color: WHITE, lineHeight: 1.1, letterSpacing: "-0.01em" }}>
              {displayName}
            </span>
            <span style={{ fontSize: 18, fontWeight: 700, color: GHOST, letterSpacing: "0.04em" }}>
              @{username}
            </span>
          </div>

          {/* XP bar */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 10, fontWeight: 900, letterSpacing: "0.14em", color: MUTED }}>
                XP PROGRESS
              </span>
              <span style={{ fontSize: 12, fontWeight: 900, color: rankColor }}>
                {lifetimeXp.toLocaleString()} XP{nextRank ? ` → ${nextRank}` : " · MAX RANK"}
              </span>
            </div>
            <div style={{ display: "flex", height: 8, background: BORDER, borderRadius: 4, overflow: "hidden" }}>
              <div style={{ width: `${progressPercent}%`, background: rankColor, borderRadius: 4 }} />
            </div>
          </div>

          {/* Stats row */}
          <div style={{ display: "flex", gap: 16 }}>
            {stats.map(({ label, value, color }) => (
              <div key={label} style={{
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                flex: 1, padding: "16px 12px", gap: 6,
                background: SURFACE,
                borderWidth: "1px", borderStyle: "solid", borderColor: BORDER,
              }}>
                <span style={{ fontSize: 28, fontWeight: 900, color }}>{value}</span>
                <span style={{ fontSize: 9, fontWeight: 900, letterSpacing: "0.14em", color: MUTED }}>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>,
    size,
  );
}
