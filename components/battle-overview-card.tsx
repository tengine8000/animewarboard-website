"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Users } from "lucide-react";
import { DynamicRadarChart } from "@/components/dynamic-radar-chart";
import { PredictionConfidence } from "@/components/prediction-confidence";
import type { RadarStat } from "@/lib/queries";

const CLIP           = "polygon(12px 0, calc(100% - 12px) 0, 100% 12px, 100% calc(100% - 12px), calc(100% - 12px) 100%, 12px 100%, 0 calc(100% - 12px), 0 12px)";
const NAV_H          = 56;
const COLLAPSE_RANGE = 120;

// Desktop carousel dimensions
const CARD_W  = 88;
const CARD_H  = 116;
const SIDE_W  = 76;
const SIDE_H  = 104;
const SIDE_TOP = 6;
const PEEK_W  = 44;
const CONT_W  = PEEK_W + CARD_W + PEEK_W; // 176

// Mobile (< 640px) — nav buttons move inside the card deck, tighter peek
const M_CARD_W = 84;
const M_CARD_H = 114;
const M_PEEK_W = 18;
const M_CONT_W = M_PEEK_W + M_CARD_W + M_PEEK_W; // 120

const DIFFICULTY_LABEL: Record<string, string> = {
  very_easy: "No Contest",
  easy:      "Low Diff",
  medium:    "Mid Diff",
  hard:      "High Diff",
  extreme:   "Extreme Diff",
};

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
  sideA:           Participant[];
  sideB:           Participant[];
  radarStatsA:     RadarStat[];
  radarStatsB:     RadarStat[];
  communityStats:  RadarStat[];
  communityEdge:   CommunityEdge;
  summary:         VoteSummary;
  labelA:          string;
  labelB:          string;
  userName?:       string | null;
  userVerdict?:    "a" | "b" | "draw" | null;
  userDifficulty?: string | null;
};

// ── Team Carousel ──────────────────────────────────────────────────────────────

function TeamCarousel({
  participants, side, activeIndex, onPrev, onNext, outcome, compact = false,
}: {
  participants: Participant[];
  side:         "a" | "b";
  activeIndex:  number;
  onPrev:       () => void;
  onNext:       () => void;
  outcome?:     "wins" | "loses" | "draw" | null;
  compact?:     boolean;
}) {
  const color = side === "a" ? "var(--color-side-a)" : "var(--color-side-b)";
  const glow  = side === "a"
    ? "0 0 0 2px rgba(248,113,113,0.65), 0 0 22px rgba(248,113,113,0.4)"
    : "0 0 0 2px rgba(96,165,250,0.65),  0 0 22px rgba(96,165,250,0.4)";

  // Responsive dimensions
  const cW = compact ? M_CARD_W : CARD_W;
  const cH = compact ? M_CARD_H : CARD_H;
  const pW = compact ? M_PEEK_W : PEEK_W;
  const cT = compact ? M_CONT_W : CONT_W;

  const count  = participants.length;
  const active = participants[activeIndex];
  if (!active) return <div style={{ width: cT }} />;

  const outcomeColor = outcome === "wins" ? "#4ade80" : outcome === "loses" ? "#f87171" : "var(--color-text-ghost)";
  const outcomeLabel = outcome === "wins" ? "WINS" : outcome === "loses" ? "LOSES" : outcome === "draw" ? "DRAW" : null;

  // Desktop: external buttons flanking the card deck
  // Mobile (compact): buttons overlaid inside the card deck to save horizontal space
  const externalNavBtn = (onClick: () => void, label: string) => (compact || count <= 1) ? null : (
    <button onClick={onClick} style={{
      flexShrink: 0,
      width: 26, height: 26,
      borderRadius: "50%",
      background: "rgba(0,0,0,0.55)",
      backdropFilter: "blur(6px)",
      border: `1.5px solid ${color}`,
      boxShadow: `0 0 6px ${color}60`,
      outline: "none", cursor: "pointer", color: "#fff",
      fontSize: 16, fontWeight: 900, lineHeight: 1,
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 0,
    }}>
      {label}
    </button>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}>

      {/* Team label + count badge */}
      <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
        <Users size={compact ? 10 : 12} style={{ color, flexShrink: 0 }} />
        <span style={{ fontSize: compact ? 8 : 9, fontWeight: 900, letterSpacing: "0.12em", textTransform: "uppercase", color }}>
          TEAM {side.toUpperCase()}
        </span>
        <span style={{
          fontSize: 8, fontWeight: 900, color,
          border: `1px solid ${color}70`, borderRadius: "50%",
          width: 16, height: 16,
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0,
          background: `color-mix(in srgb, ${color} 20%, transparent)`,
        }}>
          {count}
        </span>
      </div>

      {/* Carousel row */}
      <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
        {externalNavBtn(onPrev, "‹")}

        {/* Stacked card deck — outer wrapper has no overflow clip so compact buttons
            can protrude past the edge; inner div clips the cards */}
        <div style={{ position: "relative", width: cT, height: cH }}>
          <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
            {([
              [activeIndex > 0         ? participants[activeIndex - 1] : null, activeIndex - 1],
              [participants[activeIndex],                                        activeIndex    ],
              [activeIndex < count - 1 ? participants[activeIndex + 1] : null, activeIndex + 1],
            ] as [typeof participants[0] | null, number][]).map(([p, pIdx]) => {
              if (!p) return null;
              const isActive = pIdx === activeIndex;
              const isLeft   = pIdx === activeIndex - 1;
              const img = p.variant.imageUrl ?? p.entity.imageUrl;
              const transform = isActive
                ? `translateX(${pW}px)`
                : isLeft
                ? `translateX(${compact ? -26 : -16}px) translateY(2px) translateZ(-20px) perspective(400px) rotateY(60deg) scale(0.80)`
                : `translateX(${compact ? 68 : 100}px) translateY(2px) translateZ(20px) perspective(410px) rotateY(316deg) scale(0.80)`;
              return (
                <div
                  key={pIdx}
                  style={{
                    position: "absolute", left: 0, top: 0,
                    width: cW, height: cH,
                    zIndex: isActive ? 2 : 1,
                    opacity: isActive ? 1 : 0.4,
                    transform,
                    transition: "transform 0.28s cubic-bezier(0.4,0,0.2,1), opacity 0.28s ease",
                    borderRadius: isActive ? 10 : 8, overflow: "hidden",
                    border: `1.5px solid ${color}`,
                    boxShadow: isActive ? glow : "none",
                    background: "var(--color-surface-hover)",
                  }}
                >
                  {img
                    // eslint-disable-next-line @next/next/no-img-element
                    ? <img src={img} alt={p.entity.name} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top", display: "block" }} />
                    : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: isActive ? (compact ? 24 : 30) : (compact ? 18 : 24), fontWeight: 900, color, background: `color-mix(in srgb, ${color} 15%, transparent)` }}>{p.entity.name[0]}</div>
                  }
                  <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "linear-gradient(transparent, rgba(0,0,0,0.88) 55%)", padding: isActive ? "22px 5px 6px" : "16px 4px 4px" }}>
                    {isActive
                      ? <Link href={`/characters/${p.entity.slug}`} style={{ fontSize: compact ? 8 : 9, fontWeight: 900, lineHeight: 1.2, color, display: "block", textAlign: "center", wordBreak: "break-word", textShadow: "0 1px 4px rgba(0,0,0,0.95)" }}>{p.entity.name}</Link>
                      : <p style={{ fontSize: 7, fontWeight: 900, color: "rgba(255,255,255,0.38)", textAlign: "center", lineHeight: 1.2, wordBreak: "break-word", textShadow: "0 1px 3px rgba(0,0,0,1)" }}>{p.entity.name}</p>
                    }
                  </div>
                </div>
              );
            })}
          </div>

          {/* Compact overlay buttons — live outside the overflow:hidden inner div
              so they're not clipped, and sit at the outer edges of the deck */}
          {compact && count > 1 && (
            <>
              <button onClick={onPrev} style={{
                position: "absolute", left: -12, top: "50%", transform: "translateY(-50%)",
                zIndex: 10, width: 22, height: 22, borderRadius: "50%",
                background: "rgba(0,0,0,0.6)", backdropFilter: "blur(6px)",
                border: `1.5px solid ${color}`, boxShadow: `0 0 6px ${color}60`,
                outline: "none", cursor: "pointer", color: "#fff",
                fontSize: 14, fontWeight: 900, lineHeight: 1,
                display: "flex", alignItems: "center", justifyContent: "center", padding: 0,
              }}>‹</button>
              <button onClick={onNext} style={{
                position: "absolute", right: -12, top: "50%", transform: "translateY(-50%)",
                zIndex: 10, width: 22, height: 22, borderRadius: "50%",
                background: "rgba(0,0,0,0.6)", backdropFilter: "blur(6px)",
                border: `1.5px solid ${color}`, boxShadow: `0 0 6px ${color}60`,
                outline: "none", cursor: "pointer", color: "#fff",
                fontSize: 14, fontWeight: 900, lineHeight: 1,
                display: "flex", alignItems: "center", justifyContent: "center", padding: 0,
              }}>›</button>
            </>
          )}
        </div>

        {externalNavBtn(onNext, "›")}
      </div>

      {/* Dot pagination */}
      {count > 1 && (
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          {participants.map((_, i) => (
            <div key={i} style={{
              width: i === activeIndex ? 6 : 4,
              height: i === activeIndex ? 6 : 4,
              borderRadius: "50%",
              background: i === activeIndex ? color : `${color}40`,
              transition: "all 0.2s",
            }} />
          ))}
          <span style={{ fontSize: 8, color: "var(--color-text-ghost)", marginLeft: 2 }}>
            {activeIndex + 1} OF {count}
          </span>
        </div>
      )}

      {/* WINS / LOSES badge */}
      {outcomeLabel && (
        <div style={{ marginTop: 2 }}>
          <div style={{
            fontSize: 9, fontWeight: 900, letterSpacing: "0.12em",
            padding: "2px 8px",
            border: `1.5px solid ${outcomeColor}`,
            color: outcomeColor,
            background: `color-mix(in srgb, ${outcomeColor} 12%, transparent)`,
          }}>
            {outcomeLabel}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Card ──────────────────────────────────────────────────────────────────────

export function BattleOverviewCard({
  sideA, sideB, radarStatsA, radarStatsB, communityStats, communityEdge, summary,
  labelA, labelB, userName, userVerdict, userDifficulty,
}: BattleOverviewCardProps) {
  const [indexA, setIndexA] = useState(0);
  const [indexB, setIndexB] = useState(0);
  const [compact, setCompact] = useState(false);

  const outcomeA = userVerdict === "a" ? "wins" : userVerdict === "b" ? "loses" : userVerdict === "draw" ? "draw" : null;
  const outcomeB = userVerdict === "b" ? "wins" : userVerdict === "a" ? "loses" : userVerdict === "draw" ? "draw" : null;

  const cardRef     = useRef<HTMLDivElement>(null);
  const spacerRef   = useRef<HTMLDivElement>(null);
  const collapseRef = useRef<HTMLDivElement>(null);
  const rafRef      = useRef<number | null>(null);

  useEffect(() => {
    const card     = cardRef.current;
    const spacer   = spacerRef.current;
    const collapse = collapseRef.current;
    if (!card || !spacer || !collapse) return;

    let collapseFullHeight = 0;
    let spacerFullHeight   = 0;

    function measure() {
      collapse!.style.height   = "";
      collapse!.style.opacity  = "";
      collapse!.style.overflow = "hidden";
      collapseFullHeight = collapse!.scrollHeight;
      spacerFullHeight   = card!.scrollHeight;
      spacer!.style.height = spacerFullHeight + "px";
    }

    function update() {
      rafRef.current = null;
      const spacerTop = spacer!.getBoundingClientRect().top;
      card!.style.top = Math.max(spacerTop, NAV_H) + "px";

      const overshoot = Math.max(0, NAV_H - spacerTop);
      const p = Math.min(1, overshoot / COLLAPSE_RANGE);

      if (collapseFullHeight) {
        collapse!.style.height  = `${collapseFullHeight * (1 - p)}px`;
        collapse!.style.opacity = `${1 - p}`;
      }
      if (spacerFullHeight) {
        spacer!.style.height = `${spacerFullHeight - collapseFullHeight * p}px`;
      }
    }

    function onScroll() {
      if (rafRef.current !== null) return;
      rafRef.current = requestAnimationFrame(update);
    }

    requestAnimationFrame(() => { measure(); update(); });
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", () => { measure(); update(); }, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  useEffect(() => {
    const check = () => setCompact(window.innerWidth < 640);
    check();
    window.addEventListener("resize", check, { passive: true });
    return () => window.removeEventListener("resize", check);
  }, []);

  return (
    <>
      <div ref={spacerRef} style={{ height: "500px" }} />

      <div ref={cardRef}
        style={{ position: "fixed", top: NAV_H, left: 0, right: 0, zIndex: 20, background: "var(--color-bg)" }}>
        <div style={{ maxWidth: "42rem", margin: "0 auto", padding: "0 1rem" }}>

          {/* Breadcrumb */}
          <nav className="py-1.5 text-[11px] flex items-center min-w-0 overflow-hidden" style={{ color: "var(--color-text-muted)" }}>
            <Link href="/battles" className="hover:underline shrink-0">Battles</Link>
            <span className="mx-1.5 shrink-0">/</span>
            <span style={{ color: "var(--color-text-base)" }} className="truncate">
              {labelA} vs {labelB}
            </span>
          </nav>

          <div style={{ clipPath: CLIP, background: "var(--color-border)", padding: "1px" }}>
            <div style={{ clipPath: CLIP, background: "var(--color-surface)" }}>

              {/* Header */}
              <div className="flex items-center justify-between px-5 py-3"
                style={{ borderBottom: "1px solid var(--color-border)" }}>
                <span className="text-[10px] font-black tracking-widest uppercase" style={{ color: "var(--color-text-muted)" }}>
                  Battle Overview{userName ? ` · By ${userName}` : ""}
                </span>
                <span className="flex items-center gap-1.5 text-[10px] font-black tracking-widest uppercase text-emerald-500">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live
                </span>
              </div>

              {/* Team A | VS | Team B */}
              <div style={{ display: "flex", flexDirection: "column" }}>
                <div style={{
                  display: "flex", alignItems: "center",
                  justifyContent: compact ? "center" : "space-between",
                  padding: compact ? "12px 8px 8px" : "14px 12px 8px",
                  gap: compact ? 26 : 4,
                }}>
                  <TeamCarousel
                    participants={sideA}
                    side="a"
                    activeIndex={indexA}
                    onPrev={() => setIndexA((i) => (i - 1 + sideA.length) % sideA.length)}
                    onNext={() => setIndexA((i) => (i + 1) % sideA.length)}
                    outcome={outcomeA as "wins" | "loses" | "draw" | null}
                    compact={compact}
                  />

                  {/* VS */}
                  <div style={{
                    position: "relative", flexShrink: 0, userSelect: "none",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    width: compact ? 44 : 56, height: compact ? 58 : 72,
                  }}>
                    <span style={{
                      position: "absolute", inset: 0,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: compact ? 62 : 80, lineHeight: 1,
                      background: "linear-gradient(160deg, var(--color-side-a) 20%, var(--color-side-b) 80%)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      opacity: 0.9, zIndex: 0,
                      filter: "drop-shadow(0 0 10px rgba(248,113,113,0.75)) drop-shadow(0 0 20px rgba(96,165,250,0.55))",
                    }}>⚡</span>
                    <div style={{
                      position: "relative", zIndex: 1,
                      display: "flex", alignItems: "flex-end",
                      fontStyle: "italic", fontWeight: 900, lineHeight: 1,
                    }}>
                      <span style={{ fontSize: compact ? 28 : 36, color: "#fff", textShadow: "0 0 10px rgba(255,255,255,0.57), 0 0 20px rgba(255,255,255,0.42), 0 0 30px rgba(255,255,255,0.24), 0 2px 8px rgba(0,0,0,0.9)" }}>V</span>
                      <span style={{ position: "relative", top: compact ? 8 : 10, right: compact ? 8 : 10, fontSize: compact ? 28 : 36, color: "#fff", textShadow: "0 0 10px rgba(255,255,255,0.57), 0 0 20px rgba(255,255,255,0.42), 0 0 30px rgba(255,255,255,0.24), 0 2px 8px rgba(0,0,0,0.9)", marginBottom: 1 }}>S</span>
                    </div>
                  </div>

                  <TeamCarousel
                    participants={sideB}
                    side="b"
                    activeIndex={indexB}
                    onPrev={() => setIndexB((i) => (i - 1 + sideB.length) % sideB.length)}
                    onNext={() => setIndexB((i) => (i + 1) % sideB.length)}
                    outcome={outcomeB as "wins" | "loses" | "draw" | null}
                    compact={compact}
                  />
                </div>

                {/* Difficulty — once, centered below VS */}
                {userDifficulty && (
                  <div style={{ display: "flex", justifyContent: "center", paddingBottom: 8 }}>
                    <div style={{
                      fontSize: 9, fontWeight: 900, letterSpacing: "0.12em",
                      padding: "2px 10px",
                      border: "1px solid #f59e0b",
                      color: "#f59e0b",
                      background: "rgba(245,158,11,0.08)",
                      borderRadius: 3,
                    }}>
                      {DIFFICULTY_LABEL[userDifficulty] ?? userDifficulty}
                    </div>
                  </div>
                )}
              </div>

              {/* Radar + Legend */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, padding: "4px 12px 10px" }}>
                <div style={{ width: "min(280px, 100%)" }}>
                  <DynamicRadarChart
                    defaultStatsA={radarStatsA}
                    defaultStatsB={radarStatsB}
                    communityStats={communityStats}
                    size={300}
                  />
                </div>
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 4, color: "var(--color-side-a)", fontSize: 9, fontWeight: 800, letterSpacing: "0.07em" }}>
                    <span style={{ width: 18, height: 2, background: "var(--color-side-a)", display: "inline-block", flexShrink: 0 }} />
                    TEAM A
                  </span>
                  <span style={{ display: "flex", alignItems: "center", gap: 4, color: "var(--color-side-b)", fontSize: 9, fontWeight: 800, letterSpacing: "0.07em" }}>
                    <span style={{ width: 18, height: 2, background: "var(--color-side-b)", display: "inline-block", flexShrink: 0 }} />
                    TEAM B
                  </span>
                  <span style={{ display: "flex", alignItems: "center", gap: 4, color: "var(--color-chart-community)", fontSize: 9, fontWeight: 800, letterSpacing: "0.07em" }}>
                    <span style={{ width: 18, height: 0, borderTop: "1.5px dashed var(--color-chart-community)", display: "inline-block", flexShrink: 0 }} />
                    COMMUNITY AVG
                  </span>
                </div>
              </div>

              {/* Collapsible: Community Edge + Vote bar */}
              <div ref={collapseRef} style={{ overflow: "hidden" }}>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", borderTop: "1px solid var(--color-border)" }}>
                  <div className="px-4 py-4" style={{ borderRight: "1px solid var(--color-border)" }}>
                    <p className="text-[9px] font-black tracking-widest uppercase mb-2" style={{ color: "var(--color-text-ghost)" }}>
                      Community Edge
                    </p>
                    {communityEdge.winner ? (
                      <>
                        <p className="text-[11px] font-black tracking-widest uppercase mb-0.5"
                          style={{ color: communityEdge.winner === "a" ? "var(--color-side-a)" : "var(--color-side-b)" }}>
                          Team {communityEdge.winner.toUpperCase()}
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

                {summary.total > 0 && (
                  <div className="px-5 py-3 space-y-1.5" style={{ borderTop: "1px solid var(--color-border)" }}>
                    <div className="flex justify-between text-[10px] font-black">
                      <span style={{ color: "var(--color-side-a)" }}>{summary.aPercent}%</span>
                      <span style={{ color: "var(--color-text-ghost)" }}>{summary.total.toLocaleString()} predictions</span>
                      <span style={{ color: "var(--color-side-b)" }}>{summary.bPercent}%</span>
                    </div>
                    <div className="flex h-1.5 overflow-hidden">
                      <div style={{ width: `${summary.aPercent}%`, background: "var(--color-side-a)", transition: "width 0.4s" }} />
                      {summary.drawPercent > 0 && (
                        <div style={{ width: `${summary.drawPercent}%`, background: "var(--color-text-ghost)" }} />
                      )}
                      <div style={{ flex: 1, background: "var(--color-side-b)" }} />
                    </div>
                    <div className="flex justify-between text-[9px]" style={{ color: "var(--color-text-ghost)" }}>
                      <span>{labelA}</span>
                      {summary.drawPercent > 0 && <span>Draw {summary.drawPercent}%</span>}
                      <span>{labelB}</span>
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

            </div>
          </div>
        </div>
      </div>
    </>
  );
}
