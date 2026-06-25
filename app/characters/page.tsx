import { getAllEntities, getAnimeSeries } from "@/lib/queries";
import { CharacterCard } from "@/components/character-card";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Characters",
  description: "Browse all anime characters on AnimeWarBoard.",
};

type Props = { searchParams: Promise<{ series?: string }> };

export default async function CharactersPage({ searchParams }: Props) {
  const { series: seriesSlug } = await searchParams;

  const [chars, seriesList] = await Promise.all([
    getAllEntities({ limit: 48 }),
    getAnimeSeries(),
  ]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Characters</h1>
          <p className="text-[var(--color-text-muted)] mt-1 text-sm">
            {chars.length > 0 ? `${chars.length} characters` : "No characters yet"}
          </p>
        </div>
      </div>

      {chars.length === 0 ? (
        <div className="border border-dashed border-[var(--color-border)] rounded-2xl py-24 text-center space-y-2">
          <p className="font-bold text-[var(--color-text-muted)]">No characters yet</p>
          <p className="text-sm text-[var(--color-text-ghost)]">Characters will appear here once approved.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {chars.map((e) => <CharacterCard key={e.id} entity={e} />)}
        </div>
      )}
    </div>
  );
}
