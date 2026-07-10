"use client";

import { useEffect, useRef, useState } from "react";
import { Zap, X, TrendingUp } from "lucide-react";
import type { DailyLoginResult } from "@/app/actions/points";
import { RANK_COLORS, RANK_ICONS, type RankName } from "@/lib/ranks";

type ToastData = Extract<DailyLoginResult, { awarded: true }>;

const CLIP = "polygon(12px 0, calc(100% - 12px) 0, 100% 12px, 100% calc(100% - 12px), calc(100% - 12px) 100%, 12px 100%, 0 calc(100% - 12px), 0 12px)";

export function PointAwardToast() {
  const [visible, setVisible]         = useState(false);
  const [data, setData]               = useState<ToastData | null>(null);
  const timerRef                      = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [voteVisible, setVoteVisible] = useState(false);
  const [voteXp, setVoteXp]           = useState<number | null>(null);
  const voteTimerRef                  = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    function handler(e: Event) {
      const detail = (e as CustomEvent<ToastData>).detail;
      if (timerRef.current) clearTimeout(timerRef.current);
      setData(detail);
      setVisible(true);
      timerRef.current = setTimeout(() => setVisible(false), 6000);
    }
    window.addEventListener("awb:pointaward", handler);
    return () => window.removeEventListener("awb:pointaward", handler);
  }, []);

  useEffect(() => {
    function handler(e: Event) {
      const { amount } = (e as CustomEvent<{ amount: number }>).detail;
      if (voteTimerRef.current) clearTimeout(voteTimerRef.current);
      setVoteXp(amount);
      setVoteVisible(true);
      voteTimerRef.current = setTimeout(() => setVoteVisible(false), 6000);
    }
    window.addEventListener("awb:voteaward", handler);
    return () => window.removeEventListener("awb:voteaward", handler);
  }, []);

  if (!visible && !voteVisible) return null;

  if (voteVisible && voteXp !== null) {
    return (
      <>
        <style>{`
          @keyframes toastSlideIn {
            from { opacity: 0; transform: translateX(calc(100% + 16px)); }
            to   { opacity: 1; transform: translateX(0); }
          }
        `}</style>
        <div
          style={{
            position: "fixed",
            top: 72,
            right: 16,
            zIndex: 9999,
            clipPath: CLIP,
            background: "var(--color-border)",
            padding: "1px",
            minWidth: 280,
            maxWidth: "calc(100vw - 32px)",
            animation: "toastSlideIn 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
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
              boxShadow: "inset 0 0 0 1px rgba(34,197,94,0.3)",
            }}
          >
            <Zap size={16} style={{ color: "#22c55e", flexShrink: 0, marginTop: 1 }} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-black" style={{ color: "#22c55e" }}>
                +{voteXp} XP · Battle Vote!
              </p>
              <p className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>
                First vote reward
              </p>
            </div>
            <button
              onClick={() => setVoteVisible(false)}
              className="shrink-0 p-0.5 transition-opacity hover:opacity-60"
              style={{ color: "var(--color-text-ghost)" }}
            >
              <X size={14} />
            </button>
          </div>
        </div>
      </>
    );
  }

  if (!visible || !data) return null;

  const total     = data.dailyPoints + (data.signupBonus ?? 0) + (data.streakBonus ?? 0);
  const isFirst   = !!data.signupBonus;
  const isStreak  = !!data.streakBonus;
  const rankUp    = data.rankUp ?? null;
  const rankColor = rankUp ? (RANK_COLORS[rankUp as RankName] ?? "#22c55e") : "#22c55e";
  const rankIcon  = rankUp ? (RANK_ICONS[rankUp as RankName]  ?? "▪") : null;

  const headline = isFirst
    ? "Welcome to AnimeWarBoard!"
    : isStreak
    ? `${data.streak}-day streak!`
    : "Daily Login";

  return (
    <>
      <style>{`
        @keyframes toastSlideIn {
          from { opacity: 0; transform: translateX(calc(100% + 16px)); }
          to   { opacity: 1; transform: translateX(0); }
        }
      `}</style>

      <div
        style={{
          position: "fixed",
          top: 72,
          right: 16,
          zIndex: 9999,
          clipPath: CLIP,
          background: "var(--color-border)",
          padding: "1px",
          minWidth: 280,
          maxWidth: "calc(100vw - 32px)",
          display: "flex",
          flexDirection: "column",
          gap: 1,
          animation: "toastSlideIn 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      >
        {/* XP row */}
        <div
          style={{
            clipPath: CLIP,
            background: "var(--color-bg)",
            padding: "14px 18px",
            display: "flex",
            alignItems: "flex-start",
            gap: 12,
            boxShadow: "inset 0 0 0 1px rgba(34,197,94,0.3)",
          }}
        >
          <Zap size={16} style={{ color: "#22c55e", flexShrink: 0, marginTop: 1 }} />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-black" style={{ color: "#22c55e" }}>
              +{total} XP · {headline}
            </p>
            {(isFirst || isStreak) && (
              <p className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>
                {isFirst  && <span>+{data.signupBonus} signup bonus · </span>}
                <span>+{data.dailyPoints} daily login</span>
                {isStreak && <span> · +{data.streakBonus} streak</span>}
              </p>
            )}
          </div>
          <button
            onClick={() => setVisible(false)}
            className="shrink-0 p-0.5 transition-opacity hover:opacity-60"
            style={{ color: "var(--color-text-ghost)" }}
          >
            <X size={14} />
          </button>
        </div>

        {/* Rank up row */}
        {rankUp && (
          <div
            style={{
              background: "var(--color-bg)",
              padding: "10px 18px",
              display: "flex",
              alignItems: "center",
              gap: 10,
              boxShadow: `inset 0 0 0 1px ${rankColor}44`,
            }}
          >
            <TrendingUp size={14} style={{ color: rankColor, flexShrink: 0 }} />
            <span className="text-[11px] font-black tracking-wide" style={{ color: rankColor }}>
              Rank Up! {rankIcon} {rankUp}
            </span>
          </div>
        )}
      </div>
    </>
  );
}
