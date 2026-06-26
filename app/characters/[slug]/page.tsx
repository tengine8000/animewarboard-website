export const dynamic = "force-dynamic";

import {
  getEntityBySlug,
  getEntityStats,
  getCommunityEntityStatsAvg,
  getUserEntityStats,
  getEntityComments,
} from "@/lib/queries";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Swords } from "lucide-react";
import { auth } from "@/auth";
import { VariantSelector } from "@/components/variant-selector";
import { EntityStatsPanel } from "@/components/entity-stats-panel";
import { CommentSection } from "@/components/comment-section";
import type { Metadata } from "next";

const SERIES_PALETTE: Record<string, string> = {
  naruto:      "#f97316",
  bleach:      "#6366f1",
  "one-piece": "#ef4444",
  default:     "#8b5cf6",
};

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const data = await getEntityBySlug(slug);
  return {
    title: data?.entity.name ?? "Character",
    description: data?.entity.bio
      ?? `${data?.entity.name} from ${data?.entity.series.name} — stats, battle record, and community predictions.`,
  };
}

export default async function CharacterPage({ params }: Props) {
  const { slug } = await params;
  const [data, session] = await Promise.all([getEntityBySlug(slug), auth()]);
  if (!data) notFound();

  const { entity, variants, battleRecord } = data;
  const defaultVariant = variants.find((v) => v.isDefault) ?? variants[0];
  const imageUrl   = defaultVariant?.imageUrl ?? entity.imageUrl;
  const seriesColor = SERIES_PALETTE[entity.series.slug] ?? SERIES_PALETTE.default;
  const isLoggedIn  = !!session?.user?.id;

  const userId = session?.user?.id ?? null;
  const defaultVariantId = defaultVariant?.id ?? null;

  const [entityStatsData, communityStatsData, userStatsData, comments] = await Promise.all([
    defaultVariantId ? getEntityStats(defaultVariantId) : Promise.resolve([]),
    defaultVariantId ? getCommunityEntityStatsAvg(defaultVariantId) : Promise.resolve([]),
    defaultVariantId && userId ? getUserEntityStats(userId, defaultVariantId) : Promise.resolve({}),
    getEntityComments(entity.id),
  ]);

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
        <div className="shrink-0">
          <div className="w-40 h-40 rounded-2xl overflow-hidden"
            style={{ border: `2px solid ${seriesColor}44` }}>
            {imageUrl ? (
              <Image src={imageUrl} alt={entity.name} width={160} height={160}
                className="object-cover object-top w-full h-full" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-6xl font-black"
                style={{
                  background: `linear-gradient(135deg, ${seriesColor}33 0%, ${seriesColor}11 100%)`,
                  color: seriesColor,
                }}>
                {entity.name[0]}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-3 flex-1">
          <div>
            <Link href={`/anime/${entity.series.slug}`}
              className="text-xs font-semibold uppercase tracking-widest hover:underline"
              style={{ color: "var(--color-accent)" }}>
              {entity.series.name}
            </Link>
            <h1 className="text-4xl font-black tracking-tight mt-1">{entity.name}</h1>
          </div>

          {entity.bio && (
            <p className="text-sm leading-relaxed max-w-prose" style={{ color: "var(--color-text-muted)" }}>
              {entity.bio}
            </p>
          )}

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
            className="inline-flex items-center gap-2 text-sm font-semibold text-white px-4 py-2 rounded-xl transition-colors"
            style={{ background: "var(--color-accent)" }}>
            <Swords size={14} />
            View Battles
          </Link>
        </div>
      </div>

      {/* Variants */}
      <VariantSelector
        variants={variants}
        entityName={entity.name}
        entityImage={entity.imageUrl ?? null}
        seriesColor={seriesColor}
      />

      {/* Power Stats */}
      <section className="space-y-4">
        <h2 className="text-lg font-black">Power Stats</h2>
        {defaultVariantId ? (
          <EntityStatsPanel
            variantId={defaultVariantId}
            entitySlug={entity.slug}
            entityStats={entityStatsData}
            communityStats={communityStatsData}
            userStats={userStatsData}
            isLoggedIn={isLoggedIn}
            seriesColor={seriesColor}
          />
        ) : (
          <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>No variant data available.</p>
        )}
      </section>

      {/* Community Discussion */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-black">Community Discussion</h2>
          {comments.length > 0 && (
            <span className="text-xs" style={{ color: "var(--color-text-ghost)" }}>
              {comments.length} comment{comments.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>
        <div style={{ border: "1px solid var(--color-border)", borderRadius: 0 }}>
          <CommentSection
            type="entity"
            targetId={entity.id}
            targetSlug={entity.slug}
            isLoggedIn={isLoggedIn}
            userInitial={session?.user?.name?.[0]?.toUpperCase() ?? "?"}
            comments={comments}
          />
        </div>
      </section>

      {entity.imageSourceUrl && (
        <p className="text-xs" style={{ color: "var(--color-text-ghost)" }}>
          Image:{" "}
          <a href={entity.imageSourceUrl} target="_blank" rel="noopener noreferrer"
            className="hover:underline" style={{ color: "var(--color-accent)" }}>
            {entity.imageSourceUrl}
          </a>
        </p>
      )}
    </div>
  );
}
