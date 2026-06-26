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
import { CharacterVariantsSection } from "@/components/character-variants-section";
import { CommentSection } from "@/components/comment-section";
import { getUserPointSummary } from "@/lib/points";
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
  const name = data?.entity.name ?? "Character";
  const desc = data?.entity.bio
    ?? `${data?.entity.name} from ${data?.entity.series.name} — stats, battle record, and community predictions.`;
  return {
    title: name,
    description: desc,
    openGraph: { title: name, description: desc, type: "website" },
    twitter: { card: "summary_large_image", title: name, description: desc },
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

  // Fetch stats for every variant in parallel so client-side switching is instant
  const [allEntityStatsArr, allCommunityStatsArr, allUserStatsArr, comments, pointSummary] = await Promise.all([
    Promise.all(variants.map((v) => getEntityStats(v.id))),
    Promise.all(variants.map((v) => getCommunityEntityStatsAvg(v.id))),
    Promise.all(variants.map((v) => userId ? getUserEntityStats(userId, v.id) : Promise.resolve({}))),
    getEntityComments(entity.id),
    userId ? getUserPointSummary(userId) : Promise.resolve(null),
  ]);

  const allEntityStats    = Object.fromEntries(variants.map((v, i) => [v.id, allEntityStatsArr[i]]));
  const allCommunityStats = Object.fromEntries(variants.map((v, i) => [v.id, allCommunityStatsArr[i]]));
  const allUserStats      = Object.fromEntries(variants.map((v, i) => [v.id, allUserStatsArr[i]]));

  const userRank   = pointSummary?.rank ?? null;
  const xpNeeded   = pointSummary?.xpToNext ?? null;

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://animewarboard.com";
  const absImage = imageUrl ? (imageUrl.startsWith("http") ? imageUrl : `${siteUrl}${imageUrl}`) : undefined;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": `${entity.name} | AnimeWarBoard`,
    "description": entity.bio ?? `${entity.name} from ${entity.series.name} — stats, battle record, and community predictions.`,
    "url": `${siteUrl}/characters/${entity.slug}`,
    ...(absImage ? { "image": absImage } : {}),
    "about": {
      "@type": "Thing",
      "name": entity.name,
      "description": entity.bio ?? undefined,
    },
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

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

      {/* Variants + Power Stats (unified — variant switching updates stats instantly) */}
      <CharacterVariantsSection
        variants={variants}
        entityName={entity.name}
        entityImage={entity.imageUrl ?? null}
        entitySlug={entity.slug}
        seriesColor={seriesColor}
        isLoggedIn={isLoggedIn}
        userRank={userRank}
        xpNeeded={xpNeeded}
        allEntityStats={allEntityStats}
        allCommunityStats={allCommunityStats}
        allUserStats={allUserStats}
      />

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
            isMod={["admin","moderator"].includes((session?.user as any)?.role)}
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
