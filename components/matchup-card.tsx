import Link from "next/link";
import Image from "next/image";
import type { MatchupCard } from "@/lib/queries";
import { computeVoteSummary } from "@/lib/queries";

const SIDE_A = "var(--color-side-a)";
const SIDE_A_BG = "var(--color-side-a-bg)";
const SIDE_A_BORDER = "var(--color-side-a-border)";
const SIDE_B = "var(--color-side-b)";
const SIDE_B_BG = "var(--color-side-b-bg)";
const SIDE_B_BORDER = "var(--color-side-b-border)";

interface FighterPanelProps {
  entityName: string;
  variantName: string;
  seriesName: string;
  imageUrl: string | null;
  extraCount: number;
  accentColor: string;
  accentBg: string;
  accentBorder: string;
}

function FighterPanel({
  entityName, variantName, seriesName, imageUrl,
  extraCount, accentColor, accentBg, accentBorder,
}: FighterPanelProps) {
  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "8px",
        padding: "16px 12px",
        minWidth: 0,
      }}
    >
      {/* Avatar */}
      <div
        style={{
          position: "relative",
          width: 52,
          height: 52,
          borderRadius: "50%",
          background: accentBg,
          border: `2px solid ${accentBorder}`,
          color: accentColor,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontWeight: 900,
          fontSize: 22,
          overflow: "hidden",
          flexShrink: 0,
        }}
      >
        {imageUrl ? (
          <Image src={imageUrl} alt={entityName} fill style={{ objectFit: "cover", objectPosition: "top" }} />
        ) : (
          <span>{entityName[0]}</span>
        )}
        {extraCount > 0 && (
          <span
            style={{
              position: "absolute",
              bottom: -2,
              right: -2,
              width: 18,
              height: 18,
              borderRadius: "50%",
              background: accentColor,
              color: "#fff",
              fontSize: 9,
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            +{extraCount}
          </span>
        )}
      </div>

      {/* Name stack */}
      <div style={{ textAlign: "center", width: "100%", minWidth: 0, overflow: "hidden" }}>
        <p
          style={{
            fontWeight: 700,
            fontSize: 13,
            color: "var(--color-text-base)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            lineHeight: 1.2,
          }}
        >
          {entityName}
        </p>
        <p
          style={{
            fontSize: 10,
            color: "var(--color-text-ghost)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            marginTop: 2,
          }}
        >
          {variantName}
        </p>
        <p
          style={{
            fontSize: 9,
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            color: accentColor,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            marginTop: 3,
          }}
        >
          {seriesName}
        </p>
      </div>
    </div>
  );
}

export function MatchupCard({ matchup }: { matchup: MatchupCard }) {
  const { slug, sideA, sideB, votes } = matchup;
  const summary = computeVoteSummary(votes.aVotes, votes.bVotes, votes.drawVotes);
  const leadA = sideA[0];
  const leadB = sideB[0];

  return (
    <Link
      href={`/battles/${slug}`}
      style={{
        display: "block",
        background: "var(--color-surface)",
        border: "1px solid var(--color-border)",
        borderRadius: 16,
        overflow: "hidden",
        textDecoration: "none",
        transition: "border-color 0.15s",
      }}
      className="hover:border-[var(--color-accent)]"
    >
      {/* Fighter row */}
      <div style={{ display: "flex", alignItems: "stretch" }}>

        {/* Side A */}
        {leadA && (
          <FighterPanel
            entityName={leadA.entity.name}
            variantName={leadA.variant.name}
            seriesName={leadA.series.name}
            imageUrl={leadA.variant.imageUrl ?? leadA.entity.imageUrl}
            extraCount={sideA.length - 1}
            accentColor={SIDE_A}
            accentBg={SIDE_A_BG}
            accentBorder={SIDE_A_BORDER}
          />
        )}

        {/* VS divider */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "0 6px",
            borderLeft: "1px solid var(--color-border)",
            borderRight: "1px solid var(--color-border)",
            gap: 4,
          }}
        >
          <span
            style={{
              color: "var(--color-accent)",
              fontWeight: 900,
              fontSize: 12,
              letterSpacing: "0.15em",
            }}
          >
            VS
          </span>
          {votes.total > 0 && (
            <span
              style={{
                fontSize: 8,
                color: "var(--color-text-ghost)",
                textAlign: "center",
                lineHeight: 1.2,
              }}
            >
              {votes.total}
              {"\n"}picks
            </span>
          )}
        </div>

        {/* Side B */}
        {leadB && (
          <FighterPanel
            entityName={leadB.entity.name}
            variantName={leadB.variant.name}
            seriesName={leadB.series.name}
            imageUrl={leadB.variant.imageUrl ?? leadB.entity.imageUrl}
            extraCount={sideB.length - 1}
            accentColor={SIDE_B}
            accentBg={SIDE_B_BG}
            accentBorder={SIDE_B_BORDER}
          />
        )}
      </div>

      {/* Vote bar */}
      <div
        style={{
          height: 3,
          background: "var(--color-border)",
          display: "flex",
        }}
      >
        {votes.total > 0 && (
          <>
            <div style={{ width: `${summary.aPercent}%`, background: SIDE_A }} />
            <div style={{ width: `${summary.bPercent}%`, background: SIDE_B }} />
          </>
        )}
      </div>

      {/* Footer */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "6px 14px 10px",
        }}
      >
        <span style={{ fontSize: 9, color: "var(--color-text-ghost)" }}>
          {votes.total === 0 ? "No predictions yet" : `${summary.aPercent}% · ${summary.bPercent}%`}
        </span>
        {summary.settled && (
          <span style={{ fontSize: 9, fontWeight: 700, color: "#10b981", letterSpacing: "0.1em", textTransform: "uppercase" }}>
            Settled
          </span>
        )}
        {summary.contested && (
          <span style={{ fontSize: 9, fontWeight: 700, color: "#f59e0b", letterSpacing: "0.1em", textTransform: "uppercase" }}>
            Contested
          </span>
        )}
      </div>
    </Link>
  );
}
