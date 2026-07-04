import type { RankUpgradeRow } from "@/lib/points";
import { RANKS } from "@/lib/ranks";

function relativeDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

export function RankHistory({ rows }: { rows: RankUpgradeRow[] }) {
  if (rows.length === 0) {
    return (
      <p className="text-sm text-center py-6" style={{ color: "var(--color-text-ghost)" }}>
        No rank upgrades yet — keep earning XP!
      </p>
    );
  }

  return (
    <ol className="relative space-y-0" style={{ borderLeft: "2px solid var(--color-border)", marginLeft: 12 }}>
      {rows.map((row, i) => (
        <li key={row.id} className="relative pl-6 pb-5 last:pb-0">
          {/* Timeline dot */}
          <span
            className="absolute -left-[9px] top-0.5 flex items-center justify-center w-4 h-4 text-[10px] rounded-full font-black"
            style={{
              background: "var(--color-bg)",
              border: `2px solid ${row.color}`,
              color: row.color,
              boxShadow: `0 0 6px ${row.color}66`,
            }}
          >
            {row.icon}
          </span>

          <div className="flex items-baseline justify-between gap-2 flex-wrap">
            <span className="text-sm font-black" style={{ color: row.color }}>
              {row.rank}
            </span>
            <span className="text-[11px] tabular-nums" style={{ color: "var(--color-text-ghost)" }}>
              {relativeDate(row.achievedAt)}
            </span>
          </div>
          {i === rows.length - 1 && (
            <p className="text-[11px] mt-0.5" style={{ color: "var(--color-text-ghost)" }}>
              Current rank
            </p>
          )}
        </li>
      ))}

      {/* Show next rank to unlock if not at max */}
      {(() => {
        const lastRank = rows[rows.length - 1];
        const lastIdx  = RANKS.findIndex((r) => r.name === lastRank.rank);
        const nextRank = RANKS[lastIdx + 1] ?? null;
        if (!nextRank) return null;
        return (
          <li className="relative pl-6 pb-0 opacity-30">
            <span
              className="absolute -left-[9px] top-0.5 flex items-center justify-center w-4 h-4 rounded-full"
              style={{ background: "var(--color-border)", border: "2px dashed var(--color-border)" }}
            />
            <span className="text-sm font-black" style={{ color: "var(--color-text-ghost)" }}>
              {nextRank.name}
            </span>
            <p className="text-[11px] mt-0.5" style={{ color: "var(--color-text-ghost)" }}>
              Next rank
            </p>
          </li>
        );
      })()}
    </ol>
  );
}
