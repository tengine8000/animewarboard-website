export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const alt = "Battle prediction on AnimeWarBoard";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

import { ImageResponse } from "next/og";
import { getMatchupBySlug, deriveSideLabel } from "@/lib/queries";

const BG      = "#0b0d18";
const SURFACE = "#161926";
const MUTED   = "#7c82a0";
const GHOST   = "#4a5070";
const RED     = "#f87171";
const BLUE    = "#60a5fa";
const ACCENT  = "#f97316";

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await getMatchupBySlug(slug);
  if (!data) return new ImageResponse(<div style={{ background: BG, width: "100%", height: "100%" }} />, size);

  const labelA = deriveSideLabel(data.sideALabel, data.sideA);
  const labelB = deriveSideLabel(data.sideBLabel, data.sideB);
  const total  = data.votes.total;
  const pctA   = total > 0 ? Math.round((data.votes.aVotes / total) * 100) : 50;
  const pctB   = 100 - pctA;

  // Series names for subtitles
  const seriesA = data.sideA[0]?.series?.name ?? "";
  const seriesB = data.sideB[0]?.series?.name ?? "";

  return new ImageResponse(
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        height: "100%",
        background: BG,
        fontFamily: "sans-serif",
      }}
    >
      {/* Top branding bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: 52,
          borderBottom: `1px solid ${GHOST}`,
          flexShrink: 0,
        }}
      >
        <span
          style={{
            fontSize: 11,
            fontWeight: 900,
            letterSpacing: "0.2em",
            textTransform: "uppercase" as const,
            color: ACCENT,
          }}
        >
          ANIMEWARBOARD.COM — SETTLE THE DEBATE
        </span>
      </div>

      {/* Main fighters area */}
      <div style={{ display: "flex", flex: 1 }}>
        {/* Side A */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            flex: 1,
            padding: "32px 48px",
            background: `linear-gradient(135deg, ${RED}0d 0%, transparent 60%)`,
            borderRight: `1px solid ${GHOST}`,
            gap: 10,
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.1em",
              textTransform: "uppercase" as const,
              color: RED,
              opacity: 0.7,
            }}
          >
            {seriesA}
          </div>
          <div
            style={{
              fontSize: labelA.length > 14 ? 40 : 52,
              fontWeight: 900,
              color: RED,
              textAlign: "center" as const,
              lineHeight: 1.1,
              letterSpacing: "-0.02em",
            }}
          >
            {labelA}
          </div>
          {total > 0 && (
            <div
              style={{
                marginTop: 16,
                fontSize: 28,
                fontWeight: 900,
                color: RED,
              }}
            >
              {pctA}%
            </div>
          )}
        </div>

        {/* VS divider */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            width: 120,
            flexShrink: 0,
            gap: 8,
          }}
        >
          <div
            style={{
              fontSize: 32,
              fontWeight: 900,
              color: MUTED,
              letterSpacing: "0.05em",
            }}
          >
            VS
          </div>
          {total > 0 && (
            <div
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: GHOST,
                letterSpacing: "0.08em",
                textTransform: "uppercase" as const,
                textAlign: "center" as const,
              }}
            >
              {`${total.toLocaleString()} VOTES`}
            </div>
          )}
        </div>

        {/* Side B */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            flex: 1,
            padding: "32px 48px",
            background: `linear-gradient(225deg, ${BLUE}0d 0%, transparent 60%)`,
            borderLeft: `1px solid ${GHOST}`,
            gap: 10,
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.1em",
              textTransform: "uppercase" as const,
              color: BLUE,
              opacity: 0.7,
            }}
          >
            {seriesB}
          </div>
          <div
            style={{
              fontSize: labelB.length > 14 ? 40 : 52,
              fontWeight: 900,
              color: BLUE,
              textAlign: "center" as const,
              lineHeight: 1.1,
              letterSpacing: "-0.02em",
            }}
          >
            {labelB}
          </div>
          {total > 0 && (
            <div
              style={{
                marginTop: 16,
                fontSize: 28,
                fontWeight: 900,
                color: BLUE,
              }}
            >
              {pctB}%
            </div>
          )}
        </div>
      </div>

      {/* Bottom vote bar */}
      {total > 0 && (
        <div
          style={{
            display: "flex",
            height: 8,
            flexShrink: 0,
          }}
        >
          <div style={{ width: `${pctA}%`, background: RED, height: "100%" }} />
          <div style={{ flex: 1, background: BLUE, height: "100%" }} />
        </div>
      )}

      {/* Bottom bar: tagline */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: 44,
          background: SURFACE,
          flexShrink: 0,
        }}
      >
        <span style={{ fontSize: 11, color: GHOST, fontWeight: 600, letterSpacing: "0.05em" }}>
          Make your case · Cast your vote · See how the community stacks up
        </span>
      </div>
    </div>,
    size,
  );
}
