import { auth, signOut } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { votes, users } from "@/db/schema";
import { eq, count } from "drizzle-orm";
import Link from "next/link";
import { Swords, Calendar, Shield, LogOut } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "My Profile" };

const RANKS = [
  { label: "Private",      minXp: 0     },
  { label: "Corporal",     minXp: 100   },
  { label: "Sergeant",     minXp: 500   },
  { label: "Colonel",      minXp: 2000  },
  { label: "Field Marshal",minXp: 10000 },
];

function getRank(xp: number) {
  return [...RANKS].reverse().find((r) => xp >= r.minXp) ?? RANKS[0];
}

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const userId = session.user.id;

  const [dbUser] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  const [{ c: voteCount }] = await db.select({ c: count() }).from(votes).where(eq(votes.userId, userId));

  const totalXp = Number(voteCount) * 10; // placeholder: 10 XP per prediction
  const rank = getRank(totalXp);
  const nextRank = RANKS[RANKS.indexOf(rank) + 1];
  const progressPercent = nextRank
    ? Math.min(100, Math.round(((totalXp - rank.minXp) / (nextRank.minXp - rank.minXp)) * 100))
    : 100;

  const joinedAt = dbUser?.createdAt
    ? new Date(dbUser.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })
    : null;

  const initial = ((session.user.name ?? session.user.email ?? "?")[0]).toUpperCase();

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">

      {/* Profile header */}
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-6">
        <div className="flex items-start gap-5">
          {/* Avatar */}
          <div className="shrink-0">
            {session.user.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={session.user.image}
                alt={session.user.name ?? ""}
                className="w-16 h-16 rounded-2xl object-cover"
              />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-[var(--color-accent)] flex items-center justify-center text-white text-2xl font-black">
                {initial}
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-black tracking-tight truncate">
              {session.user.name ?? "Anonymous"}
            </h1>
            <p className="text-sm text-[var(--color-text-muted)] truncate">{session.user.email}</p>

            <div className="flex items-center gap-3 mt-2">
              {/* Rank badge */}
              <span className="text-[10px] font-bold tracking-widest uppercase border border-[var(--color-accent)] text-[var(--color-accent)] px-2.5 py-0.5 rounded-full">
                {rank.label}
              </span>
              {joinedAt && (
                <span className="flex items-center gap-1 text-xs text-[var(--color-text-ghost)]">
                  <Calendar size={10} />
                  Joined {joinedAt}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* XP progress */}
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-black tracking-widest uppercase text-[var(--color-text-muted)]">
            Rank Progress
          </h2>
          <span className="text-xs text-[var(--color-text-ghost)]">{totalXp.toLocaleString()} XP</span>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-xs font-semibold">
            <span className="text-[var(--color-accent)]">{rank.label}</span>
            {nextRank ? (
              <span className="text-[var(--color-text-ghost)]">{nextRank.label}</span>
            ) : (
              <span className="text-[var(--color-gold)]">Max Rank</span>
            )}
          </div>
          <div className="h-2 bg-[var(--color-border)] rounded-full overflow-hidden">
            <div
              className="h-full bg-[var(--color-accent)] rounded-full transition-all"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          {nextRank && (
            <p className="text-[10px] text-[var(--color-text-ghost)]">
              {(nextRank.minXp - totalXp).toLocaleString()} XP to {nextRank.label}
            </p>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-5 text-center">
          <p className="text-3xl font-black text-[var(--color-accent)]">{Number(voteCount).toLocaleString()}</p>
          <p className="text-xs font-semibold text-[var(--color-text-muted)] mt-1 uppercase tracking-widest">Predictions</p>
        </div>
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-5 text-center">
          <p className="text-3xl font-black text-[var(--color-gold)]">{dbUser?.loginStreak ?? 0}</p>
          <p className="text-xs font-semibold text-[var(--color-text-muted)] mt-1 uppercase tracking-widest">Day Streak</p>
        </div>
      </div>

      {/* Quick links */}
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl divide-y divide-[var(--color-border)]">
        <Link href="/battles"
          className="flex items-center gap-3 px-5 py-4 hover:bg-[var(--color-surface-hover)] transition-colors">
          <Swords size={16} className="text-[var(--color-text-muted)]" />
          <span className="text-sm font-semibold">Browse Battles</span>
        </Link>
        <Link href="/characters"
          className="flex items-center gap-3 px-5 py-4 hover:bg-[var(--color-surface-hover)] transition-colors">
          <Shield size={16} className="text-[var(--color-text-muted)]" />
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
            className="w-full flex items-center gap-3 px-5 py-4 hover:bg-[var(--color-surface-hover)] transition-colors text-left text-red-400"
          >
            <LogOut size={16} />
            <span className="text-sm font-semibold">Sign Out</span>
          </button>
        </form>
      </div>
    </div>
  );
}
