export const dynamic = "force-dynamic";

import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Lock } from "lucide-react";
import { CreateMatchupForm } from "@/components/create-matchup-form";
import { getUserPointSummary } from "@/lib/points";
import { CORPORAL_RANK_INDEX, RANK_COLORS, RANK_ICONS } from "@/lib/ranks";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Create Battle" };

export default async function CreateBattlePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?returnTo=/battles/create");

  const { rankIndex, rank, xpToNext, nextRank } = await getUserPointSummary(session.user.id);
  const locked = rankIndex < CORPORAL_RANK_INDEX;

  if (locked) {
    const corporalColor = RANK_COLORS["Corporal"];
    const rankColor     = RANK_COLORS[rank];
    const rankIcon      = RANK_ICONS[rank];
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-6">
        <div className="flex items-center justify-center w-16 h-16 rounded-2xl mx-auto"
          style={{ background: `${corporalColor}18`, border: `1px solid ${corporalColor}40` }}>
          <Lock size={28} style={{ color: corporalColor }} />
        </div>
        <div className="space-y-2">
          <p className="text-xs font-black tracking-widest uppercase" style={{ color: corporalColor }}>
            Corporal rank required
          </p>
          <h1 className="text-2xl font-black">Create a Battle</h1>
          <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
            Creating battles is unlocked at{" "}
            <span className="font-bold" style={{ color: corporalColor }}>Corporal</span> rank.
            {xpToNext !== null && (
              <> You need <span className="font-bold">{xpToNext.toLocaleString()} more XP</span> to get there.</>
            )}
          </p>
        </div>
        <div className="flex items-center justify-center gap-2 text-sm px-5 py-3 rounded-xl"
          style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", display: "inline-flex" }}>
          <span style={{ fontSize: 18 }}>{rankIcon}</span>
          <span className="font-bold" style={{ color: rankColor }}>Your rank: {rank}</span>
          {nextRank && (
            <span style={{ color: "var(--color-text-ghost)" }}>→ {nextRank}</span>
          )}
        </div>
        <div className="flex gap-3 justify-center pt-2">
          <Link href="/battles"
            className="px-5 py-2.5 rounded-lg text-sm font-bold"
            style={{ background: "var(--color-accent)", color: "#fff" }}>
            Earn XP in Battles
          </Link>
          <Link href="/ranks"
            className="px-5 py-2.5 rounded-lg text-sm font-bold"
            style={{ border: "1px solid var(--color-border)", color: "var(--color-text-muted)" }}>
            View All Ranks
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-black">Create a Battle</h1>
        <p className="text-sm mt-1" style={{ color: "var(--color-text-muted)" }}>
          Pick a character for each side. The community will decide who wins.
        </p>
      </div>
      <CreateMatchupForm />
    </div>
  );
}
