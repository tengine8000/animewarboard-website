"use client";

import { useState, useTransition } from "react";
import { RadarChart } from "@/components/radar-chart";
import { submitEntityStatsAction } from "@/app/actions/entity-stats";
import { Info, Save, Lock } from "lucide-react";
import type { RadarStat } from "@/lib/queries";
import { SERGEANT_RANK_INDEX, RANKS, type RankName } from "@/lib/ranks";

const CLIP = "polygon(12px 0, calc(100% - 12px) 0, 100% 12px, 100% calc(100% - 12px), calc(100% - 12px) 100%, 12px 100%, 0 calc(100% - 12px), 0 12px)";
const GLOW_ACCENT = "inset 0 0 12px rgba(249,115,22,0.55), inset 0 0 30px rgba(249,115,22,0.25)";

const STATS: { slug: string; emoji: string; name: string; tip: string }[] = [
  { slug: "speed",        emoji: "⚡", name: "Speed",        tip: "Raw movement speed and reaction time" },
  { slug: "battle-iq",   emoji: "🧠", name: "Battle IQ",   tip: "In-fight intelligence and adaptability" },
  { slug: "strength",     emoji: "💪", name: "Strength",    tip: "Physical striking power and lifting force" },
  { slug: "stamina",      emoji: "❤️", name: "Stamina",     tip: "How long they can sustain peak performance" },
  { slug: "durability",   emoji: "🛡️", name: "Durability",  tip: "Ability to take damage and keep fighting" },
  { slug: "hax",          emoji: "✨", name: "Hax",         tip: "Broken or hard-to-counter abilities: reality warping, time manipulation, etc." },
  { slug: "range",        emoji: "🎯", name: "Range",       tip: "Maximum effective attack distance" },
  { slug: "regeneration", emoji: "✚",  name: "Regen",       tip: "Speed and extent of healing during battle" },
  { slug: "versatility",  emoji: "🌀", name: "Versatility", tip: "Breadth of fighting styles and adaptability" },
];

type Props = {
  variantId:      string;
  entitySlug:     string;
  entityStats:    RadarStat[];
  communityStats: RadarStat[];
  userStats:      Record<string, number>;
  isLoggedIn:     boolean;
  userRank:       RankName | null;
  xpNeeded:       number | null;
  seriesColor:    string;
};

function Tip({ text, children }: { text: string; children: React.ReactNode }) {
  return (
    <div className="relative group inline-flex">
      {children}
      <div
        className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-50 w-56 px-3 py-2 text-xs shadow-2xl"
        style={{
          background: "var(--color-bg)",
          border: "1px solid var(--color-accent)",
          color: "var(--color-text-muted)",
          boxShadow: GLOW_ACCENT,
          clipPath: CLIP,
        }}
      >
        {text}
      </div>
    </div>
  );
}

export function EntityStatsPanel({
  variantId, entitySlug, entityStats, communityStats, userStats, isLoggedIn, userRank, xpNeeded, seriesColor,
}: Props) {
  const userRankIndex = userRank ? RANKS.findIndex((r) => r.name === userRank) : -1;
  const canRate = isLoggedIn && userRankIndex >= SERGEANT_RANK_INDEX;

  function fireRankGate() {
    window.dispatchEvent(new CustomEvent("awb:rankgate", {
      detail: {
        required:  "Sergeant",
        current:   userRank ?? null,
        xpNeeded:  xpNeeded ?? null,
        isGuest:   !isLoggedIn,
      },
    }));
  }
  const axes = entityStats.length > 0 ? entityStats : communityStats;

  const [sliderValues, setSliderValues] = useState<Record<string, number>>(
    Object.fromEntries(
      axes.map((s) => [s.slug, userStats[s.slug] ?? entityStats.find((e) => e.slug === s.slug)?.value ?? 50])
    )
  );
  const [success, setSuccess]         = useState(false);
  const [pointsAwarded, setPointsAwarded] = useState(0);
  const [error, setError]             = useState<string | null>(null);
  const [isPending, startTx]          = useTransition();

  const sliderStatsA: RadarStat[] = axes.map((s) => ({
    ...s, value: sliderValues[s.slug] ?? 50,
  }));

  function handleSubmit() {
    setError(null);
    startTx(async () => {
      const result = await submitEntityStatsAction(variantId, entitySlug, sliderValues);
      if (result.ok) {
        setSuccess(true);
        setPointsAwarded(result.pointsAwarded ?? 0);
      } else {
        setError("Something went wrong. Try again.");
      }
    });
  }

  if (axes.length === 0) {
    return (
      <div className="py-12 text-center text-sm border border-dashed"
        style={{ borderColor: "var(--color-border)", color: "var(--color-text-muted)" }}>
        No stats seeded for this variant yet.
      </div>
    );
  }

  const ticks = "repeating-linear-gradient(to right, rgba(0,0,0,0.28) 0px, rgba(0,0,0,0.28) 1.5px, transparent 1.5px, transparent 10%)";

  return (
    <div className="space-y-6">
      {/* Chart */}
      <div className="flex flex-col items-center gap-3">
        <RadarChart
          statsA={canRate ? sliderStatsA : []}
          statsB={[]}
          statsC={entityStats}
          colorA="var(--color-accent)"
          size={280}
        />
        {/* Legend */}
        <div className="flex gap-4 flex-wrap justify-center">
          {entityStats.length > 0 && (
            <span className="flex items-center gap-2 text-[10px] font-bold tracking-wider uppercase"
              style={{ color: "var(--color-chart-community)" }}>
              <span style={{ width: 16, height: 0, borderTop: "1.5px dashed var(--color-chart-community)", display: "inline-block" }} />
              Base Stats
            </span>
          )}
          {canRate && (
            <span className="flex items-center gap-2 text-[10px] font-bold tracking-wider uppercase"
              style={{ color: "var(--color-accent)" }}>
              <span style={{ width: 16, height: 2, background: "var(--color-accent)", display: "inline-block" }} />
              Your Rating
            </span>
          )}
        </div>
      </div>

      {/* Base Stats — locked horizontal bars */}
      <div className="space-y-2">
        <p className="text-[10px] font-black tracking-widest uppercase mb-3"
          style={{ color: "var(--color-text-base)" }}>
          Base Stats
        </p>
        {STATS.filter((s) => entityStats.some((e) => e.slug === s.slug)).map((stat) => {
          const row = entityStats.find((e) => e.slug === stat.slug)!;
          return (
            <div key={stat.slug} className="flex items-center gap-3">
              <span className="text-sm w-5 text-center shrink-0 select-none leading-none">{stat.emoji}</span>
              <div className="flex items-center gap-1 shrink-0 w-16 sm:w-24">
                <span className="text-[10px] font-black tracking-wide uppercase"
                  style={{ color: "var(--color-text-muted)" }}>
                  {stat.name}
                </span>
                <Tip text={stat.tip}>
                  <Info size={9} style={{ color: "var(--color-text-ghost)", flexShrink: 0, cursor: "help" }} />
                </Tip>
              </div>
              <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "var(--color-border)" }}>
                <div style={{
                  width: `${row.value}%`,
                  height: "100%",
                  background: seriesColor,
                  transition: "width 0.4s",
                }} />
              </div>
              <span className="text-[10px] font-black w-7 text-right tabular-nums"
                style={{ color: seriesColor }}>
                {row.value}
              </span>
            </div>
          );
        })}
      </div>

      {/* Rate This Character — interactive sliders */}
      <div className="space-y-2 pt-2" style={{ borderTop: "1px solid var(--color-border)" }}>
        <div className="flex items-center justify-between mb-3">
          <p className="text-[10px] font-black tracking-widest uppercase"
            style={{ color: "var(--color-text-base)" }}>
            Rate This Character
          </p>
          {!isLoggedIn && (
            <span className="text-[10px]" style={{ color: "var(--color-text-ghost)" }}>
              Sign in to rate
            </span>
          )}
          {isLoggedIn && !canRate && (
            <span className="flex items-center gap-1 text-[10px]" style={{ color: "var(--color-text-ghost)" }}>
              <Lock size={9} />
              Sergeant rank required
            </span>
          )}
        </div>

        <div style={{ position: "relative" }}>
          {!canRate && (
            <div
              onClick={fireRankGate}
              style={{ position: "absolute", inset: 0, zIndex: 10, cursor: "pointer" }}
            />
          )}
        {STATS.filter((s) => axes.some((a) => a.slug === s.slug)).map((stat) => {
          const val = sliderValues[stat.slug] ?? 50;
          const gradient = `linear-gradient(to right, var(--color-accent) 0%, var(--color-accent) ${val}%, var(--color-border) ${val}%, var(--color-border) 100%)`;
          return (
            <div key={stat.slug} className="flex items-center gap-3 py-0.5">
              <span className="text-sm w-5 text-center shrink-0 select-none leading-none">{stat.emoji}</span>
              <div className="flex items-center gap-1 shrink-0 w-16 sm:w-24">
                <span className="text-[10px] font-black tracking-wide uppercase"
                  style={{ color: canRate ? "var(--color-text-muted)" : "var(--color-text-ghost)" }}>
                  {stat.name}
                </span>
                <Tip text={stat.tip}>
                  <Info size={9} style={{ color: "var(--color-text-ghost)", flexShrink: 0, cursor: "help" }} />
                </Tip>
              </div>
              <div className="relative flex-1" style={{ height: 20 }}>
                <div style={{
                  position: "absolute", left: 0, right: 0, height: 4,
                  top: "50%", transform: "translateY(-50%)",
                  borderRadius: 9999,
                  backgroundImage: `${ticks}, ${gradient}`,
                  pointerEvents: "none",
                }} />
                <input
                  type="range" min={0} max={100}
                  value={val}
                  disabled={!canRate || isPending}
                  onChange={(e) => {
                    setSuccess(false);
                    setSliderValues((p) => ({ ...p, [stat.slug]: Number(e.target.value) }));
                  }}
                  className="stat-slider"
                  style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", margin: 0, zIndex: 1 }}
                />
              </div>
              <span className="text-[10px] font-black w-7 text-right tabular-nums"
                style={{ color: canRate ? "var(--color-accent)" : "var(--color-text-ghost)" }}>
                {val}
              </span>
            </div>
          );
        })}
        </div>

        {canRate && (
          <div className="pt-3 flex items-center gap-3">
            <div style={{
              flex: 1,
              filter: "drop-shadow(0 0 2px rgba(249,115,22,0.6)) drop-shadow(0 0 4px rgba(249,115,22,0.4))",
            }}>
              <button
                onClick={handleSubmit}
                disabled={isPending || success}
                className="w-full flex items-center justify-center gap-2 font-black py-3 text-sm tracking-widest uppercase transition-all disabled:opacity-50"
                style={{ clipPath: CLIP, background: "var(--color-accent)", color: "#fff" }}
              >
                {isPending
                  ? <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  : <Save size={14} />}
                {isPending ? "Saving…" : success ? "Saved!" : "Submit Rating"}
              </button>
            </div>
          </div>
        )}

        {error && <p className="text-xs text-red-400 pt-1">{error}</p>}
        {success && (
          <p className="text-xs text-emerald-400 pt-1">
            Rating saved — community average updated.
            {pointsAwarded > 0 && ` +${pointsAwarded} XP earned!`}
          </p>
        )}
      </div>
    </div>
  );
}
