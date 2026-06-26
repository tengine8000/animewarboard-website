"use client";

import { useState, useTransition, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, X, Plus, Swords, AlertCircle } from "lucide-react";
import { createMatchupAction } from "@/app/actions/matchup";

type VariantHit = {
  variantId:    string;
  variantName:  string;
  entityName:   string;
  entitySlug:   string;
  seriesName:   string;
  imageUrl:     string | null;
};

type SidePanelProps = {
  side:      "a" | "b";
  selected:  VariantHit[];
  onAdd:     (v: VariantHit) => void;
  onRemove:  (variantId: string) => void;
  label:     string;
  onLabel:   (s: string) => void;
};

const SIDE_COLOR = { a: "var(--color-side-a)", b: "var(--color-side-b)" };

async function searchVariants(query: string): Promise<VariantHit[]> {
  if (!query.trim()) return [];
  const res = await fetch(`/api/search/variants?q=${encodeURIComponent(query)}`);
  if (!res.ok) return [];
  return res.json();
}

function CharacterChip({ hit, onRemove }: { hit: VariantHit; onRemove: () => void }) {
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 text-sm"
      style={{ background: "var(--color-surface-hover)", border: "1px solid var(--color-border)" }}>
      <span className="font-semibold" style={{ color: "var(--color-text-base)" }}>
        {hit.variantName !== hit.entityName ? `${hit.entityName} (${hit.variantName})` : hit.entityName}
      </span>
      <span className="text-[10px]" style={{ color: "var(--color-text-ghost)" }}>{hit.seriesName}</span>
      <button onClick={onRemove} className="ml-auto" style={{ color: "var(--color-text-ghost)" }}>
        <X size={12} />
      </button>
    </div>
  );
}

function SidePanel({ side, selected, onAdd, onRemove, label, onLabel }: SidePanelProps) {
  const [query,   setQuery]   = useState("");
  const [results, setResults] = useState<VariantHit[]>([]);
  const [loading, setLoading] = useState(false);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const color = SIDE_COLOR[side];

  function handleSearch(q: string) {
    setQuery(q);
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(async () => {
      if (!q.trim()) { setResults([]); return; }
      setLoading(true);
      const hits = await searchVariants(q);
      setResults(hits);
      setLoading(false);
    }, 250);
  }

  const selectedIds = new Set(selected.map((s) => s.variantId));

  return (
    <div className="flex-1 space-y-3">
      {/* Side header */}
      <div className="flex items-center gap-2 pb-2" style={{ borderBottom: `2px solid ${color}` }}>
        <span className="font-black text-sm tracking-widest uppercase" style={{ color }}>
          {side === "a" ? "Fighter A" : "Fighter B"}
        </span>
        {selected.length > 0 && (
          <span className="text-[10px] ml-auto" style={{ color: "var(--color-text-ghost)" }}>
            {selected.length} selected
          </span>
        )}
      </div>

      {/* Selected characters */}
      {selected.length > 0 && (
        <div className="space-y-1.5">
          {selected.map((hit) => (
            <CharacterChip key={hit.variantId} hit={hit} onRemove={() => onRemove(hit.variantId)} />
          ))}
        </div>
      )}

      {/* Optional team label (shown when 2+ selected) */}
      {selected.length >= 2 && (
        <input
          type="text" value={label}
          onChange={(e) => onLabel(e.target.value)}
          placeholder={`Team label (optional, e.g. "Konoha 12")`}
          className="w-full text-xs px-3 py-2 outline-none"
          style={{
            background: "var(--color-bg)",
            border: "1px solid var(--color-border)",
            color: "var(--color-text-base)",
          }}
        />
      )}

      {/* Search */}
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
          <Search size={13} style={{ color: "var(--color-text-ghost)" }} />
        </div>
        <input
          type="text" value={query}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search characters…"
          className="w-full pl-8 pr-3 py-2 text-sm outline-none"
          style={{
            background: "var(--color-bg)",
            border: `1px solid ${query ? color : "var(--color-border)"}`,
            color: "var(--color-text-base)",
          }}
        />
      </div>

      {/* Results dropdown */}
      {(results.length > 0 || loading) && (
        <div style={{ border: "1px solid var(--color-border)", background: "var(--color-surface)" }}>
          {loading ? (
            <p className="text-xs px-3 py-2" style={{ color: "var(--color-text-ghost)" }}>Searching…</p>
          ) : (
            results.map((hit) => {
              const alreadySelected = selectedIds.has(hit.variantId);
              return (
                <button
                  key={hit.variantId}
                  onClick={() => { if (!alreadySelected) { onAdd(hit); setQuery(""); setResults([]); } }}
                  disabled={alreadySelected}
                  className="w-full flex items-center justify-between px-3 py-2 text-sm text-left transition-colors disabled:opacity-40"
                  style={{ borderBottom: "1px solid var(--color-border)" }}
                >
                  <div>
                    <span className="font-semibold" style={{ color: "var(--color-text-base)" }}>
                      {hit.variantName !== hit.entityName
                        ? `${hit.entityName} (${hit.variantName})`
                        : hit.entityName}
                    </span>
                    <span className="text-[10px] ml-2" style={{ color: "var(--color-text-ghost)" }}>
                      {hit.seriesName}
                    </span>
                  </div>
                  {!alreadySelected && <Plus size={12} style={{ color: "var(--color-accent)", flexShrink: 0 }} />}
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

export function CreateMatchupForm() {
  const [sideA, setSideA] = useState<VariantHit[]>([]);
  const [sideB, setSideB] = useState<VariantHit[]>([]);
  const [labelA, setLabelA] = useState("");
  const [labelB, setLabelB] = useState("");
  const [error,  setError]  = useState<string | null>(null);
  const [isPending, start]  = useTransition();
  const router = useRouter();

  const addToA = useCallback((hit: VariantHit) => {
    setSideA((prev) => prev.find((h) => h.variantId === hit.variantId) ? prev : [...prev, hit]);
  }, []);
  const addToB = useCallback((hit: VariantHit) => {
    setSideB((prev) => prev.find((h) => h.variantId === hit.variantId) ? prev : [...prev, hit]);
  }, []);
  const removeFromA = useCallback((id: string) => setSideA((p) => p.filter((h) => h.variantId !== id)), []);
  const removeFromB = useCallback((id: string) => setSideB((p) => p.filter((h) => h.variantId !== id)), []);

  // Highlight characters selected on the other side (prevents duplicates)
  const sideAIds = new Set(sideA.map((h) => h.variantId));
  const sideBIds = new Set(sideB.map((h) => h.variantId));

  function handleSubmit() {
    if (sideA.length === 0 || sideB.length === 0) {
      setError("Both sides need at least one character.");
      return;
    }
    setError(null);
    start(async () => {
      const result = await createMatchupAction({
        sideAVariantIds: sideA.map((h) => h.variantId),
        sideBVariantIds: sideB.map((h) => h.variantId),
        sideALabel: labelA || undefined,
        sideBLabel: labelB || undefined,
      });
      if (result.ok) {
        router.push(`/battles/${result.slug}`);
      } else {
        setError(result.error);
      }
    });
  }

  const canSubmit = sideA.length > 0 && sideB.length > 0 && !isPending;

  return (
    <div className="space-y-6">
      {/* Sides */}
      <div className="flex gap-4 items-start">
        <SidePanel
          side="a" selected={sideA}
          onAdd={addToA} onRemove={removeFromA}
          label={labelA} onLabel={setLabelA}
        />
        <div className="pt-8 shrink-0">
          <div className="flex items-center justify-center w-8 h-8 rounded-full"
            style={{ background: "var(--color-border)" }}>
            <Swords size={14} style={{ color: "var(--color-text-ghost)" }} />
          </div>
        </div>
        <SidePanel
          side="b" selected={sideB}
          onAdd={addToB} onRemove={removeFromB}
          label={labelB} onLabel={setLabelB}
        />
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 text-sm text-red-400 py-2 px-3"
          style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
          <AlertCircle size={14} />
          {error}
        </div>
      )}

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={!canSubmit}
        className="w-full flex items-center justify-center gap-2 py-3.5 font-black text-sm tracking-widest uppercase transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        style={{
          background: canSubmit ? "var(--color-accent)" : "var(--color-border)",
          color: "#fff",
        }}
      >
        <Swords size={15} />
        {isPending ? "Creating Battle…" : "Create Battle"}
      </button>

      <p className="text-xs text-center" style={{ color: "var(--color-text-ghost)" }}>
        If this matchup already exists, you&apos;ll be redirected to it.
      </p>
    </div>
  );
}
