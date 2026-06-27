"use client";

import { useState } from "react";

export function CommentInput({ userInitial }: { userInitial: string }) {
  const [focused, setFocused] = useState(false);

  return (
    <div className="flex items-start gap-3">
      <div
        className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-xs font-black text-white mt-0.5"
        style={{ background: "var(--color-accent)" }}
      >
        {userInitial}
      </div>
      <div className="flex-1 space-y-2">
        <textarea
          rows={2}
          placeholder="Share your reasoning…"
          suppressHydrationWarning
          className="w-full text-sm px-3 py-2 resize-none outline-none transition-colors"
          style={{
            background: "var(--color-bg)",
            border: `1px solid ${focused ? "var(--color-accent)" : "var(--color-border)"}`,
            color: "var(--color-text-base)",
          }}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
        <button
          className="text-xs font-black px-4 py-1.5 transition-colors"
          style={{ background: "var(--color-accent)", color: "#fff" }}
        >
          Post Comment
        </button>
      </div>
    </div>
  );
}
