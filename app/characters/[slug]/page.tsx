import { getEntityBySlug } from "@/lib/queries";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Shield, Swords } from "lucide-react";
import type { Metadata } from "next";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const data = await getEntityBySlug(slug);
  return {
    title: data?.entity.name ?? "Character",
    description: `${data?.entity.name} from ${data?.entity.series.name} — stats, battle record, and community predictions.`,
  };
}

export default async function CharacterPage({ params }: Props) {
  const { slug } = await params;
  const data = await getEntityBySlug(slug);
  if (!data) notFound();

  const { entity, variants, battleRecord } = data;
  const defaultVariant = variants.find((v) => v.isDefault) ?? variants[0];
  const imageUrl = defaultVariant?.imageUrl ?? entity.imageUrl;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-10">
      {/* Breadcrumb */}
      <nav className="text-sm text-[var(--color-text-muted)]">
        <Link href="/anime" className="hover:text-[var(--color-accent)]">Anime</Link>
        <span className="mx-2">/</span>
        <Link href={`/anime/${entity.series.slug}`} className="hover:text-[var(--color-accent)]">{entity.series.name}</Link>
        <span className="mx-2">/</span>
        <span className="text-[var(--color-text-base)]">{entity.name}</span>
      </nav>

      {/* Profile header */}
      <div className="flex flex-col sm:flex-row gap-8 items-start">
        {/* Avatar */}
        <div className="shrink-0">
          <div className="w-40 h-40 rounded-2xl overflow-hidden bg-[var(--color-border)] ring-2 ring-[var(--color-border)]">
            {imageUrl ? (
              <Image src={imageUrl} alt={entity.name} width={160} height={160} className="object-cover object-top w-full h-full" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-5xl font-black text-[var(--color-text-ghost)]">
                {entity.name[0]}
              </div>
            )}
          </div>
        </div>

        {/* Info */}
        <div className="space-y-3 flex-1">
          <div>
            <Link href={`/anime/${entity.series.slug}`}
              className="text-xs font-semibold text-[var(--color-accent)] uppercase tracking-widest hover:underline">
              {entity.series.name}
            </Link>
            <h1 className="text-4xl font-black tracking-tight mt-1">{entity.name}</h1>
          </div>

          {/* Battle record */}
          <div className="flex gap-4">
            {[
              { label: "W", value: battleRecord.wins,   color: "text-emerald-500" },
              { label: "L", value: battleRecord.losses, color: "text-[var(--color-side-a)]" },
              { label: "D", value: battleRecord.draws,  color: "text-[var(--color-text-muted)]" },
            ].map(({ label, value, color }) => (
              <div key={label} className="text-center">
                <p className={`text-2xl font-black ${color}`}>{value}</p>
                <p className="text-xs text-[var(--color-text-muted)]">{label}</p>
              </div>
            ))}
          </div>

          <Link href={`/battles?character=${entity.slug}`}
            className="inline-flex items-center gap-2 text-sm font-semibold bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white px-4 py-2 rounded-xl transition-colors">
            <Swords size={14} />
            View Battles
          </Link>
        </div>
      </div>

      {/* Variants */}
      {variants.length > 1 && (
        <section className="space-y-3">
          <h2 className="text-lg font-black">Forms & Variants</h2>
          <div className="flex flex-wrap gap-2">
            {variants.map((v) => (
              <div key={v.id}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm font-medium transition-colors
                  ${v.isDefault
                    ? "border-[var(--color-accent)] text-[var(--color-accent)] bg-[var(--color-accent-bg)]"
                    : "border-[var(--color-border)] text-[var(--color-text-muted)]"
                  }`}>
                {v.imageUrl && (
                  <Image src={v.imageUrl} alt={v.name} width={20} height={20} className="rounded-full object-cover" />
                )}
                {v.name}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Stats — placeholder until Phase 4 (radar chart) */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-black">Power Stats</h2>
          <span className="text-xs text-[var(--color-text-ghost)] border border-dashed border-[var(--color-border)] px-2 py-0.5 rounded-full">
            Radar chart coming in next update
          </span>
        </div>
        <div className="border border-dashed border-[var(--color-border)] rounded-2xl py-12 text-center text-[var(--color-text-muted)] text-sm">
          Community stat ratings will appear here.
        </div>
      </section>

      {/* Image attribution */}
      {entity.imageSourceUrl && (
        <p className="text-xs text-[var(--color-text-ghost)]">
          Image source: <a href={entity.imageSourceUrl} target="_blank" rel="noopener noreferrer" className="hover:text-[var(--color-accent)] underline">{entity.imageSourceUrl}</a>
        </p>
      )}
    </div>
  );
}
