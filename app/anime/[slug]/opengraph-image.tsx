export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const alt = "Anime series on AnimeWarBoard";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

import { ImageResponse } from "next/og";
import { getCategoryBySlug, getEntitiesBySeries } from "@/lib/queries";

const BG     = "#0b0d18";
const SURFACE = "#161926";
const ACCENT = "#f97316";
const MUTED  = "#7c82a0";
const GHOST  = "#4a5070";

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const series = await getCategoryBySlug(slug);
  if (!series) return new ImageResponse(<div style={{ background: BG, width: "100%", height: "100%" }} />, size);

  const chars = await getEntitiesBySeries(series.id, 100);
  const charCount = chars.length;

  return new ImageResponse(
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        height: "100%",
        background: BG,
        fontFamily: "sans-serif",
        padding: "64px 80px",
        justifyContent: "space-between",
      }}
    >
      {/* Branding */}
      <div style={{ display: "flex", alignItems: "center" }}>
        <span
          style={{
            fontSize: 11,
            fontWeight: 900,
            letterSpacing: "0.2em",
            textTransform: "uppercase" as const,
            color: ACCENT,
          }}
        >
          ANIMEWARBOARD.COM
        </span>
      </div>

      {/* Main content */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div
          style={{
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: "0.12em",
            textTransform: "uppercase" as const,
            color: MUTED,
          }}
        >
          Anime Series
        </div>
        <div
          style={{
            fontSize: series.name.length > 16 ? 64 : 80,
            fontWeight: 900,
            color: "#e8eaf6",
            lineHeight: 1,
            letterSpacing: "-0.03em",
          }}
        >
          {series.name}
        </div>
        {series.description && (
          <div
            style={{
              fontSize: 20,
              color: MUTED,
              lineHeight: 1.4,
              maxWidth: 700,
              marginTop: 8,
            }}
          >
            {series.description.length > 120
              ? series.description.slice(0, 120) + "…"
              : series.description}
          </div>
        )}
      </div>

      {/* Footer: stats */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 40,
        }}
      >
        {charCount > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{ fontSize: 36, fontWeight: 900, color: ACCENT }}>
              {charCount}
            </span>
            <span style={{ fontSize: 12, fontWeight: 700, color: GHOST, letterSpacing: "0.08em", textTransform: "uppercase" as const }}>
              Characters
            </span>
          </div>
        )}
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <span style={{ fontSize: 36, fontWeight: 900, color: "#e8eaf6" }}>9</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: GHOST, letterSpacing: "0.08em", textTransform: "uppercase" as const }}>
            Combat Stats
          </span>
        </div>
        <div
          style={{
            marginLeft: "auto",
            display: "flex",
            alignItems: "center",
            padding: "10px 24px",
            borderRadius: 8,
            background: SURFACE,
            border: `1px solid ${GHOST}`,
          }}
        >
          <span style={{ fontSize: 14, fontWeight: 700, color: MUTED }}>
            Make your case → animewarboard.com
          </span>
        </div>
      </div>
    </div>,
    size,
  );
}
