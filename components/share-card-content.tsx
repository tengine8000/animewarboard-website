"use client";

import { RadarChart } from "@/components/radar-chart";
import type { RadarStat, CommunityEdge, VoteSummary, ShareParticipant } from "@/lib/queries";

const CLIP = "polygon(12px 0, calc(100% - 12px) 0, 100% 12px, 100% calc(100% - 12px), calc(100% - 12px) 100%, 12px 100%, 0 calc(100% - 12px), 0 12px)";

const DIFFICULTY_LABEL: Record<string, string> = {
  very_easy: "No Contest",
  easy:      "Low Diff",
  medium:    "Mid Diff",
  hard:      "High Diff",
  extreme:   "Extreme Diff",
};

type Props = {
  labelA:        string;
  labelB:        string;
  userName:      string | null;
  verdict:       string;
  difficulty:    string;
  userStats:     Record<string, number>;
  communityStats: RadarStat[];
  participantsA: ShareParticipant[];
  participantsB: ShareParticipant[];
  communityEdge: CommunityEdge;
  voteSummary:   VoteSummary;
};

function Avatar({ src, name, color, extraCount = 0 }: { src: string | null; name: string; color: string; extraCount?: number }) {
  const glow = `0 0 0 2px ${color}50, 0 0 14px ${color}40`;
  return (
    <div style={{ position: "relative", display: "inline-flex" }}>
      <div style={{
        width: 64, height: 64, borderRadius: "50%", overflow: "hidden",
        border: `2.5px solid ${color}`, boxShadow: glow, flexShrink: 0,
        background: `color-mix(in srgb, ${color} 15%, var(--color-surface))`,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt={name} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top" }} crossOrigin="anonymous" />
        ) : (
          <span style={{ fontSize: 24, fontWeight: 900, color }}>{name[0]}</span>
        )}
      </div>

      {extraCount > 0 && (
        <div style={{
          position: "absolute", bottom: -2, right: -2,
          width: 20, height: 20, borderRadius: "50%",
          background: "rgba(10,12,24,0.92)",
          border: "1.5px solid rgba(255,255,255,0.65)",
          boxShadow: "0 0 0 2px rgba(255,255,255,0.06), 0 0 8px rgba(255,255,255,0.28)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 9, fontWeight: 900, color: "#fff",
        }}>
          +{extraCount}
        </div>
      )}
    </div>
  );
}

export function ShareCardContent({
  labelA, labelB, userName, verdict, difficulty,
  userStats, communityStats, participantsA, participantsB,
  communityEdge, voteSummary,
}: Props) {
  const isDraw = verdict === "draw";
  const aWins  = verdict === "a";

  const colorA = "var(--color-side-a)";
  const colorB = "var(--color-side-b)";

  const outcomeALabel = isDraw ? "DRAW" : aWins ? "WINS"  : "LOSES";
  const outcomeBLabel = isDraw ? "DRAW" : aWins ? "LOSES" : "WINS";
  const outcomeAColor = isDraw ? "var(--color-text-ghost)" : aWins ? "#4ade80" : colorA;
  const outcomeBColor = isDraw ? "var(--color-text-ghost)" : aWins ? colorB   : "#4ade80";

  const diffLabel = DIFFICULTY_LABEL[difficulty] ?? difficulty;

  const fighterA = participantsA[0];
  const fighterB = participantsB[0];

  const siteUrl = typeof window !== "undefined" ? window.location.origin : "";
  const imgA = fighterA?.imageUrl
    ? fighterA.imageUrl.startsWith("http") ? fighterA.imageUrl : `${siteUrl}${fighterA.imageUrl}`
    : null;
  const imgB = fighterB?.imageUrl
    ? fighterB.imageUrl.startsWith("http") ? fighterB.imageUrl : `${siteUrl}${fighterB.imageUrl}`
    : null;

  const userRadarA: RadarStat[] = communityStats.map((a) => ({ ...a, value: userStats[a.slug] ?? 50 }));
  const userRadarB: RadarStat[] = communityStats.map((a) => ({ ...a, value: 100 - (userStats[a.slug] ?? 50) }));

  return (
    <div style={{ clipPath: CLIP, background: "var(--color-border)", padding: "1px" }}>
      <div style={{ clipPath: CLIP, background: "var(--color-surface)" }}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3" style={{ borderBottom: "1px solid var(--color-border)" }}>
          <span className="text-[10px] font-black tracking-widest uppercase" style={{ color: "var(--color-text-muted)" }}>
            Battle Overview{userName ? ` · By ${userName}` : ""}
          </span>
          <span className="text-[9px] font-black tracking-widest uppercase" style={{ color: "var(--color-text-ghost)" }}>
            AnimeWarBoard.com
          </span>
        </div>

        {/* Fighter panels + radar */}
        <div className="grid grid-cols-[auto_1fr_auto] items-center gap-3 px-4 py-4">

          {/* Side A */}
          <div className="flex flex-col items-center gap-2" style={{ minWidth: 72 }}>
            <span className="text-[9px] font-black tracking-widest uppercase" style={{ color: colorA }}>Side A</span>
            {fighterA && <Avatar src={imgA} name={fighterA.name} color={colorA} extraCount={participantsA.length - 1} />}
            {fighterA && (
              <span className="text-[11px] font-black text-center leading-tight max-w-[80px]" style={{ color: colorA }}>
                {fighterA.name}
              </span>
            )}
            {fighterA && (
              <span className="text-[9px] text-center leading-tight max-w-[80px]" style={{ color: "var(--color-text-ghost)" }}>
                {fighterA.seriesName}
              </span>
            )}
            <div className="px-2.5 py-0.5 text-[10px] font-black tracking-widest"
              style={{ border: `1.5px solid ${outcomeAColor}`, color: outcomeAColor, background: `color-mix(in srgb, ${outcomeAColor} 12%, transparent)` }}>
              {outcomeALabel}
            </div>
            <div className="px-2 py-0.5 text-[9px] font-black tracking-widest"
              style={{ border: `1px solid ${outcomeAColor}`, color: outcomeAColor, background: `color-mix(in srgb, ${outcomeAColor} 8%, transparent)`, whiteSpace: "nowrap" }}>
              {diffLabel}
            </div>
          </div>

          {/* Radar */}
          <div className="flex flex-col items-center gap-2">
            <RadarChart statsA={userRadarA} statsB={userRadarB} statsC={communityStats} size={220} />
            <div className="flex items-center gap-3 flex-wrap justify-center">
              <span className="flex items-center gap-1.5 text-[9px] font-black tracking-widest uppercase" style={{ color: colorA }}>
                <span style={{ width: 16, height: 2, background: colorA, display: "inline-block" }} />
                Fighter A
              </span>
              <span className="flex items-center gap-1.5 text-[9px] font-black tracking-widest uppercase" style={{ color: colorB }}>
                <span style={{ width: 16, height: 2, background: colorB, display: "inline-block" }} />
                Fighter B
              </span>
              <span className="flex items-center gap-1.5 text-[9px] font-black tracking-widest uppercase" style={{ color: "var(--color-chart-community)" }}>
                <span style={{ width: 16, height: 0, borderTop: "1.5px dashed var(--color-chart-community)", display: "inline-block" }} />
                Community
              </span>
            </div>
          </div>

          {/* Side B */}
          <div className="flex flex-col items-center gap-2" style={{ minWidth: 72 }}>
            <span className="text-[9px] font-black tracking-widest uppercase" style={{ color: colorB }}>Side B</span>
            {fighterB && <Avatar src={imgB} name={fighterB.name} color={colorB} extraCount={participantsB.length - 1} />}
            {fighterB && (
              <span className="text-[11px] font-black text-center leading-tight max-w-[80px]" style={{ color: colorB }}>
                {fighterB.name}
              </span>
            )}
            {fighterB && (
              <span className="text-[9px] text-center leading-tight max-w-[80px]" style={{ color: "var(--color-text-ghost)" }}>
                {fighterB.seriesName}
              </span>
            )}
            <div className="px-2.5 py-0.5 text-[10px] font-black tracking-widest"
              style={{ border: `1.5px solid ${outcomeBColor}`, color: outcomeBColor, background: `color-mix(in srgb, ${outcomeBColor} 12%, transparent)` }}>
              {outcomeBLabel}
            </div>
            <div className="px-2 py-0.5 text-[9px] font-black tracking-widest"
              style={{ border: `1px solid ${outcomeBColor}`, color: outcomeBColor, background: `color-mix(in srgb, ${outcomeBColor} 8%, transparent)`, whiteSpace: "nowrap" }}>
              {diffLabel}
            </div>
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
                  Fighter {communityEdge.winner.toUpperCase()}
                </p>
                <p className="text-2xl font-black leading-none"
                  style={{ color: communityEdge.winner === "a" ? colorA : colorB }}>
                  +{communityEdge.edgePercent}%
                </p>
                <p className="text-[9px] mt-1" style={{ color: "var(--color-text-ghost)" }}>
                  {communityEdge.voterCount} {communityEdge.voterCount === 1 ? "voter" : "voters"}
                </p>
              </>
            ) : (
              <p className="text-xs" style={{ color: "var(--color-text-ghost)" }}>No data yet</p>
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

        {/* Stat breakdown */}
        {communityStats.length > 0 && (
          <div className="px-5 py-4 space-y-3" style={{ borderTop: "1px solid var(--color-border)" }}>
            <div className="flex items-center justify-between text-[9px] font-black tracking-widest uppercase" style={{ color: "var(--color-text-ghost)" }}>
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
                    <div className="absolute top-0 bottom-0 w-0.5" style={{ left: `${commVal}%`, background: "var(--color-text-ghost)", opacity: 0.6 }} />
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
