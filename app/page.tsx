import Link from "next/link";
import { Swords, TrendingUp, Users, Shield } from "lucide-react";
import { getPlatformStats, getTrendingMatchups, getRecentEntities } from "@/lib/queries";
import { MatchupCard } from "@/components/matchup-card";
import { CharacterCard } from "@/components/character-card";

export default async function HomePage() {
  const [stats, trending, recent] = await Promise.all([
    getPlatformStats(),
    getTrendingMatchups(6),
    getRecentEntities(8),
  ]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-16">

      {/* Hero */}
      <section className="text-center py-12 space-y-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[var(--color-accent-border)] bg-[var(--color-accent-bg)] text-[var(--color-accent)] text-xs font-semibold tracking-wider uppercase">
          <Swords size={12} />
          Power Scaling Community
        </div>

        <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-tight">
          MAKE YOUR CASE.
          <br />
          <span className="text-[var(--color-accent)]">SETTLE THE DEBATE.</span>
        </h1>

        <p className="text-[var(--color-text-muted)] text-lg max-w-xl mx-auto">
          Predict anime battles, justify your pick with stats, and see how your
          prediction stacks up against the entire community.
        </p>

        <div className="flex flex-wrap justify-center gap-3">
          <Link href="/battles"
            className="bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white font-bold px-6 py-3 rounded-xl transition-colors">
            Browse Battles
          </Link>
          <Link href="/register"
            className="border border-[var(--color-border)] hover:border-[var(--color-accent)] text-[var(--color-text-base)] font-semibold px-6 py-3 rounded-xl transition-colors">
            Join for Free
          </Link>
        </div>

        {/* Stats */}
        <div className="flex flex-wrap justify-center gap-8 pt-4">
          {[
            { icon: TrendingUp, value: stats.predictions, label: "Predictions Made" },
            { icon: Swords,     value: stats.battles,     label: "Active Battles"   },
            { icon: Users,      value: stats.characters,  label: "Characters"       },
          ].map(({ icon: Icon, value, label }) => (
            <div key={label} className="flex items-center gap-2">
              <Icon size={16} className="text-[var(--color-accent)]" />
              <span className="font-black text-xl">{value.toLocaleString()}</span>
              <span className="text-[var(--color-text-muted)] text-sm">{label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Trending Battles */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-black tracking-tight">
            🔥 Trending Battles
          </h2>
          <Link href="/battles" className="text-sm text-[var(--color-accent)] hover:underline font-semibold">
            View all →
          </Link>
        </div>

        {trending.length === 0 ? (
          <EmptyState
            title="No battles yet"
            description="Be the first to spark a debate."
            cta={{ label: "Create a Battle", href: "/battles" }}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {trending.map((m) => <MatchupCard key={m.id} matchup={m} />)}
          </div>
        )}
      </section>

      {/* Recently Added */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-black tracking-tight">
            ✨ Recently Added
          </h2>
          <Link href="/characters" className="text-sm text-[var(--color-accent)] hover:underline font-semibold">
            All characters →
          </Link>
        </div>

        {recent.length === 0 ? (
          <EmptyState
            title="No characters yet"
            description="Characters will appear here once approved."
          />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
            {recent.map((e) => <CharacterCard key={e.id} entity={e} />)}
          </div>
        )}
      </section>

      {/* How it works */}
      <section className="border border-[var(--color-border)] rounded-2xl p-8 space-y-6 bg-[var(--color-surface)]">
        <h2 className="text-xl font-black tracking-tight text-center">How It Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { icon: "⚔️", title: "Pick a Battle", desc: "Browse fan-favorite matchups or create your own. Solo fighters or full teams." },
            { icon: "📊", title: "Justify Your Pick", desc: "Slide per-stat scores for each fighter. Speed, Strength, Hax, and more — make your case." },
            { icon: "🏆", title: "See Where You Stand", desc: "Compare your prediction against thousands of others. Earn rank as you go." },
          ].map(({ icon, title, desc }) => (
            <div key={title} className="text-center space-y-2">
              <div className="text-3xl">{icon}</div>
              <p className="font-bold text-[var(--color-text-base)]">{title}</p>
              <p className="text-sm text-[var(--color-text-muted)]">{desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function EmptyState({ title, description, cta }: {
  title: string;
  description: string;
  cta?: { label: string; href: string };
}) {
  return (
    <div className="border border-dashed border-[var(--color-border)] rounded-2xl py-16 text-center space-y-3">
      <p className="font-bold text-[var(--color-text-muted)]">{title}</p>
      <p className="text-sm text-[var(--color-text-ghost)]">{description}</p>
      {cta && (
        <Link href={cta.href}
          className="inline-block mt-2 text-sm font-semibold text-[var(--color-accent)] hover:underline">
          {cta.label}
        </Link>
      )}
    </div>
  );
}
