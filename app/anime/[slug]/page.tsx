import { getCategoryBySlug, getEntitiesBySeries, getAllMatchups } from "@/lib/queries";
import { CharacterCard } from "@/components/character-card";
import { MatchupCard } from "@/components/matchup-card";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const cat = await getCategoryBySlug(slug);
  return {
    title: cat?.name ?? "Series",
    description: cat?.description ?? `Characters and battles from ${cat?.name}.`,
  };
}

export default async function SeriesPage({ params }: Props) {
  const { slug } = await params;
  const series = await getCategoryBySlug(slug);
  if (!series) notFound();

  const [chars, matchups] = await Promise.all([
    getEntitiesBySeries(series.id, 12),
    getAllMatchups({ limit: 6 }),
  ]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-10">
      {/* Breadcrumb */}
      <nav className="text-sm text-[var(--color-text-muted)]">
        <Link href="/anime" className="hover:text-[var(--color-accent)]">Anime</Link>
        <span className="mx-2">/</span>
        <span className="text-[var(--color-text-base)]">{series.name}</span>
      </nav>

      {/* Header */}
      <div>
        <h1 className="text-3xl font-black tracking-tight">{series.name}</h1>
        {series.description && (
          <p className="text-[var(--color-text-muted)] mt-1">{series.description}</p>
        )}
        {series.creatorRole === "user" && series.creatorUsername && (
          <p className="text-xs mt-1" style={{ color: "var(--color-text-ghost)" }}>
            Submitted by{" "}
            <Link href={`/u/${series.creatorUsername}`} className="hover:underline" style={{ color: "var(--color-accent)" }}>
              @{series.creatorUsername}
            </Link>
          </p>
        )}
      </div>

      {/* Characters */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-black">Characters</h2>
          <Link href={`/characters?series=${series.slug}`} className="text-sm text-[var(--color-accent)] hover:underline">
            View all →
          </Link>
        </div>
        {chars.length === 0 ? (
          <p className="text-[var(--color-text-muted)] text-sm">No characters yet.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {chars.map((e) => <CharacterCard key={e.id} entity={e} />)}
          </div>
        )}
      </section>

      {/* Battles */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-black">Top Battles</h2>
          <Link href={`/battles?series=${series.slug}`} className="text-sm text-[var(--color-accent)] hover:underline">
            View all →
          </Link>
        </div>
        {matchups.length === 0 ? (
          <p className="text-[var(--color-text-muted)] text-sm">No battles yet.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {matchups.map((m) => <MatchupCard key={m.id} matchup={m} />)}
          </div>
        )}
      </section>
    </div>
  );
}
