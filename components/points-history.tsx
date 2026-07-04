"use client";

import { useState, useEffect, useTransition } from "react";
import { getPointHistoryAction } from "@/app/actions/points";
import type { PointTxRow } from "@/lib/points";
import { ChevronLeft, ChevronRight, Zap } from "lucide-react";

const TYPE_LABELS: Record<string, string> = {
  all:                  "All",
  daily_login:          "Daily Login",
  signup_bonus:         "Signup Bonus",
  streak_bonus:         "Streak",
  vote_upvoted:         "Upvotes",
  comment_upvoted:      "Upvotes",
  battle_vote_received: "Battle Vote",
  entity_approved:      "Submission",
  flag_rewarded:        "Flag Reward",
  flag_dismissed:       "Flag Penalty",
  content_penalty:      "Penalty",
};

const DATE_OPTIONS = [
  { value: "all",  label: "All time" },
  { value: "7d",   label: "Last 7 days" },
  { value: "30d",  label: "Last 30 days" },
  { value: "90d",  label: "Last 90 days" },
] as const;

const PILL_TYPES = [
  "all", "daily_login", "streak_bonus", "signup_bonus", "vote_upvoted", "battle_vote_received",
];

function typeLabel(type: string) {
  return TYPE_LABELS[type] ?? type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function relativeDate(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins < 60)  return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 30)  return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function PointsHistory() {
  const [page,      setPage]      = useState(1);
  const [typeFilter, setTypeFilter] = useState("all");
  const [dateRange,  setDateRange]  = useState<"7d"|"30d"|"90d"|"all">("all");
  const [rows,      setRows]      = useState<PointTxRow[]>([]);
  const [total,     setTotal]     = useState(0);
  const [pageCount, setPageCount] = useState(1);
  const [pending,   startTransition] = useTransition();

  useEffect(() => {
    startTransition(async () => {
      const result = await getPointHistoryAction({
        page,
        type:      typeFilter === "all" ? undefined : typeFilter,
        dateRange: dateRange === "all"  ? undefined : dateRange,
      });
      if (result) {
        setRows(result.rows);
        setTotal(result.total);
        setPageCount(result.pageCount);
      }
    });
  }, [page, typeFilter, dateRange]);

  function changeFilter(t: string) {
    setTypeFilter(t);
    setPage(1);
  }

  function changeDate(d: typeof dateRange) {
    setDateRange(d);
    setPage(1);
  }

  return (
    <div className="space-y-3">
      {/* Type pills */}
      <div className="flex flex-wrap gap-2">
        {PILL_TYPES.map((t) => (
          <button
            key={t}
            onClick={() => changeFilter(t)}
            className="text-[11px] font-black tracking-widest uppercase px-3 py-1 transition-all"
            style={{
              clipPath: "polygon(6px 0, calc(100% - 6px) 0, 100% 6px, 100% calc(100% - 6px), calc(100% - 6px) 100%, 6px 100%, 0 calc(100% - 6px), 0 6px)",
              background: typeFilter === t ? "var(--color-accent)" : "var(--color-surface)",
              color: typeFilter === t ? "#fff" : "var(--color-text-muted)",
              border: "1px solid var(--color-border)",
            }}
          >
            {typeLabel(t)}
          </button>
        ))}
      </div>

      {/* Date range */}
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-black tracking-widest uppercase" style={{ color: "var(--color-text-ghost)" }}>
          Period:
        </span>
        <select
          value={dateRange}
          onChange={(e) => changeDate(e.target.value as typeof dateRange)}
          className="text-xs font-semibold px-2 py-1 outline-none cursor-pointer"
          style={{
            background: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            color: "var(--color-text-base)",
          }}
        >
          {DATE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <span className="text-[10px] ml-auto" style={{ color: "var(--color-text-ghost)" }}>
          {total.toLocaleString()} transaction{total !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Table */}
      <div
        style={{
          border: "1px solid var(--color-border)",
          opacity: pending ? 0.6 : 1,
          transition: "opacity 0.15s",
        }}
      >
        {rows.length === 0 && !pending ? (
          <p className="px-5 py-8 text-sm text-center" style={{ color: "var(--color-text-ghost)" }}>
            No transactions found.
          </p>
        ) : (
          rows.map((row, i) => (
            <div
              key={row.id}
              className="flex items-center gap-3 px-4 py-3"
              style={{ borderTop: i === 0 ? "none" : "1px solid var(--color-border)" }}
            >
              <Zap
                size={12}
                style={{ color: row.amount >= 0 ? "#22c55e" : "#ef4444", flexShrink: 0 }}
              />
              <span
                className="text-sm font-black w-14 shrink-0 tabular-nums"
                style={{ color: row.amount >= 0 ? "#22c55e" : "#ef4444" }}
              >
                {row.amount >= 0 ? "+" : ""}{row.amount} XP
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold truncate">{typeLabel(row.type)}</p>
                {row.note && (
                  <p className="text-[11px] truncate" style={{ color: "var(--color-text-ghost)" }}>{row.note}</p>
                )}
              </div>
              <span className="text-[11px] shrink-0 tabular-nums" style={{ color: "var(--color-text-ghost)" }}>
                {relativeDate(row.createdAt)}
              </span>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {pageCount > 1 && (
        <div className="flex items-center justify-between">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1 || pending}
            className="flex items-center gap-1 text-xs font-black disabled:opacity-30 transition-opacity"
            style={{ color: "var(--color-text-muted)" }}
          >
            <ChevronLeft size={14} /> Prev
          </button>
          <span className="text-[11px]" style={{ color: "var(--color-text-ghost)" }}>
            Page {page} of {pageCount}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
            disabled={page >= pageCount || pending}
            className="flex items-center gap-1 text-xs font-black disabled:opacity-30 transition-opacity"
            style={{ color: "var(--color-text-muted)" }}
          >
            Next <ChevronRight size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
