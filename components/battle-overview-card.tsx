"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { DynamicRadarChart } from "@/components/dynamic-radar-chart";
import { PredictionConfidence } from "@/components/prediction-confidence";
import type { RadarStat } from "@/lib/queries";

const CLIP           = "polygon(12px 0, calc(100% - 12px) 0, 100% 12px, 100% calc(100% - 12px), calc(100% - 12px) 100%, 12px 100%, 0 calc(100% - 12px), 0 12px)";
const NAV_H          = 56;   // must match h-14 in nav
const COLLAPSE_RANGE = 120;  // px of additional scroll → fully collapsed

// ── Types ─────────────────────────────────────────────────────────────────────

type Participant = {
  entity:  { name: string; slug: string; imageUrl: string | null };
  variant: { name: string; imageUrl: string | null };
  series:  { name: string };
};

type CommunityEdge = {
  winner:      "a" | "b" | null;
  edgePercent: number;
  voterCount:  number;
};

type VoteSummary = {
  total:        number;
  aPercent:     number;
  bPercent:     number;
  drawPercent:  number;
  settled:      boolean;
  contested:    boolean;
};

export type BattleOverviewCardProps = {
  firstA:         Participant | undefined;
  firstB:         Participant | undefined;
  radarStatsA:    RadarStat[];
  radarStatsB:    RadarStat[];
  communityStats: RadarStat[];
  communityEdge:  CommunityEdge;
  summary:        VoteSummary;
  labelA:         string;
  labelB:         string;
};

// ── Fighter panel ─────────────────────────────────────────────────────────────

function FighterPanel({ participant, side, align }: {
  participant: Participant | undefined;
  side:        "a" | "b";
  align:       "left" | "right";
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
    <div style={{ display: "flex", flexDirection: "column", alignItems: ai, gap: 4, minWidth: 0 }}>
      <p style={{ fontSize: 9, fontWeight: 900, letterSpacing: "0.1em", color, textAlign: ta, textTransform: "uppercase" }}>
        Fighter {side.toUpperCase()}
      </p>
      {/* Avatar: 52px on mobile, 72px on sm+ */}
      <div
        className="w-[52px] h-[52px] sm:w-[72px] sm:h-[72px]"
        style={{ borderRadius: "50%", overflow: "hidden", position: "relative", flexShrink: 0,
          border: `2px solid ${color}`, boxShadow: glow }}
      >
        {image ? (
          <Image src={image} alt={participant.entity.name} fill sizes="72px" priority className="object-cover object-top" />
        ) : (
          <div style={{
            width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 22, fontWeight: 900,
            background: `color-mix(in srgb, ${color} 15%, transparent)`, color,
          }}>
            {participant.entity.name[0]}
          </div>
        )}
      </div>
      <Link
        href={`/characters/${participant.entity.slug}`}
        style={{ color, fontWeight: 900, fontSize: 12, lineHeight: 1.2, textAlign: ta, wordBreak: "break-word" }}
        className="hover:underline"
      >
        {participant.entity.name}
      </Link>
      {/* Variant + series hidden on mobile to keep fighter row ~100px */}
      <p className="hidden sm:block" style={{ fontSize: 10, color: "var(--color-text-ghost)", textAlign: ta, lineHeight: 1.2 }}>
        {participant.variant.name}
      </p>
      <p className="hidden sm:block" style={{ fontSize: 9, color: "var(--color-text-muted)", textAlign: ta, textTransform: "uppercase", letterSpacing: "0.05em" }}>
        {participant.series.name}
      </p>
    </div>
  );
}

// ── Card ──────────────────────────────────────────────────────────────────────

export function BattleOverviewCard({
  firstA, firstB, radarStatsA, radarStatsB, communityStats, communityEdge, summary, labelA, labelB,
}: BattleOverviewCardProps) {
  const cardRef     = useRef<HTMLDivElement>(null);
  const spacerRef   = useRef<HTMLDivElement>(null);
  const collapseRef = useRef<HTMLDivElement>(null);
  const rafRef      = useRef<number | null>(null);

  useEffect(() => {
    const card    = cardRef.current;
    const spacer  = spacerRef.current;
    const collapse = collapseRef.current;
    if (!card || !spacer || !collapse) return;

    let collapseFullHeight = 0;
    let spacerFullHeight   = 0;

    function measure() {
      collapse!.style.height  = "";
      collapse!.style.opacity = "";
      collapse!.style.overflow = "hidden";
      collapseFullHeight = collapse!.scrollHeight;
      spacerFullHeight   = card!.scrollHeight;
      spacer!.style.height = spacerFullHeight + "px";
    }

    function update() {
      rafRef.current = null;
      const spacerTop = spacer!.getBoundingClientRect().top;

      // JS sticky polyfill: card follows spacer until spacer reaches NAV_H, then locks
      card!.style.top = Math.max(spacerTop, NAV_H) + "px";

      // Collapse starts only after card has stuck (spacerTop < NAV_H)
      const overshoot = Math.max(0, NAV_H - spacerTop);
      const p = Math.min(1, overshoot / COLLAPSE_RANGE);

      if (collapseFullHeight) {
        collapse!.style.height  = `${collapseFullHeight * (1 - p)}px`;
        collapse!.style.opacity = `${1 - p}`;
      }

      // Spacer shrinks in sync so content below rises naturally
      if (spacerFullHeight) {
        spacer!.style.height = `${spacerFullHeight - collapseFullHeight * p}px`;
      }
    }

    function onScroll() {
      if (rafRef.current !== null) return;
      rafRef.current = requestAnimationFrame(update);
    }

    function onResize() { measure(); update(); }

    requestAnimationFrame(() => { measure(); update(); });

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <>
      {/* Spacer: holds normal-flow space while card is position:fixed.
          500px is a safe initial estimate — corrected to card.scrollHeight on mount. */}
      <div ref={spacerRef} style={{ height: "500px" }} />

      {/* Fixed card: position managed by JS above — tracks spacer until
          spacer hits NAV_H, then locks. Inner div matches page max-w-2xl px-4. */}
      <div
        ref={cardRef}
        style={{ position: "fixed", top: NAV_H, left: 0, right: 0, zIndex: 20, background: "var(--color-bg)" }}
      >
        <div style={{ maxWidth: "42rem", margin: "0 auto", padding: "0 1rem" }}>

          {/* Breadcrumb — always visible */}
          <nav className="py-1.5 text-[11px]" style={{ color: "var(--color-text-muted)" }}>
            <Link href="/battles" className="hover:underline">Battles</Link>
            <span className="mx-1.5">/</span>
            <span style={{ color: "var(--color-text-base)" }} className="line-clamp-1">
              {labelA} vs {labelB}
            </span>
          </nav>

          <div style={{ clipPath: CLIP, background: "var(--color-border)", padding: "1px" }}>
            <div style={{ clipPath: CLIP, background: "var(--color-surface)" }}>

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

              {/* Fighter A | Radar | Fighter B — always visible, never collapses
                  Mobile:  fighters row 1 side-by-side, chart row 2 full-width
                  Desktop: 3-column grid                                         */}
              {/* Mobile: fighters row ~100px, chart area ~250px → total ~350px
                  Desktop: 3-col grid, full sizes */}
              <div className="grid grid-cols-2 sm:grid-cols-[90px_1fr_90px] items-center gap-2 px-3 py-2 sm:px-3.5 sm:py-4">
                <div className="order-1">
                  <FighterPanel participant={firstA} side="a" align="left" />
                </div>
                <div className="order-2 sm:order-3">
                  <FighterPanel participant={firstB} side="b" align="right" />
                </div>
                <div className="order-3 col-span-2 sm:col-span-1 sm:order-2 flex flex-col items-center gap-2">
                  {/* w-[220px] on mobile caps the SVG (width: min(100%, 300px)) to 220px
                      → chart renders 220×220, fitting in the 250px chart area.
                      sm:w-full restores full-width on desktop so size={300} is respected. */}
                  <div className="w-[220px] sm:w-full flex justify-center">
                    <DynamicRadarChart
                      defaultStatsA={radarStatsA}
                      defaultStatsB={radarStatsB}
                      communityStats={communityStats}
                      size={300}
                    />
                  </div>
                  <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 4, color: "var(--color-side-a)", fontSize: 9, fontWeight: 800, letterSpacing: "0.07em" }}>
                      <span style={{ width: 20, height: 2, background: "var(--color-side-a)", display: "inline-block", flexShrink: 0 }} />
                      FIGHTER A
                    </span>
                    <span style={{ display: "flex", alignItems: "center", gap: 4, color: "var(--color-side-b)", fontSize: 9, fontWeight: 800, letterSpacing: "0.07em" }}>
                      <span style={{ width: 20, height: 2, background: "var(--color-side-b)", display: "inline-block", flexShrink: 0 }} />
                      FIGHTER B
                    </span>
                    <span style={{ display: "flex", alignItems: "center", gap: 4, color: "var(--color-chart-community)", fontSize: 9, fontWeight: 800, letterSpacing: "0.07em" }}>
                      <span style={{ width: 20, height: 0, borderTop: "1.5px dashed var(--color-chart-community)", display: "inline-block", flexShrink: 0 }} />
                      COMMUNITY
                    </span>
                  </div>
                </div>  {/* end chart column */}
              </div>  {/* end fighters/chart grid */}

              {/* ── COLLAPSIBLE: fades + collapses as user scrolls past the sticky point ── */}
              <div ref={collapseRef} style={{ overflow: "hidden" }}>

                {/* Community Edge + Prediction Confidence */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", borderTop: "1px solid var(--color-border)" }}>
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
                      {summary.drawPercent > 0 && (
                        <div style={{ width: `${summary.drawPercent}%`, background: "var(--color-text-ghost)" }} />
                      )}
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

              </div>
              {/* ── end collapsible ─────────────────────────────────────────────── */}

            </div>
          </div>
        </div>
      </div>
    </>
  );
}
