"use client";

import { useId } from "react";
import type { RadarStat } from "@/lib/queries";

type Props = {
  statsA:      RadarStat[];
  statsB:      RadarStat[];
  statsC?:     RadarStat[]; // community average — amber polygon
  colorA?:     string;
  colorB?:     string;
  size?:       number;
  showLabels?: boolean;
};

const SHORT: Record<string, string> = {
  speed:        "SPEED",
  strength:     "STR",
  durability:   "DUR",
  stamina:      "STAM",
  "battle-iq":  "IQ",
  range:        "RANGE",
  regeneration: "REGEN",
  hax:          "HAX",
  versatility:  "VERS",
};

function polarToXY(angleDeg: number, r: number, cx: number, cy: number) {
  const rad = (angleDeg - 90) * (Math.PI / 180);
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function buildPolygon(stats: RadarStat[], maxR: number, cx: number, cy: number, total: number) {
  if (stats.length === 0) return "";
  return stats
    .map((s, i) => {
      const angle = (i / total) * 360;
      const r     = (s.value / 100) * maxR;
      const { x, y } = polarToXY(angle, r, cx, cy);
      return `${x},${y}`;
    })
    .join(" ");
}

export function RadarChart({
  statsA,
  statsB,
  statsC = [],
  colorA = "var(--color-side-a)",
  colorB = "var(--color-side-b)",
  size = 260,
  showLabels = true,
}: Props) {
  const uid  = useId().replace(/:/g, "");
  const cx   = size / 2;
  const cy   = size / 2;
  const maxR = size * 0.38;
  const labelR = maxR + size * 0.1;
  const glowId = `rim-glow-${uid}`;

  const axes = statsA.length > 0 ? statsA : statsB.length > 0 ? statsB : statsC;
  const n    = axes.length;

  if (n === 0) {
    return (
      <div style={{ width: size, height: size, color: "var(--color-text-ghost)" }}
        className="flex items-center justify-center text-xs">
        No stats
      </div>
    );
  }

  const gridLevels = [0.25, 0.5, 0.75, 1.0];

  const axisLines = axes.map((_, i) => {
    const angle = (i / n) * 360;
    const outer = polarToXY(angle, maxR, cx, cy);
    return (
      <line key={i} x1={cx} y1={cy} x2={outer.x} y2={outer.y}
        stroke="var(--color-chart-grid)" strokeWidth={0.75} />
    );
  });

  // Inner grid polygons (dim) + outermost boundary (glowing rim)
  const gridPolygons = gridLevels.map((level, li) => {
    const points = axes
      .map((_, i) => {
        const angle = (i / n) * 360;
        const { x, y } = polarToXY(angle, maxR * level, cx, cy);
        return `${x},${y}`;
      })
      .join(" ");

    const isBoundary = li === gridLevels.length - 1;
    return (
      <polygon
        key={li}
        points={points}
        fill="none"
        stroke="var(--color-chart-grid)"
        strokeWidth={isBoundary ? 1.5 : 0.5}
        strokeOpacity={isBoundary ? 0.9 : 0.5}
        filter={isBoundary ? `url(#${glowId})` : undefined}
      />
    );
  });

  const polyA = buildPolygon(statsA, maxR, cx, cy, n);
  const polyB = buildPolygon(statsB, maxR, cx, cy, n);
  const polyC = statsC.length > 0 ? buildPolygon(statsC, maxR, cx, cy, n) : "";

  const labels = axes.map((stat, i) => {
    const angle = (i / n) * 360;
    const { x, y } = polarToXY(angle, labelR, cx, cy);
    const label = SHORT[stat.slug] ?? stat.slug.toUpperCase();
    let anchor: "middle" | "start" | "end" = "middle";
    const normAngle = ((angle % 360) + 360) % 360;
    if (normAngle > 15  && normAngle < 165) anchor = "start";
    else if (normAngle > 195 && normAngle < 345) anchor = "end";
    return (
      <text key={i} x={x} y={y} textAnchor={anchor} dominantBaseline="middle"
        fontSize={size * 0.038} fontWeight="700" letterSpacing="0.05em"
        fill="var(--color-text-base)"
        filter={`url(#${glowId})`}>
        {label}
      </text>
    );
  });

  return (
    <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size}
      className="overflow-visible" aria-hidden>

      <defs>
        {/* Subtle neutral glow — applied to boundary polygon and axis labels */}
        <filter id={glowId} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="1.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        {/* Radial gradient for community polygon — transparent core, white edge */}
        <radialGradient id={`comm-${uid}`} gradientUnits="userSpaceOnUse"
          cx={cx} cy={cy} r={maxR} fx={cx} fy={cy}>
          <stop offset="0%"   stopColor="#ffffff" stopOpacity="0.02" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0.18" />
        </radialGradient>
      </defs>

      {/* Grid — boundary gets the rim glow, inner rings stay dim */}
      {gridPolygons}
      {axisLines}

      {/* Community average — white with radial gradient fill */}
      {polyC && (
        <polygon points={polyC}
          fill={`url(#comm-${uid})`}
          stroke="#ffffff" strokeWidth={1.5} strokeOpacity={0.75}
          strokeDasharray="4 3" />
      )}

      {/* Fighter B — flat fill + crisp stroke, no glow */}
      {polyB && (
        <polygon points={polyB}
          fill={colorB} fillOpacity={0.18}
          stroke={colorB} strokeWidth={1.75} strokeOpacity={0.9} />
      )}

      {/* Fighter A — drawn on top of B */}
      {polyA && (
        <polygon points={polyA}
          fill={colorA} fillOpacity={0.22}
          stroke={colorA} strokeWidth={1.75} strokeOpacity={0.9} />
      )}

      {showLabels && labels}
    </svg>
  );
}
