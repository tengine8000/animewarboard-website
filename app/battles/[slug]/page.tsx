export const dynamic = "force-dynamic";

import {
  getMatchupBySlug,
  deriveSideLabel,
  getMatchupRadarStats,
  getUserVoteForMatchup,
  getUserVoteAttributes,
  getMatchupCommunityEdge,
  getMatchupCommunityStatAverages,
  getMatchupComments,
} from "@/lib/queries";
import { notFound } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { BattleVoteForm } from "@/components/battle-vote-form";
import { BattleOverviewCard } from "@/components/battle-overview-card";
import { CommentSection } from "@/components/comment-section";
import type { Metadata } from "next";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const data = await getMatchupBySlug(slug);
  if (!data) return { title: "Battle Not Found" };
  const labelA = deriveSideLabel(data.sideALabel, data.sideA);
  const labelB = deriveSideLabel(data.sideBLabel, data.sideB);
  const title = `${labelA} vs ${labelB}`;
  const desc  = `Who wins? ${labelA} vs ${labelB} — make your prediction on AnimeWarBoard.`;
  return {
    title,
    description: desc,
    openGraph: { title, description: desc, type: "website" },
    twitter: { card: "summary_large_image", title, description: desc },
  };
}

// ── Clipped-corner card ───────────────────────────────────────────────────────

const CLIP = "polygon(12px 0, calc(100% - 12px) 0, 100% 12px, 100% calc(100% - 12px), calc(100% - 12px) 100%, 12px 100%, 0 calc(100% - 12px), 0 12px)";

function ClipCard({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ clipPath: CLIP, background: "var(--color-border)", padding: "1px", ...style }}>
      <div style={{ clipPath: CLIP, background: "var(--color-surface)" }}>
        {children}
      </div>
    </div>
  );
}

type Participant = {
  entity:  { name: string; slug: string; imageUrl: string | null };
  variant: { name: string; imageUrl: string | null };
  series:  { name: string };
};

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function BattlePage({ params }: Props) {
  const { slug } = await params;
  const [data, session] = await Promise.all([getMatchupBySlug(slug), auth()]);
  if (!data) notFound();

  const { sideA, sideB, sideALabel, sideBLabel, voteSummary, matchup, creatorUsername, creatorRole } = data;
  const labelA = deriveSideLabel(sideALabel, sideA);
  const labelB = deriveSideLabel(sideBLabel, sideB);
  const isLoggedIn = !!session?.user?.id;

  const [radarStats, existingVote, existingStatValues, communityEdge, communityStats, comments] = await Promise.all([
    getMatchupRadarStats(sideA, sideB),
    isLoggedIn ? getUserVoteForMatchup(session!.user!.id!, matchup.id) : null,
    isLoggedIn ? getUserVoteAttributes(session!.user!.id!, matchup.id) : {},
    getMatchupCommunityEdge(matchup.id),
    getMatchupCommunityStatAverages(matchup.id),
    getMatchupComments(matchup.id),
  ]);

  const summary = voteSummary;
  const firstA = sideA[0] as Participant | undefined;
  const firstB = sideB[0] as Participant | undefined;
  const imageA = firstA?.variant.imageUrl ?? firstA?.entity.imageUrl ?? null;
  const imageB = firstB?.variant.imageUrl ?? firstB?.entity.imageUrl ?? null;

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://animewarboard.com";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": `${labelA} vs ${labelB} | AnimeWarBoard`,
    "description": `Who wins? ${labelA} vs ${labelB} — make your prediction on AnimeWarBoard.`,
    "url": `${siteUrl}/battles/${matchup.slug}`,
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-3">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {creatorRole === "user" && creatorUsername && (
        <p className="text-xs" style={{ color: "var(--color-text-ghost)" }}>
          Submitted by{" "}
          <Link href={`/u/${creatorUsername}`} className="hover:underline" style={{ color: "var(--color-accent)" }}>
            @{creatorUsername}
          </Link>
        </p>
      )}

      {/* ── BATTLE OVERVIEW ───────────────────────────────────────────── */}
      <BattleOverviewCard
        sideA={sideA as Participant[]}
        sideB={sideB as Participant[]}
        radarStatsA={radarStats.a}
        radarStatsB={radarStats.b}
        communityStats={communityStats}
        communityEdge={communityEdge}
        summary={summary}
        labelA={labelA}
        labelB={labelB}
        userName={session?.user?.name ?? null}
        userVerdict={(existingVote?.verdict ?? null) as "a" | "b" | "draw" | null}
        userDifficulty={existingVote?.difficulty ?? null}
      />

      {/* ── Prediction Form ───────────────────────────────────────────── */}
      <BattleVoteForm
        matchupId={matchup.id}
        matchupSlug={matchup.slug}
        labelA={labelA}
        labelB={labelB}
        imageA={imageA}
        imageB={imageB}
        isLoggedIn={isLoggedIn}
        existingVote={
          existingVote
            ? {
                id:         existingVote.id,
                verdict:    existingVote.verdict    as "a" | "b" | "draw",
                difficulty: existingVote.difficulty as "very_easy" | "easy" | "medium" | "hard" | "extreme",
              }
            : null
        }
        existingStatValues={existingStatValues}
      />

      {/* ── Community Discussion ──────────────────────────────────────── */}
      <ClipCard>
        <div className="px-5 py-3" style={{ borderBottom: "1px solid var(--color-border)" }}>
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-black tracking-widest uppercase" style={{ color: "var(--color-text-muted)" }}>
              Community Discussion
            </p>
            {comments.length > 0 && (
              <span className="text-[10px]" style={{ color: "var(--color-text-ghost)" }}>
                {comments.length} comment{comments.length !== 1 ? "s" : ""}
              </span>
            )}
          </div>
        </div>
        <CommentSection
          type="matchup"
          targetId={matchup.id}
          targetSlug={matchup.slug}
          isLoggedIn={isLoggedIn}
          isMod={["admin","moderator"].includes((session?.user as any)?.role)}
          userInitial={session?.user?.name?.[0]?.toUpperCase() ?? "?"}
          comments={comments}
        />
      </ClipCard>
    </div>
  );
}
