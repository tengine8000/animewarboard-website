import { getAnimeSeries, getAnimeSeriesCount } from "@/lib/queries";
import { db } from "@/db";
import { adminSettings } from "@/db/schema";
import { eq } from "drizzle-orm";
import Link from "next/link";
import Image from "next/image";
import { Pagination } from "@/components/pagination";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

const SERIES_PALETTE: Record<string, string> = {
  naruto:      "#f97316",
  bleach:      "#6366f1",
  "one-piece": "#ef4444",
  default:     "#8b5cf6",
};

export const metadata: Metadata = {
  title: "Anime",
  description: "Browse all anime series on AnimeWarBoard.",
};

type Props = { searchParams: Promise<{ page?: string }> };

export default async function AnimePage({ searchParams }: Props) {
  const sp   = await searchParams;
  const page = Math.max(1, parseInt(sp.page ?? "1", 10));

  const [perPageRow, total] = await Promise.all([
    db.select({ value: adminSettings.value }).from(adminSettings).where(eq(adminSettings.key, "anime_per_page")).limit(1),
    getAnimeSeriesCount(),
  ]);

  const perPage    = perPageRow[0]?.value ?? 24;
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const safePage   = Math.min(page, totalPages);
  const offset     = (safePage - 1) * perPage;

  const series = await getAnimeSeries({ limit: perPage, offset });

  const buildHref = (p: number) => p === 1 ? "/anime" : `/anime?page=${p}`;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-black tracking-tight">Anime Series</h1>
        <p className="text-[var(--color-text-muted)] mt-1">
          {total > 0 ? `${total.toLocaleString()} series` : "Browse characters and battles by series."}
        </p>
      </div>

      {series.length === 0 ? (
        <div className="border border-dashed border-[var(--color-border)] rounded-2xl py-24 text-center space-y-2">
          <p className="font-bold text-[var(--color-text-muted)]">No series yet</p>
          <p className="text-sm text-[var(--color-text-ghost)]">Series will appear here once seeded.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {series.map((s) => (
              <Link key={s.id} href={`/anime/${s.slug}`}
                className="group block bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl overflow-hidden hover:border-[var(--color-accent)] transition-all">
                <div className="aspect-[3/2] bg-[var(--color-border)] relative overflow-hidden">
                  {s.coverImage ? (
                    <Image src={s.coverImage} alt={s.name} fill sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" className="object-cover group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    (() => {
                      const color = SERIES_PALETTE[s.slug] ?? SERIES_PALETTE.default;
                      return (
                        <div className="absolute inset-0 flex items-center justify-center"
                          style={{ background: `linear-gradient(135deg, ${color}33 0%, ${color}11 100%)` }}>
                          <span className="text-5xl font-black" style={{ color, opacity: 0.85 }}>{s.name[0]}</span>
                        </div>
                      );
                    })()
                  )}
                </div>
                <div className="p-3">
                  <p className="font-bold text-sm text-[var(--color-text-base)] line-clamp-1">{s.name}</p>
                  {s.description && (
                    <p className="text-xs text-[var(--color-text-muted)] mt-0.5 line-clamp-2">{s.description}</p>
                  )}
                </div>
              </Link>
            ))}
          </div>
          <Pagination page={safePage} totalPages={totalPages} buildHref={buildHref} />
        </>
      )}
    </div>
  );
}
