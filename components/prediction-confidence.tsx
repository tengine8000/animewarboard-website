"use client";

import { useState, useEffect } from "react";

function computeConfidence(verdict: string | null, statValues: Record<string, number>): number | null {
  if (!verdict) return null;
  const vals = Object.values(statValues);
  if (vals.length === 0) return null;

  if (verdict === "draw") {
    // High confidence when all sliders are near 50
    const avg = vals.reduce((s, v) => s + (1 - Math.abs(v - 50) / 50), 0) / vals.length;
    return Math.round(avg * 100);
  }
  if (verdict === "a") {
    // High confidence when sliders lean toward A (> 50)
    const avg = vals.reduce((s, v) => s + Math.max(0, v - 50) / 50, 0) / vals.length;
    return Math.round(avg * 100);
  }
  if (verdict === "b") {
    // High confidence when sliders lean toward B (< 50)
    const avg = vals.reduce((s, v) => s + Math.max(0, 50 - v) / 50, 0) / vals.length;
    return Math.round(avg * 100);
  }
  return null;
}

function Stars({ pct }: { pct: number }) {
  const filled = Math.max(1, Math.ceil(pct / 20));
  return (
    <div className="flex gap-0.5 mt-1">
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i} style={{ color: i < filled ? "var(--color-accent)" : "var(--color-text-ghost)", fontSize: 11 }}>
          ★
        </span>
      ))}
    </div>
  );
}

export function PredictionConfidence() {
  const [confidence, setConfidence] = useState<number | null>(null);

  useEffect(() => {
    const handler = (e: Event) => {
      const { verdict, statValues } = (e as CustomEvent).detail;
      setConfidence(computeConfidence(verdict, statValues));
    };
    window.addEventListener("battleformchange", handler);
    return () => window.removeEventListener("battleformchange", handler);
  }, []);

  if (confidence === null) {
    return (
      <>
        <p className="text-3xl font-black leading-none" style={{ color: "var(--color-text-dim)" }}>—</p>
        <p className="text-[10px] mt-1" style={{ color: "var(--color-text-ghost)" }}>Pick a verdict + move sliders</p>
      </>
    );
  }

  return (
    <>
      <p className="text-3xl font-black leading-none" style={{ color: "var(--color-accent)" }}>{confidence}%</p>
      <Stars pct={confidence} />
    </>
  );
}
