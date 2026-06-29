"use client";

import { useState, useTransition, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";
import { addParticipantAction, removeParticipantAction } from "@/app/actions/admin-content";

type Participant = {
  id:          string;
  variantId:   string;
  variantName: string;
  entityName:  string;
  imageUrl:    string | null;
};

type VariantHit = {
  variantId:   string;
  variantName: string;
  entityName:  string;
  seriesName:  string;
  imageUrl:    string | null;
};

type SideProps = {
  matchupId:    string;
  side:         "a" | "b";
  participants: Participant[];
  color:        string;
};

function SideEditor({ matchupId, side, participants, color }: SideProps) {
  const router             = useRouter();
  const [query, setQuery]  = useState("");
  const [hits, setHits]    = useState<VariantHit[]>([]);
  const [err, setErr]      = useState<string | null>(null);
  const [pending, start]   = useTransition();
  const debounceRef        = useRef<ReturnType<typeof setTimeout> | null>(null);

  const search = useCallback((q: string) => {
    setQuery(q);
    setErr(null);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!q.trim() || q.length < 2) { setHits([]); return; }
    debounceRef.current = setTimeout(async () => {
      const res = await fetch(`/api/search/variants?q=${encodeURIComponent(q)}`);
      setHits(res.ok ? await res.json() : []);
    }, 250);
  }, []);

  function add(hit: VariantHit) {
    setQuery("");
    setHits([]);
    start(async () => {
      const res = await addParticipantAction(matchupId, hit.variantId, side);
      if (!res.ok) { setErr(res.error); return; }
      router.refresh();
    });
  }

  function remove(p: Participant) {
    start(async () => {
      const res = await removeParticipantAction(p.id, matchupId, side);
      if (!res.ok) { setErr(res.error); return; }
      router.refresh();
    });
  }

  return (
    <div className="space-y-3">
      <p className="text-[10px] font-black tracking-widest uppercase" style={{ color }}>
        Side {side.toUpperCase()}
      </p>

      {/* Chips */}
      <div className="flex flex-col gap-1.5">
        {participants.map((p) => (
          <div key={p.id} className="flex items-center gap-2 px-2.5 py-1.5"
            style={{ border: `1px solid ${color}44`, background: `${color}0d` }}>
            <div style={{ width: 26, height: 26, borderRadius: 4, overflow: "hidden", background: "var(--color-surface-hover)", flexShrink: 0 }}>
              {p.imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.imageUrl} alt={p.entityName} className="w-full h-full object-cover object-top" />
              )}
            </div>
            <span className="text-xs font-bold flex-1 truncate" style={{ color: "var(--color-text-base)" }}>
              {p.entityName}{p.variantName !== p.entityName ? ` (${p.variantName})` : ""}
            </span>
            <button onClick={() => remove(p)} disabled={pending}
              className="flex items-center justify-center w-5 h-5 shrink-0 opacity-60 hover:opacity-100 transition-opacity disabled:opacity-30"
              style={{ color: "var(--color-text-muted)" }} title="Remove">
              <X size={12} />
            </button>
          </div>
        ))}
      </div>

      {/* Search to add */}
      <div className="relative">
        <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
          style={{ color: "var(--color-text-ghost)" }} />
        <input
          type="text"
          value={query}
          onChange={(e) => search(e.target.value)}
          placeholder="Add fighter…"
          disabled={pending}
          className="w-full pl-7 pr-3 py-1.5 text-xs outline-none disabled:opacity-50"
          style={{ border: "1px solid var(--color-border)", background: "var(--color-bg)", color: "var(--color-text-base)" }}
        />
        {hits.length > 0 && (
          <div className="absolute z-10 left-0 right-0 top-full mt-1 py-1 shadow-xl"
            style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
            {hits.map((h) => (
              <button key={h.variantId} onClick={() => add(h)}
                className="w-full flex items-center gap-2 px-3 py-2 text-left text-xs hover:bg-[var(--color-surface-hover)] transition-colors">
                <div style={{ width: 22, height: 22, borderRadius: 3, overflow: "hidden", background: "var(--color-surface-hover)", flexShrink: 0 }}>
                  {h.imageUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={h.imageUrl} alt={h.entityName} className="w-full h-full object-cover object-top" />
                  )}
                </div>
                <span className="font-semibold truncate" style={{ color: "var(--color-text-base)" }}>
                  {h.entityName}{h.variantName !== h.entityName ? ` (${h.variantName})` : ""}
                </span>
                <span className="text-[10px] ml-auto shrink-0" style={{ color: "var(--color-text-ghost)" }}>{h.seriesName}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {err && <p className="text-xs" style={{ color: "#f87171" }}>{err}</p>}
    </div>
  );
}

type Props = {
  matchupId: string;
  sideA:     Participant[];
  sideB:     Participant[];
};

export function AdminParticipantEditor({ matchupId, sideA, sideB }: Props) {
  return (
    <div className="grid grid-cols-2 gap-6 p-4 rounded-lg" style={{ border: "1px solid var(--color-border)" }}>
      <SideEditor matchupId={matchupId} side="a" participants={sideA} color="var(--color-side-a)" />
      <SideEditor matchupId={matchupId} side="b" participants={sideB} color="var(--color-side-b)" />
    </div>
  );
}
