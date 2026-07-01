import Link from "next/link";
import { Swords, TrendingUp, Users, Zap, Flame } from "lucide-react";
import { getPlatformStats, getTrendingMatchups, getRecentEntities, getHomepageContestedMatchups } from "@/lib/queries";
import { MatchupCard } from "@/components/matchup-card";
import { CharacterCard } from "@/components/character-card";

export default async function HomePage() {
  const [stats, trending, recent, contested] = await Promise.all([
    getPlatformStats(),
    getTrendingMatchups(6),
    getRecentEntities(12),
    getHomepageContestedMatchups(6),
  ]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-16">

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section className="text-center py-10 space-y-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[var(--color-accent-border)] bg-[var(--color-accent-bg)] text-[var(--color-accent)] text-xs font-bold tracking-widest uppercase">
          <Zap size={11} />
          Power Scaling Community
        </div>

        <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-none">
          MAKE YOUR CASE.
          <br />
          <span className="text-[var(--color-accent)]">SETTLE THE DEBATE.</span>
        </h1>

        <p className="text-[var(--color-text-muted)] text-base max-w-lg mx-auto leading-relaxed">
          Pick a side. Justify it with stats. See if the community agrees.
        </p>

        <div className="flex flex-wrap justify-center gap-3">
          <Link
            href="/battles"
            className="inline-flex items-center gap-2 bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white font-bold px-7 py-3 rounded-xl transition-colors text-sm"
          >
            <Swords size={15} />
            Browse Battles
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 border border-[var(--color-border)] hover:border-[var(--color-accent)] text-[var(--color-text-base)] font-semibold px-7 py-3 rounded-xl transition-colors text-sm"
          >
            Join for Free
          </Link>
        </div>

        {/* Stats row */}
        <div className="flex flex-wrap justify-center gap-10 pt-2">
          {[
            { icon: TrendingUp, value: stats.predictions, label: "Predictions" },
            { icon: Swords,     value: stats.battles,     label: "Active Battles" },
            { icon: Users,      value: stats.characters,  label: "Characters" },
          ].map(({ icon: Icon, value, label }) => (
            <div key={label} className="flex flex-col items-center gap-1">
              <div className="flex items-center gap-1.5">
                <Icon size={14} className="text-[var(--color-accent)]" />
                <span className="font-black text-2xl">{value.toLocaleString()}</span>
              </div>
              <span className="text-[var(--color-text-ghost)] text-xs uppercase tracking-widest font-semibold">
                {label}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Trending Battles ─────────────────────────────────────────── */}
      <section className="space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-black tracking-tight flex items-center gap-2">
            <span className="text-[var(--color-accent)]">⚔</span>
            Trending Battles
          </h2>
          <Link href="/battles" className="text-sm text-[var(--color-accent)] hover:underline font-semibold">
            View all →
          </Link>
        </div>

        {trending.length === 0 ? (
          <EmptyState
            title="No battles yet"
            description="Be the first to spark a debate."
            cta={{ label: "Browse Battles", href: "/battles" }}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {trending.map((m) => <MatchupCard key={m.id} matchup={m} />)}
          </div>
        )}
      </section>

      {/* ── Most Contested Battles ───────────────────────────────────── */}
      {contested.length > 0 && (
        <section className="space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black tracking-tight flex items-center gap-2">
              <Flame size={18} className="text-[var(--color-accent)]" />
              Most Contested — Community Still Can&apos;t Decide
            </h2>
            <Link href="/leaderboards" className="text-sm text-[var(--color-accent)] hover:underline font-semibold">
              Full leaderboards →
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {contested.map((m) => <MatchupCard key={m.id} matchup={m} />)}
          </div>
        </section>
      )}

      {/* ── Recently Added Characters ─────────────────────────────────── */}
      <section className="space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-black tracking-tight flex items-center gap-2">
            <span>✦</span>
            Recently Added
          </h2>
          <Link href="/characters" className="text-sm text-[var(--color-accent)] hover:underline font-semibold">
            All characters →
          </Link>
        </div>

        {recent.length === 0 ? (
          <EmptyState
            title="No characters yet"
            description="Characters appear here once approved."
          />
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
            {recent.map((e) => <CharacterCard key={e.id} entity={e} />)}
          </div>
        )}
      </section>

      {/* ── How it works ─────────────────────────────────────────────── */}
      <section className="border border-[var(--color-border)] rounded-2xl p-8 space-y-8 bg-[var(--color-surface)]">
        <h2 className="text-lg font-black tracking-tight text-center">How It Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              num: "01",
              title: "Pick a Battle",
              desc: "Browse fan-favorite matchups or create your own. Solo fighters or full teams.",
            },
            {
              num: "02",
              title: "Justify Your Pick",
              desc: "Slide per-stat scores for each fighter — Speed, Strength, Hax, and more.",
            },
            {
              num: "03",
              title: "See Where You Stand",
              desc: "Compare your prediction against the community and earn rank as you go.",
            },
          ].map(({ num, title, desc }) => (
            <div key={num} className="flex flex-col items-center text-center gap-3">
              <span className="text-4xl font-black text-[var(--color-accent)] opacity-30 leading-none">
                {num}
              </span>
              <p className="font-bold text-[var(--color-text-base)]">{title}</p>
              <p className="text-sm text-[var(--color-text-muted)] leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
        <div className="flex justify-center">
          <Link
            href="/battles"
            className="inline-flex items-center gap-2 bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white font-bold px-6 py-2.5 rounded-xl transition-colors text-sm"
          >
            <Swords size={14} />
            Start Predicting
          </Link>
        </div>
      </section>
    </div>
  );
}

function EmptyState({
  title, description, cta,
}: {
  title: string;
  description: string;
  cta?: { label: string; href: string };
}) {
  return (
    <div className="border border-dashed border-[var(--color-border)] rounded-2xl py-16 text-center space-y-3">
      <p className="font-bold text-[var(--color-text-muted)]">{title}</p>
      <p className="text-sm text-[var(--color-text-ghost)]">{description}</p>
      {cta && (
        <Link href={cta.href} className="inline-block mt-2 text-sm font-semibold text-[var(--color-accent)] hover:underline">
          {cta.label}
        </Link>
      )}
    </div>
  );
}
