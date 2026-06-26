"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Lock, X } from "lucide-react";
import { RANK_COLORS, type RankName } from "@/lib/ranks";

type RankGateEvent = {
  required: RankName;
  current:  RankName | null;
  xpNeeded: number | null;
};

const CLIP = "polygon(12px 0, calc(100% - 12px) 0, 100% 12px, 100% calc(100% - 12px), calc(100% - 12px) 100%, 12px 100%, 0 calc(100% - 12px), 0 12px)";

export function RankGateToast() {
  const [visible, setVisible]   = useState(false);
  const [data, setData]         = useState<RankGateEvent | null>(null);
  const timerRef                = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    function handler(e: Event) {
      const detail = (e as CustomEvent<RankGateEvent>).detail;
      // Debounce: reset the timer on rapid re-fires
      if (timerRef.current) clearTimeout(timerRef.current);
      setData(detail);
      setVisible(true);
      timerRef.current = setTimeout(() => setVisible(false), 4000);
    }
    window.addEventListener("awb:rankgate", handler);
    return () => window.removeEventListener("awb:rankgate", handler);
  }, []);

  if (!visible || !data) return null;

  const color = RANK_COLORS[data.required];

  return (
    <div
      style={{
        position: "fixed",
        bottom: 24,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 9999,
        clipPath: CLIP,
        background: "var(--color-border)",
        padding: "1px",
        minWidth: 300,
        maxWidth: "calc(100vw - 32px)",
        animation: "fadeInUp 0.2s ease",
      }}
    >
      <div
        style={{
          clipPath: CLIP,
          background: "var(--color-bg)",
          padding: "14px 18px",
          display: "flex",
          alignItems: "flex-start",
          gap: 12,
          boxShadow: `inset 0 0 0 1px ${color}44`,
        }}
      >
        <Lock size={16} style={{ color, flexShrink: 0, marginTop: 1 }} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-black" style={{ color }}>
            {data.required} rank required
          </p>
          <p className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>
            {data.xpNeeded !== null && data.xpNeeded > 0
              ? `You need ${data.xpNeeded.toLocaleString()} more XP to unlock this. `
              : "Earn more XP to unlock this. "}
            <Link href="/ranks" className="underline" style={{ color }} onClick={() => setVisible(false)}>
              See how to earn XP →
            </Link>
          </p>
        </div>
        <button
          onClick={() => setVisible(false)}
          className="shrink-0 p-0.5 transition-opacity hover:opacity-60"
          style={{ color: "var(--color-text-ghost)" }}
        >
          <X size={14} />
        </button>
      </div>
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0);   }
        }
      `}</style>
    </div>
  );
}
