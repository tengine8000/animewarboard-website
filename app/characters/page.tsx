import { getAllEntities, getEntitiesCount } from "@/lib/queries";
import { db } from "@/db";
import { adminSettings } from "@/db/schema";
import { eq } from "drizzle-orm";
import { CharacterCard } from "@/components/character-card";
import { Pagination } from "@/components/pagination";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Characters",
  description: "Browse all anime characters on AnimeWarBoard.",
};

type Props = { searchParams: Promise<{ page?: string }> };

export default async function CharactersPage({ searchParams }: Props) {
  const sp   = await searchParams;
  const page = Math.max(1, parseInt(sp.page ?? "1", 10));

  const [perPageRow, total] = await Promise.all([
    db.select({ value: adminSettings.value }).from(adminSettings).where(eq(adminSettings.key, "characters_per_page")).limit(1),
    getEntitiesCount(),
  ]);

  const perPage    = perPageRow[0]?.value ?? 48;
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const safePage   = Math.min(page, totalPages);
  const offset     = (safePage - 1) * perPage;

  const chars = await getAllEntities({ limit: perPage, offset });

  const buildHref = (p: number) => p === 1 ? "/characters" : `/characters?page=${p}`;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-black tracking-tight">Characters</h1>
        <p className="text-[var(--color-text-muted)] mt-1 text-sm">
          {total > 0 ? `${total.toLocaleString()} characters` : "No characters yet"}
        </p>
      </div>

      {chars.length === 0 ? (
        <div className="border border-dashed border-[var(--color-border)] rounded-2xl py-24 text-center space-y-2">
          <p className="font-bold text-[var(--color-text-muted)]">No characters yet</p>
          <p className="text-sm text-[var(--color-text-ghost)]">Characters will appear here once approved.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {chars.map((e) => <CharacterCard key={e.id} entity={e} />)}
          </div>
          <Pagination page={safePage} totalPages={totalPages} buildHref={buildHref} />
        </>
      )}
    </div>
  );
}
