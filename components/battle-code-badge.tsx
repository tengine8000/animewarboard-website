"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

export function BattleCodeBadge({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
    } catch {
      // fallback for older browsers
      const el = document.createElement("textarea");
      el.value = code;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      onClick={copy}
      title="Copy battle code"
      className="flex items-center gap-1.5 px-2.5 py-1 transition-colors"
      style={{
        border: "1px solid var(--color-border)",
        background: "var(--color-surface)",
        borderRadius: 6,
        cursor: "pointer",
      }}
    >
      <span
        className="text-[11px] font-black tracking-widest"
        style={{ color: "var(--color-accent)", fontVariantNumeric: "tabular-nums", letterSpacing: "0.08em" }}
      >
        {code}
      </span>
      {copied
        ? <Check size={11} style={{ color: "#4ade80" }} />
        : <Copy size={11} style={{ color: "var(--color-text-ghost)" }} />}
    </button>
  );
}
