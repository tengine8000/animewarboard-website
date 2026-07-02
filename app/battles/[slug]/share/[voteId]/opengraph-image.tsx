export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const alt = "My battle prediction — AnimeWarBoard";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

import { ImageResponse } from "next/og";
import { getSharePageData, type ShareParticipant } from "@/lib/queries";

const BG      = "#0b0d18";
const SURFACE = "#161926";
const BORDER  = "#2a2f4a";
const MUTED   = "#7c82a0";
const GHOST   = "#4a5070";
const ACCENT  = "#f97316";
const RED     = "#f87171";
const BLUE    = "#60a5fa";
const WHITE   = "#e8eaf6";
const GREEN   = "#4ade80";

// Layout: left 280 + centre 640 + right 280 = 1200
const PANEL_W = 280;
const CX      = 320;
const CY      = 245;
const MAX_R   = 150;

function radarPath(values: number[], cx: number, cy: number, maxR: number): string {
  const n = values.length;
  if (n === 0) return "";
  return values.map((v, i) => {
    const angle = (i * 2 * Math.PI) / n - Math.PI / 2;
    const r     = (v / 100) * maxR;
    return `${i === 0 ? "M" : "L"}${(cx + r * Math.cos(angle)).toFixed(1)},${(cy + r * Math.sin(angle)).toFixed(1)}`;
  }).join(" ") + " Z";
}

function gridPath(fraction: number, cx: number, cy: number, maxR: number, n: number): string {
  const r = fraction * maxR;
  return Array.from({ length: n }, (_, i) => {
    const angle = (i * 2 * Math.PI) / n - Math.PI / 2;
    return `${i === 0 ? "M" : "L"}${(cx + r * Math.cos(angle)).toFixed(1)},${(cy + r * Math.sin(angle)).toFixed(1)}`;
  }).join(" ") + " Z";
}

function Avatar({ name, color, teamCount }: {
  name: string; color: string; teamCount: number;
}) {
  const glow = `0 0 0 2px ${color}, 0 0 18px ${color}66`;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
      <div style={{
        display: "flex", width: 100, height: 124, borderRadius: "10px",
        background: `${color}22`, boxShadow: glow,
        alignItems: "center", justifyContent: "center",
      }}>
        <span style={{ color, fontSize: 48, fontWeight: 900 }}>{name[0]}</span>
      </div>
      {teamCount > 1 ? (
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "center",
          width: 22, height: 22, borderRadius: "50%",
          background: "rgba(10,12,24,0.92)",
          borderWidth: "1.5px", borderStyle: "solid", borderColor: "rgba(232,234,246,0.7)",
          fontSize: 10, fontWeight: 900, color: WHITE,
        }}>
          {`+${teamCount - 1}`}
        </div>
      ) : null}
    </div>
  );
}

function FighterPanel({ fighter, sideLabel, color, teamCount, outcomeLabel, outcomeColor, diffLabel }: {
  fighter: ShareParticipant; sideLabel: string; color: string;
  teamCount: number; outcomeLabel: string; outcomeColor: string; diffLabel: string;
}) {
  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      width: PANEL_W, padding: "20px 18px", gap: 8,
    }}>
      <span style={{ fontSize: 9, fontWeight: 900, letterSpacing: "0.18em", color, textTransform: "uppercase" }}>
        {sideLabel}
      </span>
      <Avatar name={fighter.name} color={color} teamCount={teamCount} />
      <span style={{ fontSize: fighter.name.length > 14 ? 13 : 15, fontWeight: 900, color, textAlign: "center", lineHeight: 1.2 }}>
        {fighter.name}
      </span>
      <span style={{ fontSize: 9, fontWeight: 700, color: GHOST, textAlign: "center", letterSpacing: "0.07em", textTransform: "uppercase" }}>
        {fighter.seriesName}
      </span>
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "4px 14px", background: `${outcomeColor}18`,
        borderWidth: "1.5px", borderStyle: "solid", borderColor: outcomeColor,
        color: outcomeColor, fontSize: 11, fontWeight: 900, letterSpacing: "0.12em",
      }}>
        {outcomeLabel}
      </div>
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "2px 10px", background: `${outcomeColor}0d`,
        borderWidth: "1px", borderStyle: "solid", borderColor: outcomeColor,
        color: outcomeColor, fontSize: 9, fontWeight: 900, letterSpacing: "0.1em",
      }}>
        {diffLabel}
      </div>
    </div>
  );
}

export default async function Image({ params }: { params: Promise<{ slug: string; voteId: string }> }) {
  const { voteId } = await params;
  const data = await getSharePageData(voteId);

  if (!data) {
    return new ImageResponse(
      <div style={{ display: "flex", width: "100%", height: "100%", background: BG, alignItems: "center", justifyContent: "center" }}>
        <span style={{ color: MUTED, fontSize: 24 }}>Prediction not found</span>
      </div>,
      size,
    );
  }

  const { vote, userName, userStats, communityStats, participantsA, participantsB } = data;
  const verdict = vote.verdict;
  const isDraw  = verdict === "draw";
  const aWins   = verdict === "a";

  const DIFF_MAP: Record<string, string> = {
    very_easy: "No Contest", easy: "Low Diff", medium: "Mid Diff",
    hard: "High Diff", extreme: "Extreme Diff",
  };
  const diffLabel = DIFF_MAP[vote.difficulty] ?? vote.difficulty;

  const n             = communityStats.length;
  const sideAValues   = communityStats.map((a) => userStats[a.slug] ?? 50);
  const sideBValues   = communityStats.map((a) => 100 - (userStats[a.slug] ?? 50));
  const communityVals = communityStats.map((a) => a.value);

  const pathA         = radarPath(sideAValues,   CX, CY, MAX_R);
  const pathB         = radarPath(sideBValues,   CX, CY, MAX_R);
  const communityPath = radarPath(communityVals, CX, CY, MAX_R);

  // Pre-compute label positions — consumed individually in JSX (no .map() in HTML context)
  type LabelPos = { text: string; left: number; top: number };
  const lp: LabelPos[] = communityStats.map((stat, i) => {
    const angle = (i * 2 * Math.PI) / n - Math.PI / 2;
    const r     = MAX_R + 26;
    return {
      text: stat.name.toUpperCase(),
      left: Math.round(CX + r * Math.cos(angle)) - 40,
      top:  Math.round(CY + r * Math.sin(angle)) - 8,
    };
  });
  const labelStyle = { position: "absolute" as const, width: 80, display: "flex", justifyContent: "center", fontSize: 8, fontWeight: 700, color: WHITE } as const;


  const fighterA = participantsA[0] ?? null;
  const fighterB = participantsB[0] ?? null;

  const outcomeALabel = isDraw ? "DRAW" : aWins ? "WINS"  : "LOSES";
  const outcomeBLabel = isDraw ? "DRAW" : aWins ? "LOSES" : "WINS";
  const outcomeAColor = isDraw ? MUTED  : aWins ? GREEN   : GHOST;
  const outcomeBColor = isDraw ? MUTED  : aWins ? GHOST   : GREEN;


  return new ImageResponse(
    <div style={{ display: "flex", flexDirection: "column", width: "100%", height: "100%", background: BG, fontFamily: "sans-serif" }}>

      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 32px", height: 52, background: SURFACE,
        borderBottomWidth: "1px", borderBottomStyle: "solid", borderBottomColor: BORDER, flexShrink: 0,
      }}>
        <span style={{ fontSize: 12, fontWeight: 900, letterSpacing: "0.15em", color: ACCENT }}>
          {`BATTLE OVERVIEW${userName ? ` · BY ${userName.toUpperCase()}` : ""}`}
        </span>
        <span style={{ fontSize: 10, fontWeight: 700, color: GHOST, letterSpacing: "0.08em" }}>
          ANIMEWARBOARD.COM
        </span>
      </div>

      {/* Body: left panel | radar | right panel */}
      <div style={{ display: "flex", flex: 1, background: SURFACE }}>

        {/* Fighter A */}
        {fighterA ? (
          <FighterPanel
            fighter={fighterA}
            sideLabel="SIDE A" color={RED}
            teamCount={participantsA.length}
            outcomeLabel={outcomeALabel} outcomeColor={outcomeAColor}
            diffLabel={diffLabel}
          />
        ) : (
          <div style={{ width: PANEL_W }} />
        )}

        {/* Centre: Radar */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flex: 1 }}>
          {n > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>

              {/* Radar: relative container, SVG absolute, labels as individual children — no HTML .map() */}
              <div style={{ position: "relative", display: "flex", width: CX * 2, height: CY * 2 }}>
                <div style={{ position: "absolute", top: 0, left: 0, display: "flex", width: CX * 2, height: CY * 2 }}>
                  <svg width={CX * 2} height={CY * 2} viewBox={`0 0 ${CX * 2} ${CY * 2}`}>
                    {[0.25, 0.5, 0.75, 1].map((f) => (
                      <path key={f} d={gridPath(f, CX, CY, MAX_R, n)} fill="none" stroke={f === 1 ? WHITE : BORDER} strokeWidth={f === 1 ? "1.5" : "1"} />
                    ))}
                    {communityStats.map((_, i) => {
                      const angle = (i * 2 * Math.PI) / n - Math.PI / 2;
                      return (
                        <line key={i}
                          x1={String(CX)} y1={String(CY)}
                          x2={(CX + MAX_R * Math.cos(angle)).toFixed(1)}
                          y2={(CY + MAX_R * Math.sin(angle)).toFixed(1)}
                          stroke={BORDER} strokeWidth="1"
                        />
                      );
                    })}
                    <path d={communityPath} fill={`${WHITE}0d`} stroke={`${WHITE}88`} strokeWidth="1.5" strokeDasharray="4 3" />
                    <path d={pathB} fill={`${BLUE}22`} stroke={BLUE} strokeWidth="1.75" />
                    <path d={pathA} fill={`${RED}30`} stroke={RED} strokeWidth="2" />
                  </svg>
                </div>
                {lp[0] ? <div style={{ ...labelStyle, left: lp[0].left, top: lp[0].top }}>{lp[0].text}</div> : null}
                {lp[1] ? <div style={{ ...labelStyle, left: lp[1].left, top: lp[1].top }}>{lp[1].text}</div> : null}
                {lp[2] ? <div style={{ ...labelStyle, left: lp[2].left, top: lp[2].top }}>{lp[2].text}</div> : null}
                {lp[3] ? <div style={{ ...labelStyle, left: lp[3].left, top: lp[3].top }}>{lp[3].text}</div> : null}
                {lp[4] ? <div style={{ ...labelStyle, left: lp[4].left, top: lp[4].top }}>{lp[4].text}</div> : null}
                {lp[5] ? <div style={{ ...labelStyle, left: lp[5].left, top: lp[5].top }}>{lp[5].text}</div> : null}
                {lp[6] ? <div style={{ ...labelStyle, left: lp[6].left, top: lp[6].top }}>{lp[6].text}</div> : null}
                {lp[7] ? <div style={{ ...labelStyle, left: lp[7].left, top: lp[7].top }}>{lp[7].text}</div> : null}
                {lp[8] ? <div style={{ ...labelStyle, left: lp[8].left, top: lp[8].top }}>{lp[8].text}</div> : null}
              </div>

              {/* Legend */}
              <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <div style={{ width: 18, height: 2, background: RED }} />
                  <span style={{ fontSize: 9, fontWeight: 800, color: RED, letterSpacing: "0.08em" }}>TEAM A</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <div style={{ width: 18, height: 2, background: BLUE }} />
                  <span style={{ fontSize: 9, fontWeight: 800, color: BLUE, letterSpacing: "0.08em" }}>TEAM B</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <div style={{ width: 18, height: 1, borderTopWidth: "1.5px", borderTopStyle: "dashed", borderTopColor: MUTED }} />
                  <span style={{ fontSize: 9, fontWeight: 800, color: MUTED, letterSpacing: "0.08em" }}>COMMUNITY</span>
                </div>
              </div>
            </div>
          ) : (
            <span style={{ color: GHOST, fontSize: 14 }}>No stat data yet</span>
          )}
        </div>

        {/* Fighter B */}
        {fighterB ? (
          <FighterPanel
            fighter={fighterB}
            sideLabel="SIDE B" color={BLUE}
            teamCount={participantsB.length}
            outcomeLabel={outcomeBLabel} outcomeColor={outcomeBColor}
            diffLabel={diffLabel}
          />
        ) : (
          <div style={{ width: PANEL_W }} />
        )}
      </div>
    </div>,
    size,
  );
}
