import { getAllMatchups, getPlatformStats } from "@/lib/queries";
import { MatchupCard } from "@/components/matchup-card";
import { Swords, Flame, Clock, TrendingUp } from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Battles",
  description: "Browse all anime battles and submit your predictions on AnimeWarBoard.",
};

const SORT_MAP: Record<string, "votes" | "recent" | "controversial"> = {
  votes:     "votes",
  recent:    "recent",
  contested: "controversial",
};

export default async function BattlesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const sp = await searchParams;
  const rawSort = sp.sort ?? "votes";
  const sort = SORT_MAP[rawSort] ?? "votes";

  const [matchups, stats] = await Promise.all([
    getAllMatchups({ limit: 24, sort }),
    getPlatformStats(),
  ]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">

      {/* Hero */}
      <div
        className="relative rounded-3xl overflow-hidden p-8 md:p-12"
        style={{
          background: "linear-gradient(135deg, var(--color-surface) 0%, color-mix(in srgb, var(--color-accent) 8%, var(--color-surface)) 100%)",
          border: "1px solid var(--color-border)",
        }}
      >
        {/* Decorative swords */}
        <div className="absolute right-8 top-8 opacity-5 pointer-events-none">
          <Swords size={160} strokeWidth={0.5} />
        </div>

        <div className="relative space-y-4 max-w-xl">
          <div className="flex items-center gap-2">
            <Flame size={16} className="text-[var(--color-accent)]" />
            <span className="text-xs font-bold tracking-widest uppercase text-[var(--color-accent)]">
              Arena
            </span>
          </div>

          <h1 className="text-4xl md:text-5xl font-black tracking-tight leading-none">
            Choose Your Side.
          </h1>

          <p className="text-[var(--color-text-muted)] text-sm leading-relaxed max-w-sm">
            Every battle is a live debate. Your prediction joins{" "}
            <span className="text-[var(--color-text-base)] font-semibold">
              {stats.predictions.toLocaleString()}
            </span>{" "}
            others — submit yours and see where the community stands.
          </p>

          {/* Quick stats */}
          <div className="flex gap-6 pt-2">
            {[
              { label: "Battles", value: stats.battles },
              { label: "Predictions", value: stats.predictions },
              { label: "Characters", value: stats.characters },
            ].map(({ label, value }) => (
              <div key={label}>
                <p className="text-xl font-black text-[var(--color-text-base)]">
                  {value.toLocaleString()}
                </p>
                <p className="text-xs text-[var(--color-text-ghost)] uppercase tracking-widest">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Sort tabs */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-1 p-1 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl">
          {[
            { icon: TrendingUp, label: "Most Voted",  href: "/battles?sort=votes",     key: "votes"     },
            { icon: Clock,      label: "Recent",      href: "/battles?sort=recent",    key: "recent"    },
            { icon: Flame,      label: "Contested",   href: "/battles?sort=contested", key: "contested" },
          ].map(({ icon: Icon, label, href, key }) => {
            const isActive = rawSort === key || (key === "votes" && rawSort === "votes");
            return (
              <Link
                key={label}
                href={href}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                style={isActive
                  ? { background: "var(--color-accent)", color: "#fff" }
                  : { color: "var(--color-text-muted)" }
                }
              >
                <Icon size={12} />
                {label}
              </Link>
            );
          })}
        </div>

        <p className="text-xs" style={{ color: "var(--color-text-ghost)" }}>
          {matchups.length} battle{matchups.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Grid */}
      {matchups.length === 0 ? (
        <div className="border border-dashed border-[var(--color-border)] rounded-2xl py-24 text-center space-y-2">
          <Swords size={32} className="mx-auto text-[var(--color-text-ghost)] mb-4" />
          <p className="font-bold text-[var(--color-text-muted)]">No battles yet</p>
          <p className="text-sm text-[var(--color-text-ghost)]">Battles will appear here once seeded.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {matchups.map((m) => <MatchupCard key={m.id} matchup={m} />)}
        </div>
      )}
    </div>
  );
}
