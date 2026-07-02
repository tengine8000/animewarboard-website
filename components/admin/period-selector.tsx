"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";

const PERIODS = [
  { label: "1D",  value: 1  },
  { label: "7D",  value: 7  },
  { label: "14D", value: 14 },
  { label: "30D", value: 30 },
  { label: "90D", value: 90 },
];

export function PeriodSelector({ active }: { active: number }) {
  const router      = useRouter();
  const pathname    = usePathname();
  const searchParams = useSearchParams();

  function select(v: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("period", String(v));
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex items-center gap-1 p-1"
      style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: 8, display: "inline-flex" }}>
      {PERIODS.map((p) => {
        const isActive = p.value === active;
        return (
          <button
            key={p.value}
            onClick={() => select(p.value)}
            className="text-[10px] font-black tracking-widest uppercase px-3 py-1.5 transition-all"
            style={{
              borderRadius:    6,
              background:      isActive ? "var(--color-accent)" : "transparent",
              color:           isActive ? "#fff" : "var(--color-text-ghost)",
            }}
          >
            {p.label}
          </button>
        );
      })}
    </div>
  );
}
