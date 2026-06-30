import { auth, signOut } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { votes, users, adminSettings } from "@/db/schema";
import { eq, count } from "drizzle-orm";
import Link from "next/link";

import { Swords, Calendar, Shield, LogOut, Zap, Flame, Coins, Star } from "lucide-react";
import type { Metadata } from "next";
import { getUserPointSummary } from "@/lib/points";
import { RANK_COLORS, RANK_ICONS } from "@/lib/ranks";
import { RankBadge } from "@/components/rank-badge";
import { UsernameForm } from "@/components/username-form";
import { ImageUploadCrop } from "@/components/image-upload-crop";
import { updateAvatarAction } from "@/app/actions/update-avatar";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "My Profile" };

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const userId = session.user.id;

  const [[dbUser], [{ c: voteCount }], pointSummary, cooldownRow] = await Promise.all([
    db.select().from(users).where(eq(users.id, userId)).limit(1),
    db.select({ c: count() }).from(votes).where(eq(votes.userId, userId)),
    getUserPointSummary(userId),
    db.select({ value: adminSettings.value }).from(adminSettings).where(eq(adminSettings.key, "username_change_cooldown_days")).limit(1),
  ]);

  const cooldownDays = cooldownRow[0]?.value ?? 30;

  const { balance, lifetimeXp, rank, nextRank, xpToNext, progressPercent } = pointSummary;

  const joinedAt = dbUser?.createdAt
    ? new Date(dbUser.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })
    : null;

  const avatarUrl = dbUser?.image ?? session.user.image ?? null;
  const initial = ((session.user.name ?? session.user.email ?? "?")[0]).toUpperCase();
  const rankColor = RANK_COLORS[rank];
  const rankIcon  = RANK_ICONS[rank];

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-4">

      {/* Profile header */}
      <div className="p-6 space-y-4" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
        <div className="flex items-start gap-5">
          <div className="shrink-0">
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatarUrl} alt={session.user.name ?? ""}
                className="w-16 h-16 rounded-xl object-cover"
              />
            ) : (
              <div className="w-16 h-16 rounded-xl flex items-center justify-center text-white text-2xl font-black"
                style={{ background: rankColor }}>
                {initial}
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0 space-y-2">
            <div>
              <h1 className="text-2xl font-black tracking-tight truncate">
                {session.user.name ?? "Anonymous"}
              </h1>
              <p className="text-sm truncate" style={{ color: "var(--color-text-muted)" }}>
                {session.user.email}
              </p>
              {dbUser?.username && (
                <Link href={`/u/${dbUser.username}`} className="text-sm font-mono hover:underline"
                  style={{ color: "var(--color-text-ghost)" }}>
                  @{dbUser.username}
                </Link>
              )}
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <RankBadge rank={rank} size="sm" />
              {dbUser?.isPatron && (
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

        {/* Big rank icon */}
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
          { icon: <Flame size={16} />,  value: (dbUser?.loginStreak ?? 0).toString(), label: "Day Streak", color: "#f59e0b" },
          { icon: <Coins size={16} />,  value: balance.toLocaleString(),  label: "Points",     color: "#22c55e" },
        ].map(({ icon, value, label, color }) => (
          <div key={label} className="p-4 text-center" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
            <div className="flex justify-center mb-1" style={{ color }}>{icon}</div>
            <p className="text-2xl font-black" style={{ color }}>{value}</p>
            <p className="text-[10px] font-semibold uppercase tracking-widest mt-1" style={{ color: "var(--color-text-muted)" }}>{label}</p>
          </div>
        ))}
      </div>

      {/* Avatar upload */}
      <div className="p-5 space-y-3" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
        <p className="text-[10px] font-black tracking-widest uppercase" style={{ color: "var(--color-text-ghost)" }}>
          Profile Photo
        </p>
        <form action={updateAvatarAction} className="space-y-3">
          <ImageUploadCrop
            name="imageUrl"
            uploadType="avatars"
            aspectRatio={1}
            label="Upload a photo (1:1)"
            currentUrl={avatarUrl ?? undefined}
            apiRoute="/api/upload"
          />
          <button
            type="submit"
            className="px-4 py-2 rounded-lg text-sm font-black text-white"
            style={{ background: "var(--color-accent)" }}
          >
            Save Photo
          </button>
        </form>
      </div>

      {/* Username */}
      <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
        <UsernameForm
          current={dbUser?.username ?? ""}
          cooldownDays={cooldownDays}
          changedAt={dbUser?.usernameChangedAt ?? null}
        />
      </div>

      {/* Quick links */}
      <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
        <Link href="/ranks"
          className="flex items-center gap-3 px-5 py-4 transition-colors"
          style={{ borderBottom: "1px solid var(--color-border)" }}>
          <Star size={16} style={{ color: "var(--color-text-muted)" }} />
          <span className="text-sm font-semibold">Ranks & How to Earn XP</span>
        </Link>
        <Link href="/battles"
          className="flex items-center gap-3 px-5 py-4 transition-colors"
          style={{ borderBottom: "1px solid var(--color-border)" }}>
          <Swords size={16} style={{ color: "var(--color-text-muted)" }} />
          <span className="text-sm font-semibold">Browse Battles</span>
        </Link>
        <Link href="/characters"
          className="flex items-center gap-3 px-5 py-4 transition-colors"
          style={{ borderBottom: "1px solid var(--color-border)" }}>
          <Shield size={16} style={{ color: "var(--color-text-muted)" }} />
          <span className="text-sm font-semibold">Browse Characters</span>
        </Link>
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/" });
          }}
        >
          <button
            type="submit"
            className="w-full flex items-center gap-3 px-5 py-4 text-left text-red-400"
          >
            <LogOut size={16} />
            <span className="text-sm font-semibold">Sign Out</span>
          </button>
        </form>
      </div>
    </div>
  );
}
