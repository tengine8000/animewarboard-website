export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const alt = "Character profile on AnimeWarBoard";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

import { ImageResponse } from "next/og";
import { getEntityBySlug, getEntityStats } from "@/lib/queries";

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://animewarboard.com";

const ACCENT   = "#f97316";
const BG       = "#0b0d18";
const SURFACE  = "#161926";
const MUTED    = "#7c82a0";
const GHOST    = "#4a5070";

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await getEntityBySlug(slug);
  if (!data) return new ImageResponse(<div style={{ background: BG, width: "100%", height: "100%" }} />, size);

  const { entity, variants } = data;
  const defaultVariant = variants.find((v) => v.isDefault) ?? variants[0];
  const imageUrl = defaultVariant?.imageUrl ?? entity.imageUrl;
  const absImage = imageUrl ? (imageUrl.startsWith("http") ? imageUrl : `${BASE}${imageUrl}`) : null;

  const stats = defaultVariant ? await getEntityStats(defaultVariant.id) : [];
  const top3 = [...stats].sort((a, b) => b.value - a.value).slice(0, 3);

  const initial = entity.name[0]?.toUpperCase() ?? "?";

  return new ImageResponse(
    <div
      style={{
        display: "flex",
        width: "100%",
        height: "100%",
        background: BG,
        fontFamily: "sans-serif",
      }}
    >
      {/* Left: image or letter fallback */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: 420,
          height: "100%",
          background: SURFACE,
          borderRight: `1px solid ${GHOST}`,
          flexShrink: 0,
          overflow: "hidden",
          position: "relative",
        }}
      >
        {absImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={absImage}
            alt={entity.name}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 160,
              height: 160,
              borderRadius: "50%",
              background: ACCENT,
              fontSize: 80,
              fontWeight: 900,
              color: "#fff",
            }}
          >
            {initial}
          </div>
        )}
        {/* Subtle orange glow on the right edge */}
        <div
          style={{
            position: "absolute",
            right: 0,
            top: 0,
            bottom: 0,
            width: 60,
            background: `linear-gradient(to right, transparent, ${BG}80)`,
          }}
        />
      </div>

      {/* Right: content */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          flex: 1,
          padding: "48px 56px",
        }}
      >
        {/* Top: branding */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              fontSize: 12,
              fontWeight: 900,
              letterSpacing: "0.15em",
              textTransform: "uppercase" as const,
              color: ACCENT,
            }}
          >
            ANIMEWARBOARD.COM
          </div>
        </div>

        {/* Middle: character info */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div
            style={{
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: "0.1em",
              textTransform: "uppercase" as const,
              color: MUTED,
            }}
          >
            {entity.series.name}
          </div>
          <div
            style={{
              fontSize: 58,
              fontWeight: 900,
              color: "#e8eaf6",
              lineHeight: 1.05,
              letterSpacing: "-0.02em",
            }}
          >
            {entity.name}
          </div>
        </div>

        {/* Bottom: top 3 stats */}
        {top3.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div
              style={{
                fontSize: 10,
                fontWeight: 900,
                letterSpacing: "0.12em",
                textTransform: "uppercase" as const,
                color: GHOST,
              }}
            >
              Top Stats
            </div>
            {top3.map((s) => (
              <div key={s.slug} style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: MUTED }}>{s.name}</span>
                  <span style={{ fontSize: 13, fontWeight: 900, color: ACCENT }}>{s.value}</span>
                </div>
                <div style={{ display: "flex", height: 4, background: GHOST, borderRadius: 9999 }}>
                  <div
                    style={{
                      width: `${s.value}%`,
                      height: "100%",
                      background: ACCENT,
                      borderRadius: 9999,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>,
    size,
  );
}
