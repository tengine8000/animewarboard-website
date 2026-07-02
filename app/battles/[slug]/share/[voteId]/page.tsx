export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import Link from "next/link";
import { getSharePageData } from "@/lib/queries";
import { ShareCaptureCard } from "@/components/share-capture-card";
import { ShareCardContent } from "@/components/share-card-content";
import { ShareCopyButton } from "@/components/share-copy-button";
import { BattleCodeBadge } from "@/components/battle-code-badge";
import type { Metadata } from "next";

type Props = { params: Promise<{ slug: string; voteId: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { voteId, slug } = await params;
  const data = await getSharePageData(voteId);
  if (!data) return { title: "Prediction not found" };
  const { labelA, labelB, vote, userName } = data;
  const verdict = vote.verdict === "a" ? `${labelA} wins` : vote.verdict === "b" ? `${labelB} wins` : "Draw";
  return {
    title: `${userName ?? "Someone"} predicted: ${verdict} — ${labelA} vs ${labelB}`,
    description: `See their stat breakdown and cast your own prediction on AnimeWarBoard.`,
    openGraph: {
      type: "website",
      images: [{ url: `/battles/${slug}/share/${voteId}/opengraph-image`, width: 1200, height: 630 }],
    },
    twitter: { card: "summary_large_image" },
  };
}

const DIFFICULTY_LABEL: Record<string, string> = {
  very_easy: "No Contest", easy: "Low Diff", medium: "Mid Diff",
  hard: "High Diff", extreme: "Extreme Diff",
};

export default async function SharePredictionPage({ params }: Props) {
  const { voteId, slug } = await params;
  const data = await getSharePageData(voteId);
  if (!data) notFound();

  const { vote, labelA, labelB, userName, userStats, communityStats, radarStatsA, radarStatsB, matchupCode, participantsA, participantsB, communityEdge, voteSummary } = data;

  const verdictText  = vote.verdict === "a" ? `${labelA} Wins` : vote.verdict === "b" ? `${labelB} Wins` : "Draw";
  const diffLabel    = DIFFICULTY_LABEL[vote.difficulty] ?? vote.difficulty;

  const battleUrl  = `/battles/${slug}`;
  const siteUrl    = process.env.NEXT_PUBLIC_SITE_URL ?? "https://animewarboard.com";
  const shareUrl   = `${siteUrl}/battles/${slug}/share/${voteId}`;

  const twitterText  = encodeURIComponent(`My prediction: ${verdictText} (${diffLabel}) — ${labelA} vs ${labelB} on @AnimeWarBoard\n${shareUrl}`);
  const redditTitle  = encodeURIComponent(`[Prediction] ${verdictText} — ${labelA} vs ${labelB}`);
  const whatsappText = encodeURIComponent(`My prediction: ${verdictText} (${diffLabel}) — ${labelA} vs ${labelB}\n${shareUrl}`);

  return (
    <div className="max-w-2xl mx-auto px-4 py-10 space-y-6">

      {/* Header */}
      <div className="space-y-1">
        <p className="text-[10px] font-black tracking-widest uppercase" style={{ color: "var(--color-text-ghost)" }}>
          Battle Prediction
        </p>
        <h1 className="text-2xl font-black tracking-tight">
          {labelA} <span style={{ color: "var(--color-text-ghost)" }}>vs</span> {labelB}
        </h1>
        <BattleCodeBadge code={matchupCode} />
      </div>

      {/* Capture card — only this is snapshotted for download */}
      <ShareCaptureCard filename={`${slug}-prediction.png`}>
        <ShareCardContent
          labelA={labelA}
          labelB={labelB}
          userName={userName}
          verdict={vote.verdict}
          difficulty={vote.difficulty}
          userStats={userStats}
          communityStats={communityStats}
          radarStatsA={radarStatsA}
          radarStatsB={radarStatsB}
          participantsA={participantsA}
          participantsB={participantsB}
          communityEdge={communityEdge}
          voteSummary={voteSummary}
        />
      </ShareCaptureCard>

      {/* Share buttons */}
      <div className="space-y-3">
        <p className="text-[10px] font-black tracking-widest uppercase" style={{ color: "var(--color-text-ghost)" }}>
          Share your prediction
        </p>
        <div className="flex flex-wrap gap-3">
          <a
            href={`https://x.com/intent/tweet?text=${twitterText}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold transition-colors hover:opacity-80"
            style={{ background: "#000", color: "#fff", border: "1px solid #333" }}
          >
            𝕏 Post on X
          </a>
          <a
            href={`https://reddit.com/submit?title=${redditTitle}&url=${encodeURIComponent(shareUrl)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold transition-colors hover:opacity-80"
            style={{ background: "#ff4500", color: "#fff" }}
          >
            Reddit
          </a>
          <a
            href={`https://wa.me/?text=${whatsappText}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold transition-colors hover:opacity-80"
            style={{ background: "#25D366", color: "#fff" }}
          >
            WhatsApp
          </a>
          <ShareCopyButton url={shareUrl} />
        </div>
      </div>

      {/* CTA */}
      <div className="text-center space-y-3 pt-4" style={{ borderTop: "1px solid var(--color-border)" }}>
        <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
          What do <em>you</em> think? Cast your own prediction.
        </p>
        <Link
          href={battleUrl}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-black text-white transition-colors hover:opacity-80"
          style={{ background: "var(--color-accent)" }}
        >
          Vote on this battle →
        </Link>
      </div>
    </div>
  );
}
