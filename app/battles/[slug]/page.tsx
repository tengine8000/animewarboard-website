export const dynamic = "force-dynamic";

import { getMatchupBySlug, deriveSideLabel } from "@/lib/queries";
import { notFound } from "next/navigation";
import Link from "next/link";
import { FighterCarousel } from "@/components/fighter-carousel";
import { Swords, Lock } from "lucide-react";
import type { Metadata } from "next";
import { auth } from "@/auth";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const data = await getMatchupBySlug(slug);
  if (!data) return { title: "Battle Not Found" };
  const labelA = deriveSideLabel(data.sideALabel, data.sideA);
  const labelB = deriveSideLabel(data.sideBLabel, data.sideB);
  return {
    title: `${labelA} vs ${labelB}`,
    description: `Who wins? ${labelA} vs ${labelB} — make your prediction on AnimeWarBoard.`,
    openGraph: {
      title: `${labelA} vs ${labelB} | AnimeWarBoard`,
      description: `${data.voteSummary.total.toLocaleString()} community predictions. Make yours.`,
    },
  };
}

export default async function BattlePage({ params }: Props) {
  const { slug } = await params;
  const [data, session] = await Promise.all([
    getMatchupBySlug(slug),
    auth(),
  ]);
  if (!data) notFound();

  const { sideA, sideB, sideALabel, sideBLabel, voteSummary } = data;
  const labelA = deriveSideLabel(sideALabel, sideA);
  const labelB = deriveSideLabel(sideBLabel, sideB);
  const isLoggedIn = !!session?.user;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">

      {/* Breadcrumb */}
      <nav className="text-sm text-[var(--color-text-muted)]">
        <Link href="/battles" className="hover:text-[var(--color-accent)]">Battles</Link>
        <span className="mx-2">/</span>
        <span className="text-[var(--color-text-base)] line-clamp-1">{labelA} vs {labelB}</span>
      </nav>

      {/* Battle Overview Card */}
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--color-border)]">
          <p className="text-xs font-bold tracking-widest text-[var(--color-text-muted)] uppercase">
            Battle Overview
          </p>
          {voteSummary.total > 0 && (
            <span className="flex items-center gap-1.5 text-[10px] font-bold tracking-widest text-[var(--color-accent)] uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-accent)] animate-pulse" />
              {voteSummary.total.toLocaleString()} Predictions
            </span>
          )}
        </div>

        {/* Fighter panels */}
        <div className="grid grid-cols-3 gap-4 px-5 py-8 items-center">
          <FighterCarousel participants={sideA} side="a" label={labelA} />

          {/* Center — VS + community metrics */}
          <div className="flex flex-col items-center gap-4">
            <span className="text-[var(--color-accent)] font-black text-3xl tracking-widest">VS</span>

            {/* Vote split bar */}
            {voteSummary.total > 0 && (
              <div className="w-full space-y-1">
                <div className="flex h-2 rounded-full overflow-hidden">
                  <div className="bg-[var(--color-side-a)] transition-all" style={{ width: `${voteSummary.aPercent}%` }} />
                  {voteSummary.drawPercent > 0 && (
                    <div className="bg-[var(--color-text-muted)] transition-all" style={{ width: `${voteSummary.drawPercent}%` }} />
                  )}
                  <div className="bg-[var(--color-side-b)] transition-all" style={{ width: `${voteSummary.bPercent}%` }} />
                </div>
                <div className="flex justify-between text-[10px] font-semibold">
                  <span style={{ color: "var(--color-side-a)" }}>{voteSummary.aPercent}%</span>
                  <span style={{ color: "var(--color-side-b)" }}>{voteSummary.bPercent}%</span>
                </div>
              </div>
            )}

            {/* Settled / Contested badge */}
            {voteSummary.settled && (
              <span className="text-[10px] font-bold text-emerald-500 tracking-widest uppercase border border-emerald-500/30 px-2 py-0.5 rounded-full">
                Settled
              </span>
            )}
            {voteSummary.contested && (
              <span className="text-[10px] font-bold text-amber-500 tracking-widest uppercase border border-amber-500/30 px-2 py-0.5 rounded-full">
                Contested
              </span>
            )}
          </div>

          <FighterCarousel participants={sideB} side="b" label={labelB} />
        </div>

        {/* Community metrics */}
        {voteSummary.total > 0 && (
          <div className="grid grid-cols-2 border-t border-[var(--color-border)] divide-x divide-[var(--color-border)]">
            <div className="px-5 py-4 text-center">
              <p className="text-[10px] font-bold tracking-widest text-[var(--color-text-muted)] uppercase mb-1">Community Edge</p>
              <p className="text-lg font-black text-[var(--color-side-a)]">
                {labelA} {voteSummary.aPercent}%
              </p>
              <p className="text-[10px] text-[var(--color-text-ghost)]">Overall community lean</p>
            </div>
            <div className="px-5 py-4 text-center">
              <p className="text-[10px] font-bold tracking-widest text-[var(--color-text-muted)] uppercase mb-1">Prediction Confidence</p>
              <p className="text-lg font-black text-[var(--color-gold)]">—</p>
              <p className="text-[10px] text-[var(--color-text-ghost)]">Submit your pick to see yours</p>
            </div>
          </div>
        )}
      </div>

      {/* Prediction Form */}
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl overflow-hidden">

        {/* 1. Verdict */}
        <div className="px-5 py-5 border-b border-[var(--color-border)]">
          <p className="text-xs font-bold tracking-widest text-[var(--color-text-muted)] uppercase mb-4">
            1. How will this battle end?
          </p>
          <div className="grid grid-cols-3 gap-3">
            <VerdictButton label={`${labelA} Wins`} side="a" disabled={!isLoggedIn} />
            <VerdictButton label={`${labelB} Wins`} side="b" disabled={!isLoggedIn} />
            <VerdictButton label="Draw" side="draw" disabled={!isLoggedIn} />
          </div>
        </div>

        {/* 2. Difficulty */}
        <div className="px-5 py-5 border-b border-[var(--color-border)]">
          <p className="text-xs font-bold tracking-widest text-[var(--color-text-muted)] uppercase mb-4">
            2. How difficult is this battle?
          </p>
          <div className="flex gap-2 flex-wrap">
            {(["Very Easy", "Easy", "Medium", "Hard", "Extreme"] as const).map((d, i) => (
              <button key={d} disabled={!isLoggedIn}
                className="flex-1 min-w-[72px] px-3 py-2 rounded-xl border border-[var(--color-border)] text-sm font-semibold text-[var(--color-text-muted)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                <span className="text-[var(--color-text-ghost)] text-xs block">{i + 1}</span>
                {d}
              </button>
            ))}
          </div>
        </div>

        {/* 3. Justify Your Pick */}
        <div className="px-5 py-5 border-b border-[var(--color-border)]">
          <div className="flex items-center gap-2 mb-4">
            <p className="text-xs font-bold tracking-widest text-[var(--color-text-muted)] uppercase">
              3. Justify Your Pick
            </p>
            <span className="text-[10px] text-[var(--color-text-ghost)] border border-[var(--color-border)] px-2 py-0.5 rounded-full">
              Sergeant+ rank required
            </span>
          </div>

          {/* Stat slider rows */}
          {[
            { label: "Speed",        emoji: "⚡" },
            { label: "IQ / Battle IQ", emoji: "🧠" },
            { label: "Strength",     emoji: "💪" },
            { label: "Durability",   emoji: "🛡️" },
            { label: "Stamina",      emoji: "❤️" },
            { label: "Hax / Abilities", emoji: "✨" },
            { label: "Power",        emoji: "🔥" },
            { label: "EXP / Battle IQ", emoji: "📖" },
            { label: "Versatility",  emoji: "🌀" },
          ].map(({ label, emoji }) => (
            <div key={label} className="flex items-center gap-3 py-2">
              <span className="w-5 text-center text-sm shrink-0">{emoji}</span>
              <span className="text-xs font-semibold text-[var(--color-text-muted)] w-28 shrink-0">{label}</span>
              <div className="flex-1 h-1.5 bg-[var(--color-border)] rounded-full overflow-hidden">
                <div className="h-full w-1/2 bg-gradient-to-r from-[var(--color-side-a)] to-[var(--color-side-b)]" />
              </div>
              <span className="text-[10px] text-[var(--color-text-ghost)] w-6 text-center shrink-0">50</span>
            </div>
          ))}
          {!isLoggedIn && (
            <p className="text-xs text-[var(--color-text-ghost)] mt-2 text-center">
              Sign in to adjust stats
            </p>
          )}
        </div>

        {/* Gate / Submit */}
        <div className="px-5 py-4 flex items-center justify-between gap-4">
          {isLoggedIn ? (
            <>
              <button className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-base)] transition-colors">
                Reset
              </button>
              <button className="bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white font-black px-8 py-3 rounded-xl text-sm tracking-wide transition-colors flex items-center gap-2">
                <Swords size={14} />
                SUBMIT PREDICTION
              </button>
            </>
          ) : (
            <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-3">
              <p className="text-sm text-[var(--color-text-muted)] flex items-center gap-2">
                <Lock size={14} className="text-[var(--color-text-ghost)]" />
                Sign in to submit your prediction
              </p>
              <div className="flex gap-2">
                <Link href="/login"
                  className="text-sm font-semibold border border-[var(--color-border)] hover:border-[var(--color-accent)] text-[var(--color-text-base)] px-4 py-2 rounded-xl transition-colors">
                  Sign In
                </Link>
                <Link href="/register"
                  className="text-sm font-black bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white px-4 py-2 rounded-xl transition-colors flex items-center gap-2">
                  <Swords size={13} />
                  JOIN FREE
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Comments placeholder */}
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl px-5 py-5">
        <h2 className="text-sm font-black tracking-widest text-[var(--color-text-muted)] uppercase mb-4">
          Community Discussion
        </h2>
        <div className="border border-dashed border-[var(--color-border)] rounded-xl py-10 text-center">
          <p className="text-sm text-[var(--color-text-muted)]">Comments coming soon.</p>
          {!isLoggedIn && (
            <Link href="/register" className="text-xs text-[var(--color-accent)] hover:underline mt-1 block">
              Join to be first to comment
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

function VerdictButton({
  label, side, disabled,
}: {
  label: string;
  side: "a" | "b" | "draw";
  disabled: boolean;
}) {
  const colors: Record<string, string> = {
    a:    "border-[var(--color-side-a)] hover:bg-[var(--color-side-a-bg)] hover:text-[var(--color-side-a)]",
    b:    "border-[var(--color-side-b)] hover:bg-[var(--color-side-b-bg)] hover:text-[var(--color-side-b)]",
    draw: "border-[var(--color-border)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]",
  };
  return (
    <button
      disabled={disabled}
      className={`w-full py-3 rounded-xl border font-bold text-sm text-[var(--color-text-muted)] transition-all disabled:opacity-40 disabled:cursor-not-allowed ${colors[side]}`}
    >
      {label}
    </button>
  );
}
