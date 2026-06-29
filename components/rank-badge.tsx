import { RANK_COLORS, type RankName } from "@/lib/ranks";
import { RankIcon } from "./rank-icons";

type Size = "xs" | "sm" | "md";

const SIZE_STYLES: Record<Size, { fontSize: number; iconSize: number; padding: string; gap: number }> = {
  xs: { fontSize: 8,  iconSize: 10, padding: "1px 5px",  gap: 3 },
  sm: { fontSize: 10, iconSize: 13, padding: "2px 7px",  gap: 4 },
  md: { fontSize: 12, iconSize: 15, padding: "3px 10px", gap: 5 },
};

export function RankBadge({ rank, size = "sm" }: { rank: RankName; size?: Size }) {
  const color = RANK_COLORS[rank];
  const s     = SIZE_STYLES[size];

  return (
    <span
      className="inline-flex items-center font-black tracking-widest uppercase rounded-full border shrink-0"
      style={{
        color,
        borderColor: `${color}66`,
        background:  `${color}14`,
        fontSize:    s.fontSize,
        padding:     s.padding,
        gap:         s.gap,
        lineHeight:  1,
      }}
    >
      <span className="inline-flex items-center shrink-0">
        <RankIcon rank={rank} size={s.iconSize} />
      </span>
      {rank}
    </span>
  );
}

export function ModBadge({ size = "xs" }: { size?: Size }) {
  const s = SIZE_STYLES[size];
  return (
    <span
      className="inline-flex items-center font-black tracking-widest uppercase rounded-full border shrink-0"
      style={{
        color:       "#f59e0b",
        borderColor: "#f59e0b66",
        background:  "#f59e0b14",
        fontSize:    s.fontSize,
        padding:     s.padding,
        lineHeight:  1,
      }}
    >
      MOD
    </span>
  );
}
