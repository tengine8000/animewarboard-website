import { getAllMatchups } from "@/lib/queries";
import { MatchupCard } from "@/components/matchup-card";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Battles",
  description: "Browse all anime battles and submit your predictions on AnimeWarBoard.",
};

export default async function BattlesPage() {
  const matchups = await getAllMatchups({ limit: 24 });

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-black tracking-tight">Battles</h1>
        <p className="text-[var(--color-text-muted)] mt-1 text-sm">
          {matchups.length > 0
            ? `${matchups.length} battles — sorted by most predicted`
            : "No battles yet"}
        </p>
      </div>

      {matchups.length === 0 ? (
        <div className="border border-dashed border-[var(--color-border)] rounded-2xl py-24 text-center space-y-2">
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
