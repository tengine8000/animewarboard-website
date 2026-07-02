"use client";

import { useState, useEffect } from "react";
import { Users } from "lucide-react";
import { RadarChart } from "@/components/radar-chart";
import type { RadarStat, CommunityEdge, VoteSummary, ShareParticipant } from "@/lib/queries";

const CLIP = "polygon(12px 0, calc(100% - 12px) 0, 100% 12px, 100% calc(100% - 12px), calc(100% - 12px) 100%, 12px 100%, 0 calc(100% - 12px), 0 12px)";

// Desktop carousel dimensions
const CARD_W = 88;
const CARD_H = 116;
const PEEK_W = 44;
const CONT_W = PEEK_W + CARD_W + PEEK_W; // 176

// Mobile (< 640px) — overlay nav buttons, tighter peek
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

// ── Team Carousel ─────────────────────────────────────────────────────────────

function TeamCarousel({
  participants, side, activeIndex, onPrev, onNext, outcome, compact = false,
}: {
  participants: ShareParticipant[];
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

  const cW = compact ? M_CARD_W : CARD_W;
  const cH = compact ? M_CARD_H : CARD_H;
  const pW = compact ? M_PEEK_W : PEEK_W;
  const cT = compact ? M_CONT_W : CONT_W;

  const count  = participants.length;
  const active = participants[activeIndex];
  if (!active) return <div style={{ width: cT }} />;

  const outcomeColor = outcome === "wins" ? "#4ade80" : outcome === "loses" ? "#f87171" : "var(--color-text-ghost)";
  const outcomeLabel = outcome === "wins" ? "WINS" : outcome === "loses" ? "LOSES" : outcome === "draw" ? "DRAW" : null;

  const externalNavBtn = (onClick: () => void, label: string) => (compact || count <= 1) ? null : (
    <button onClick={onClick} style={{
      flexShrink: 0, width: 26, height: 26, borderRadius: "50%",
      background: "rgba(0,0,0,0.55)", backdropFilter: "blur(6px)",
      border: `1.5px solid ${color}`, boxShadow: `0 0 6px ${color}60`,
      outline: "none", cursor: "pointer", color: "#fff",
      fontSize: 16, fontWeight: 900, lineHeight: 1,
      display: "flex", alignItems: "center", justifyContent: "center", padding: 0,
    }}>{label}</button>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}>

      {/* Team label + count badge */}
      <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
        <Users size={compact ? 10 : 12} style={{ color, flexShrink: 0 }} />
        <span style={{ fontSize: compact ? 8 : 9, fontWeight: 900, letterSpacing: "0.12em", textTransform: "uppercase" as const, color }}>
          TEAM {side.toUpperCase()}
        </span>
        <span style={{
          fontSize: 8, fontWeight: 900, color,
          border: `1px solid ${color}70`, borderRadius: "50%",
          width: 16, height: 16, display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0, background: `color-mix(in srgb, ${color} 20%, transparent)`,
        }}>{count}</span>
      </div>

      {/* Stacked deck carousel */}
      <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
        {externalNavBtn(onPrev, "‹")}

        <div style={{ position: "relative", width: cT, height: cH }}>
          {/* Inner overflow clip for cards */}
          <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
            {([
              [activeIndex > 0         ? participants[activeIndex - 1] : null, activeIndex - 1],
              [participants[activeIndex],                                        activeIndex    ],
              [activeIndex < count - 1 ? participants[activeIndex + 1] : null, activeIndex + 1],
            ] as [ShareParticipant | null, number][]).map(([p, pIdx]) => {
              if (!p) return null;
              const isActive = pIdx === activeIndex;
              const isLeft   = pIdx === activeIndex - 1;
              const imgSrc = p.imageUrl ?? null;
              const transform = isActive
                ? `translateX(${pW}px)`
                : isLeft
                ? `translateX(${compact ? -26 : -16}px) translateY(2px) translateZ(-20px) perspective(400px) rotateY(60deg) scale(0.80)`
                : `translateX(${compact ? 68 : 100}px) translateY(2px) translateZ(20px) perspective(410px) rotateY(316deg) scale(0.80)`;
              return (
                <div key={pIdx} style={{
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
                }}>
                  {imgSrc ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={imgSrc} alt={p.name}
                      style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top", display: "block" }}
                      crossOrigin="anonymous"
                    />
                  ) : (
                    <div style={{
                      width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: isActive ? (compact ? 24 : 30) : (compact ? 18 : 24), fontWeight: 900, color,
                      background: `color-mix(in srgb, ${color} 15%, transparent)`,
                    }}>{p.name[0]}</div>
                  )}
                  <div style={{
                    position: "absolute", bottom: 0, left: 0, right: 0,
                    background: "linear-gradient(transparent, rgba(0,0,0,0.88) 55%)",
                    padding: isActive ? "22px 5px 6px" : "16px 4px 4px",
                  }}>
                    <p style={{
                      margin: 0,
                      fontSize: isActive ? (compact ? 8 : 9) : 7, fontWeight: 900, lineHeight: 1.2,
                      color: isActive ? color : "rgba(255,255,255,0.38)",
                      textAlign: "center", wordBreak: "break-word" as const,
                      textShadow: "0 1px 4px rgba(0,0,0,0.95)",
                    }}>{p.name}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Compact overlay nav buttons — outside overflow clip so not clipped */}
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
              width: i === activeIndex ? 6 : 4, height: i === activeIndex ? 6 : 4,
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
          }}>{outcomeLabel}</div>
        </div>
      )}
    </div>
  );
}

// ── VS Bolt ───────────────────────────────────────────────────────────────────

function VSBolt({ compact }: { compact: boolean }) {
  return (
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
        WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
        opacity: 0.9, zIndex: 0,
        filter: "drop-shadow(0 0 10px rgba(248,113,113,0.75)) drop-shadow(0 0 20px rgba(96,165,250,0.55))",
      }}>⚡</span>
      <div style={{
        position: "relative", zIndex: 1, display: "flex", alignItems: "flex-end",
        fontStyle: "italic", fontWeight: 900, lineHeight: 1,
      }}>
        <span style={{ fontSize: compact ? 28 : 36, color: "#fff", textShadow: "0 0 10px rgba(255,255,255,0.57), 0 0 20px rgba(255,255,255,0.42), 0 0 30px rgba(255,255,255,0.24), 0 2px 8px rgba(0,0,0,0.9)" }}>V</span>
        <span style={{ position: "relative", top: compact ? 8 : 10, right: compact ? 8 : 10, fontSize: compact ? 28 : 36, color: "#fff", textShadow: "0 0 10px rgba(255,255,255,0.57), 0 0 20px rgba(255,255,255,0.42), 0 0 30px rgba(255,255,255,0.24), 0 2px 8px rgba(0,0,0,0.9)", marginBottom: 1 }}>S</span>
      </div>
    </div>
  );
}

// ── Props ─────────────────────────────────────────────────────────────────────

type Props = {
  labelA:         string;
  labelB:         string;
  userName:       string | null;
  verdict:        string;
  difficulty:     string;
  userStats:      Record<string, number>;
  communityStats: RadarStat[];   // dashed community-average line
  radarStatsA:    RadarStat[];   // entity stats for side A (radar base)
  radarStatsB:    RadarStat[];   // entity stats for side B (radar base)
  participantsA:  ShareParticipant[];
  participantsB:  ShareParticipant[];
  communityEdge:  CommunityEdge;
  voteSummary:    VoteSummary;
};

// ── Main component ────────────────────────────────────────────────────────────

export function ShareCardContent({
  labelA, labelB, userName, verdict, difficulty,
  userStats, communityStats, radarStatsA, radarStatsB,
  participantsA, participantsB, communityEdge, voteSummary,
}: Props) {
  const [indexA, setIndexA] = useState(0);
  const [indexB, setIndexB] = useState(0);
  const [compact, setCompact] = useState(false);

  useEffect(() => {
    const check = () => setCompact(window.innerWidth < 640);
    check();
    window.addEventListener("resize", check, { passive: true });
    return () => window.removeEventListener("resize", check);
  }, []);

  const isDraw = verdict === "draw";
  const aWins  = verdict === "a";

  const outcomeA: "wins" | "loses" | "draw" | null = isDraw ? "draw" : aWins ? "wins"  : "loses";
  const outcomeB: "wins" | "loses" | "draw" | null = isDraw ? "draw" : aWins ? "loses" : "wins";

  const colorA = "var(--color-side-a)";
  const colorB = "var(--color-side-b)";

  return (
    <div style={{ clipPath: CLIP, background: "var(--color-border)", padding: "1px" }}>
      <div style={{ clipPath: CLIP, background: "var(--color-surface)" }}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3"
          style={{ borderBottom: "1px solid var(--color-border)" }}>
          <span className="text-[10px] font-black tracking-widest uppercase" style={{ color: "var(--color-text-muted)" }}>
            Battle Overview{userName ? ` · By ${userName}` : ""}
          </span>
          <span className="text-[9px] font-black tracking-widest uppercase" style={{ color: "var(--color-text-ghost)" }}>
            AnimeWarBoard.com
          </span>
        </div>

        {/* Team A | VS bolt | Team B */}
        <div style={{
          display: "flex", alignItems: "center",
          justifyContent: compact ? "center" : "space-between",
          padding: compact ? "12px 8px 8px" : "14px 12px 8px",
          gap: compact ? 26 : 4,
        }}>
          <TeamCarousel
            participants={participantsA}
            side="a"
            activeIndex={indexA}
            onPrev={() => setIndexA((i) => (i - 1 + participantsA.length) % participantsA.length)}
            onNext={() => setIndexA((i) => (i + 1) % participantsA.length)}
            outcome={outcomeA}
            compact={compact}
          />

          <VSBolt compact={compact} />

          <TeamCarousel
            participants={participantsB}
            side="b"
            activeIndex={indexB}
            onPrev={() => setIndexB((i) => (i - 1 + participantsB.length) % participantsB.length)}
            onNext={() => setIndexB((i) => (i + 1) % participantsB.length)}
            outcome={outcomeB}
            compact={compact}
          />
        </div>

        {/* Difficulty — once, centered below VS */}
        {difficulty && (
          <div style={{ display: "flex", justifyContent: "center", paddingBottom: 8 }}>
            <div style={{
              fontSize: 9, fontWeight: 900, letterSpacing: "0.12em",
              padding: "2px 10px",
              border: "1px solid #f59e0b",
              color: "#f59e0b",
              background: "rgba(245,158,11,0.08)",
              borderRadius: 3,
            }}>
              {DIFFICULTY_LABEL[difficulty] ?? difficulty}
            </div>
          </div>
        )}

        {/* Radar + legend — uses entity stats as base, community avg as dashed line */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, padding: "4px 12px 10px" }}>
          <div style={{ width: "min(280px, 100%)" }}>
            <RadarChart statsA={radarStatsA} statsB={radarStatsB} statsC={communityStats} size={300} />
          </div>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
            <span style={{ display: "flex", alignItems: "center", gap: 4, color: colorA, fontSize: 9, fontWeight: 800, letterSpacing: "0.07em" }}>
              <span style={{ width: 18, height: 2, background: colorA, display: "inline-block", flexShrink: 0 }} />
              TEAM A
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: 4, color: colorB, fontSize: 9, fontWeight: 800, letterSpacing: "0.07em" }}>
              <span style={{ width: 18, height: 2, background: colorB, display: "inline-block", flexShrink: 0 }} />
              TEAM B
            </span>
            {communityStats.length > 0 && (
              <span style={{ display: "flex", alignItems: "center", gap: 4, color: "var(--color-chart-community)", fontSize: 9, fontWeight: 800, letterSpacing: "0.07em" }}>
                <span style={{ width: 18, height: 0, borderTop: "1.5px dashed var(--color-chart-community)", display: "inline-block", flexShrink: 0 }} />
                COMMUNITY AVG
              </span>
            )}
          </div>
        </div>

        {/* Community Edge + Prediction Confidence */}
        <div className="grid grid-cols-2" style={{ borderTop: "1px solid var(--color-border)" }}>
          <div className="px-4 py-4" style={{ borderRight: "1px solid var(--color-border)" }}>
            <p className="text-[9px] font-black tracking-widest uppercase mb-2" style={{ color: "var(--color-text-ghost)" }}>
              Community Edge
            </p>
            {communityEdge.winner ? (
              <>
                <p className="text-[11px] font-black tracking-widest uppercase mb-0.5"
                  style={{ color: communityEdge.winner === "a" ? colorA : colorB }}>
                  Team {communityEdge.winner.toUpperCase()}
                </p>
                <p className="text-3xl font-black leading-none"
                  style={{ color: communityEdge.winner === "a" ? colorA : colorB }}>
                  +{communityEdge.edgePercent}%
                </p>
                <p className="text-[10px] mt-1" style={{ color: "var(--color-text-ghost)" }}>Overall Advantage</p>
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
            {voteSummary.total > 0 ? (
              <div className="space-y-1.5">
                <div className="flex justify-between text-[10px] font-black">
                  <span style={{ color: colorA }}>{voteSummary.aPercent}%</span>
                  <span style={{ color: "var(--color-text-ghost)" }}>{voteSummary.total.toLocaleString()} votes</span>
                  <span style={{ color: colorB }}>{voteSummary.bPercent}%</span>
                </div>
                <div className="flex h-1.5 overflow-hidden">
                  <div style={{ width: `${voteSummary.aPercent}%`, background: colorA, transition: "width 0.4s" }} />
                  {voteSummary.drawPercent > 0 && (
                    <div style={{ width: `${voteSummary.drawPercent}%`, background: "var(--color-text-ghost)" }} />
                  )}
                  <div style={{ flex: 1, background: colorB }} />
                </div>
                <div className="flex justify-between text-[9px]" style={{ color: "var(--color-text-ghost)" }}>
                  <span>{labelA}</span>
                  {voteSummary.drawPercent > 0 && <span>Draw {voteSummary.drawPercent}%</span>}
                  <span>{labelB}</span>
                </div>
                {voteSummary.settled && (
                  <p className="text-[9px] font-black tracking-widest uppercase text-emerald-500">✓ Settled</p>
                )}
                {voteSummary.contested && (
                  <p className="text-[9px] font-black tracking-widest uppercase text-amber-500">⚡ Contested</p>
                )}
              </div>
            ) : (
              <p className="text-xs" style={{ color: "var(--color-text-ghost)" }}>No predictions yet</p>
            )}
          </div>
        </div>

        {/* Stat breakdown — shows user's attribute predictions vs community avg */}
        {communityStats.length > 0 && Object.keys(userStats).length > 0 && (
          <div className="px-5 py-4 space-y-3" style={{ borderTop: "1px solid var(--color-border)" }}>
            <div className="flex items-center justify-between text-[9px] font-black tracking-widest uppercase"
              style={{ color: "var(--color-text-ghost)" }}>
              <span>Stat Breakdown</span>
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5">
                  <span style={{ display: "inline-block", width: 12, height: 2, background: colorA }} />
                  My Rating (A)
                </span>
                <span className="flex items-center gap-1.5">
                  <span style={{ display: "inline-block", width: 12, height: 0, borderTop: "1.5px dashed var(--color-text-ghost)" }} />
                  Community
                </span>
              </div>
            </div>
            {communityStats.map((attr) => {
              const userVal = userStats[attr.slug] ?? 50;
              const commVal = attr.value;
              return (
                <div key={attr.slug} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span style={{ color: "var(--color-text-muted)" }}>{attr.name}</span>
                    <span className="font-black" style={{ color: colorA }}>{userVal}</span>
                  </div>
                  <div className="h-1.5 overflow-hidden relative" style={{ background: "var(--color-border)" }}>
                    <div className="h-full" style={{ width: `${userVal}%`, background: colorA }} />
                    <div className="absolute top-0 bottom-0 w-0.5"
                      style={{ left: `${commVal}%`, background: "var(--color-text-ghost)", opacity: 0.6 }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
}
