"use client";

import { useState } from "react";

export function StatSlider({ id, name, defaultValue = 50 }: { id: string; name: string; defaultValue?: number }) {
  const [val, setVal] = useState(defaultValue);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <label
          htmlFor={`stat_${id}`}
          style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)" }}
        >
          {name}
        </label>
        <span style={{ fontSize: "11px", fontWeight: 900, color: "var(--color-accent)", minWidth: "28px", textAlign: "right" }}>
          {val}
        </span>
      </div>
      <input
        type="range"
        id={`stat_${id}`}
        name={`stat_${id}`}
        min={0}
        max={100}
        value={val}
        onChange={(e) => setVal(Number(e.target.value))}
        style={{ width: "100%", accentColor: "var(--color-accent)" }}
      />
    </div>
  );
}
