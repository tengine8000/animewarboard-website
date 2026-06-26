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
import Image from "next/image";
import { auth } from "@/auth";
import { DynamicRadarChart } from "@/components/dynamic-radar-chart";
import { BattleVoteForm } from "@/components/battle-vote-form";
import { PredictionConfidence } from "@/components/prediction-confidence";
import { CommentSection } from "@/components/comment-section";
import type { Metadata } from "next";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const data = await getMatchupBySlug(slug);
  if (!data) return { title: "Battle Not Found" };
  const labelA = deriveSideLabel(data.sideALabel, data.sideA);
  const labelB = deriveSideLabel(data.sideBLabel, data.sideB);
  return {
    title: `${labelA} vs ${labelB}`,
    description: `Who wins? ${labelA} vs ${labelB} — make your prediction on AnimeWarBoard.`,
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

// ── Fighter panel ─────────────────────────────────────────────────────────────

type Participant = {
  entity:  { name: string; slug: string; imageUrl: string | null };
  variant: { name: string; imageUrl: string | null };
  series:  { name: string };
};

function FighterPanel({
  participant, side, align,
}: {
  participant: Participant | undefined;
  side: "a" | "b";
  align: "left" | "right";
}) {
  if (!participant) return <div />;

  const image = participant.variant.imageUrl ?? participant.entity.imageUrl;
  const color = side === "a" ? "var(--color-side-a)" : "var(--color-side-b)";
  const glow  = side === "a"
    ? "0 0 0 2px rgba(248,113,113,0.3), 0 0 14px rgba(248,113,113,0.25)"
    : "0 0 0 2px rgba(96,165,250,0.3),  0 0 14px rgba(96,165,250,0.25)";
  const ta = align === "right" ? "right" as const : "left" as const;
  const ai = align === "right" ? "flex-end" : "flex-start";

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: ai, gap: 5, minWidth: 0 }}>
      {/* FIGHTER A/B label */}
      <p style={{ fontSize: 9, fontWeight: 900, letterSpacing: "0.1em", color, textAlign: ta, textTransform: "uppercase" }}>
        Fighter {side.toUpperCase()}
      </p>

      {/* Avatar */}
      <div style={{
        width: 72, height: 72, borderRadius: "50%", overflow: "hidden", position: "relative", flexShrink: 0,
        border: `2px solid ${color}`, boxShadow: glow,
      }}>
        {image ? (
          <Image src={image} alt={participant.entity.name} fill sizes="72px" className="object-cover object-top" />
        ) : (
          <div style={{
            width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 26, fontWeight: 900,
            background: `color-mix(in srgb, ${color} 15%, transparent)`, color,
          }}>
            {participant.entity.name[0]}
          </div>
        )}
      </div>

      {/* Entity name (large) */}
      <Link
        href={`/characters/${participant.entity.slug}`}
        style={{ color, fontWeight: 900, fontSize: 13, lineHeight: 1.2, textAlign: ta, wordBreak: "break-word" }}
        className="hover:underline"
      >
        {participant.entity.name}
      </Link>

      {/* Variant name (smaller, muted) */}
      <p style={{ fontSize: 10, color: "var(--color-text-ghost)", textAlign: ta, lineHeight: 1.2 }}>
        {participant.variant.name}
      </p>

      {/* Series */}
      <p style={{ fontSize: 9, color: "var(--color-text-muted)", textAlign: ta, textTransform: "uppercase", letterSpacing: "0.05em" }}>
        {participant.series.name}
      </p>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function BattlePage({ params }: Props) {
  const { slug } = await params;
  const [data, session] = await Promise.all([getMatchupBySlug(slug), auth()]);
  if (!data) notFound();

  const { sideA, sideB, sideALabel, sideBLabel, voteSummary, matchup } = data;
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
  const firstA  = sideA[0] as Participant | undefined;
  const firstB  = sideB[0] as Participant | undefined;
  const imageA  = firstA?.variant.imageUrl ?? firstA?.entity.imageUrl ?? null;
  const imageB  = firstB?.variant.imageUrl ?? firstB?.entity.imageUrl ?? null;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-3">

      {/* Breadcrumb */}
      <nav className="text-xs" style={{ color: "var(--color-text-muted)" }}>
        <Link href="/battles" className="hover:underline">Battles</Link>
        <span className="mx-2">/</span>
        <span style={{ color: "var(--color-text-base)" }} className="line-clamp-1">
          {labelA} vs {labelB}
        </span>
      </nav>

      {/* ── BATTLE OVERVIEW ───────────────────────────────────────────── */}
      {/* Sticky wrapper: solid bg covers clip-path transparent corners */}
      <div style={{ position: "sticky", top: 56, zIndex: 20, background: "var(--color-bg)" }}>
      <ClipCard>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3"
          style={{ borderBottom: "1px solid var(--color-border)" }}>
          <span className="text-[10px] font-black tracking-widest uppercase" style={{ color: "var(--color-text-muted)" }}>
            Battle Overview
          </span>
          <span className="flex items-center gap-1.5 text-[10px] font-black tracking-widest uppercase text-emerald-500">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Live
          </span>
        </div>

        {/* Fighter A | Radar + legend | Fighter B */}
        <div style={{
          display: "grid", gridTemplateColumns: "90px 1fr 90px",
          alignItems: "center", gap: 8, padding: "16px 14px",
        }}>
          <FighterPanel participant={firstA} side="a" align="left" />

          {/* Chart + legend stacked */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
            <DynamicRadarChart defaultStatsA={radarStats.a} defaultStatsB={radarStats.b} communityStats={communityStats} size={300} />
            {/* Color legend */}
            <div style={{ display: "flex", gap: 12 }}>
              <span style={{ display: "flex", alignItems: "center", gap: 4, color: "var(--color-side-a)", fontSize: 9, fontWeight: 800, letterSpacing: "0.07em" }}>
                <span style={{ width: 20, height: 2, background: "var(--color-side-a)", display: "inline-block", flexShrink: 0 }} />
                FIGHTER A
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: 4, color: "var(--color-side-b)", fontSize: 9, fontWeight: 800, letterSpacing: "0.07em" }}>
                <span style={{ width: 20, height: 2, background: "var(--color-side-b)", display: "inline-block", flexShrink: 0 }} />
                FIGHTER B
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: 4, color: "rgba(255,255,255,0.75)", fontSize: 9, fontWeight: 800, letterSpacing: "0.07em" }}>
                <span style={{ width: 20, height: 0, borderTop: "1.5px dashed rgba(255,255,255,0.75)", display: "inline-block", flexShrink: 0 }} />
                COMMUNITY
              </span>
            </div>
          </div>

          <FighterPanel participant={firstB} side="b" align="right" />
        </div>

        {/* Community Edge + Prediction Confidence */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", borderTop: "1px solid var(--color-border)" }}>
          {/* Community Edge — driven by vote_attributes avg score_a */}
          <div className="px-4 py-4" style={{ borderRight: "1px solid var(--color-border)" }}>
            <p className="text-[9px] font-black tracking-widest uppercase mb-2" style={{ color: "var(--color-text-ghost)" }}>
              Community Edge
            </p>
            {communityEdge.winner ? (
              <>
                <p className="text-[11px] font-black tracking-widest uppercase mb-0.5"
                  style={{ color: communityEdge.winner === "a" ? "var(--color-side-a)" : "var(--color-side-b)" }}>
                  Fighter {communityEdge.winner.toUpperCase()}
                </p>
                <p className="text-3xl font-black leading-none"
                  style={{ color: communityEdge.winner === "a" ? "var(--color-side-a)" : "var(--color-side-b)" }}>
                  +{communityEdge.edgePercent}%
                </p>
                <p className="text-[10px] mt-1" style={{ color: "var(--color-text-ghost)" }}>
                  Overall Advantage
                </p>
                <p className="text-[9px] mt-0.5" style={{ color: "var(--color-text-ghost)" }}>
                  {communityEdge.voterCount} {communityEdge.voterCount === 1 ? "vote" : "votes"}
                </p>
              </>
            ) : (
              <p className="text-xs" style={{ color: "var(--color-text-ghost)" }}>No slider data yet</p>
            )}
          </div>
          {/* Prediction Confidence — real-time client computation */}
          <div className="px-4 py-4">
            <p className="text-[9px] font-black tracking-widest uppercase mb-2" style={{ color: "var(--color-text-ghost)" }}>
              Prediction Confidence
            </p>
            <PredictionConfidence />
          </div>
        </div>

        {/* Vote bar */}
        {summary.total > 0 && (
          <div className="px-5 py-3 space-y-1.5" style={{ borderTop: "1px solid var(--color-border)" }}>
            <div className="flex justify-between text-[10px] font-black">
              <span style={{ color: "var(--color-side-a)" }}>{summary.aPercent}%</span>
              <span style={{ color: "var(--color-text-ghost)" }}>{summary.total.toLocaleString()} predictions</span>
              <span style={{ color: "var(--color-side-b)" }}>{summary.bPercent}%</span>
            </div>
            <div className="flex h-1.5 overflow-hidden" style={{ borderRadius: 0 }}>
              <div style={{ width: `${summary.aPercent}%`, background: "var(--color-side-a)", transition: "width 0.4s" }} />
              {summary.drawPercent > 0 && <div style={{ width: `${summary.drawPercent}%`, background: "var(--color-text-ghost)" }} />}
              <div style={{ flex: 1, background: "var(--color-side-b)" }} />
            </div>
            <div className="flex justify-between text-[9px]" style={{ color: "var(--color-text-ghost)" }}>
              <span>Red</span>
              {summary.drawPercent > 0 && <span>Draw {summary.drawPercent}%</span>}
              <span>Blue</span>
            </div>
            {summary.settled && (
              <p className="text-center text-[9px] font-black tracking-widest uppercase text-emerald-500">✓ Settled</p>
            )}
            {summary.contested && (
              <p className="text-center text-[9px] font-black tracking-widest uppercase text-amber-500">⚡ Contested</p>
            )}
          </div>
        )}
      </ClipCard>
      </div>

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
