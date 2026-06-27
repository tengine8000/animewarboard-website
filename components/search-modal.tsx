"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { Search, X } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

type Result = {
  entities: { id: string; name: string; slug: string; imageUrl: string | null; series: { name: string } }[];
  series:   { id: string; name: string; slug: string }[];
};

// ── Trigger button rendered inside the Nav ────────────────────────────────────

export function SearchTrigger() {
  const [open, setOpen] = useState(false);

  // Listen for ESC anywhere to close
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") setOpen(false); }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Open search"
        className="flex items-center justify-center w-9 h-9 rounded-lg border border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text-base)] hover:border-[var(--color-accent)] transition-colors"
      >
        <Search size={15} />
      </button>

      {open && typeof window !== "undefined" &&
        createPortal(<SearchModal onClose={() => setOpen(false)} />, document.body)}
    </>
  );
}

// ── Modal ─────────────────────────────────────────────────────────────────────

function SearchModal({ onClose }: { onClose: () => void }) {
  const [query,   setQuery]   = useState("");
  const [results, setResults] = useState<Result | null>(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const timer    = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-focus on open
  useEffect(() => { inputRef.current?.focus(); }, []);

  // Lock body scroll
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  const search = useCallback((val: string) => {
    setQuery(val);
    if (timer.current) clearTimeout(timer.current);
    if (val.length < 2) { setResults(null); setLoading(false); return; }
    setLoading(true);
    timer.current = setTimeout(async () => {
      try {
        const res  = await fetch(`/api/search?q=${encodeURIComponent(val)}`);
        const data: Result = await res.json();
        setResults(data);
      } finally {
        setLoading(false);
      }
    }, 250);
  }, []);

  const hasResults = results && (results.entities.length > 0 || results.series.length > 0);

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 9998,
        background: "rgba(0,0,0,0.75)",
        backdropFilter: "blur(4px)",
        WebkitBackdropFilter: "blur(4px)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        paddingTop: "80px",
        paddingLeft: "16px",
        paddingRight: "16px",
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ width: "100%", maxWidth: "600px" }}>
        {/* Input row */}
        <div
          style={{
            display: "flex", alignItems: "center", gap: "12px",
            background: "var(--color-surface)",
            border: "1px solid var(--color-accent)",
            borderRadius: "12px",
            padding: "12px 16px",
            boxShadow: "0 0 0 1px var(--color-accent-border), 0 0 24px rgba(249,115,22,0.2)",
          }}
        >
          <Search size={18} style={{ color: "var(--color-accent)", flexShrink: 0 }} />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => search(e.target.value)}
            placeholder="Search characters, anime, battles…"
            style={{
              flex: 1,
              background: "transparent",
              border: "none",
              outline: "none",
              fontSize: "16px",
              color: "var(--color-text-base)",
            }}
          />
          {query ? (
            <button onClick={() => search("")} style={{ color: "var(--color-text-muted)" }}>
              <X size={16} />
            </button>
          ) : (
            <button onClick={onClose} style={{ color: "var(--color-text-muted)" }}>
              <X size={16} />
            </button>
          )}
        </div>

        {/* Results */}
        {(loading || results) && (
          <div
            style={{
              marginTop: "8px",
              background: "var(--color-surface)",
              border: "1px solid var(--color-border)",
              borderRadius: "12px",
              overflow: "hidden",
              maxHeight: "60vh",
              overflowY: "auto",
            }}
          >
            {loading && (
              <p style={{ padding: "16px", fontSize: "13px", color: "var(--color-text-muted)", textAlign: "center" }}>
                Searching…
              </p>
            )}

            {!loading && results && !hasResults && (
              <p style={{ padding: "16px", fontSize: "13px", color: "var(--color-text-muted)" }}>
                No results for &ldquo;{query}&rdquo;
              </p>
            )}

            {!loading && hasResults && (
              <>
                {results!.series.length > 0 && (
                  <div>
                    <p style={{
                      fontSize: "10px", fontWeight: 700, letterSpacing: "0.1em",
                      color: "var(--color-text-ghost)", textTransform: "uppercase",
                      padding: "12px 16px 6px",
                    }}>
                      Anime
                    </p>
                    {results!.series.map((s) => (
                      <Link key={s.id} href={`/anime/${s.slug}`} onClick={onClose}
                        className="flex items-center gap-3 px-4 py-2.5 hover:bg-[var(--color-surface-hover)] transition-colors">
                        <span style={{ fontSize: "14px", color: "var(--color-text-base)" }}>{s.name}</span>
                      </Link>
                    ))}
                  </div>
                )}

                {results!.entities.length > 0 && (
                  <div>
                    <p style={{
                      fontSize: "10px", fontWeight: 700, letterSpacing: "0.1em",
                      color: "var(--color-text-ghost)", textTransform: "uppercase",
                      padding: "12px 16px 6px",
                      borderTop: results!.series.length > 0 ? "1px solid var(--color-border)" : undefined,
                    }}>
                      Characters
                    </p>
                    {results!.entities.map((e) => (
                      <Link key={e.id} href={`/characters/${e.slug}`} onClick={onClose}
                        className="flex items-center gap-3 px-4 py-2.5 hover:bg-[var(--color-surface-hover)] transition-colors">
                        <div style={{
                          width: 36, height: 36, borderRadius: "50%",
                          background: "var(--color-border)", overflow: "hidden", flexShrink: 0,
                        }}>
                          {e.imageUrl && (
                            <Image src={e.imageUrl} alt={e.name} width={36} height={36}
                              className="object-cover w-full h-full" />
                          )}
                        </div>
                        <div>
                          <p style={{ fontSize: "14px", color: "var(--color-text-base)", fontWeight: 600 }}>
                            {e.name}
                          </p>
                          <p style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>
                            {e.series.name}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        <p style={{ marginTop: "12px", textAlign: "center", fontSize: "11px", color: "var(--color-text-ghost)" }}>
          Press <kbd style={{ padding: "1px 5px", borderRadius: 4, border: "1px solid var(--color-border)", fontFamily: "inherit" }}>ESC</kbd> to close
        </p>
      </div>
    </div>
  );
}
