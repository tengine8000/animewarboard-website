"use client";

import { useState, useRef, useEffect } from "react";
import { Search, X } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

type Result = {
  entities: { id: string; name: string; slug: string; imageUrl: string | null; series: { name: string } }[];
  series:   { id: string; name: string; slug: string }[];
};

export function SearchBar() {
  const [query,   setQuery]   = useState("");
  const [results, setResults] = useState<Result | null>(null);
  const [open,    setOpen]    = useState(false);
  const ref    = useRef<HTMLDivElement>(null);
  const timer  = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function onChange(val: string) {
    setQuery(val);
    if (timer.current) clearTimeout(timer.current);
    if (val.length < 2) { setResults(null); setOpen(false); return; }
    timer.current = setTimeout(async () => {
      const res = await fetch(`/api/search?q=${encodeURIComponent(val)}`);
      const data: Result = await res.json();
      setResults(data);
      setOpen(true);
    }, 250);
  }

  const hasResults = results && (results.entities.length > 0 || results.series.length > 0);

  return (
    <div ref={ref} className="relative w-full max-w-xs">
      <div className="flex items-center gap-2 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg px-3 py-2">
        <Search size={14} className="text-[var(--color-text-muted)] shrink-0" />
        <input
          value={query}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => results && setOpen(true)}
          placeholder="Search characters, anime…"
          className="bg-transparent text-sm text-[var(--color-text-base)] placeholder:text-[var(--color-text-muted)] outline-none w-full"
          suppressHydrationWarning
        />
        {query && (
          <button onClick={() => { setQuery(""); setResults(null); setOpen(false); }}>
            <X size={13} className="text-[var(--color-text-muted)] hover:text-[var(--color-text-base)]" />
          </button>
        )}
      </div>

      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl shadow-2xl overflow-hidden z-50">
          {!hasResults ? (
            <p className="text-sm text-[var(--color-text-muted)] px-4 py-3">No results for "{query}"</p>
          ) : (
            <>
              {results!.series.length > 0 && (
                <div>
                  <p className="text-[10px] font-semibold tracking-widest text-[var(--color-text-ghost)] uppercase px-4 pt-3 pb-1">Anime</p>
                  {results!.series.map((s) => (
                    <Link key={s.id} href={`/anime/${s.slug}`} onClick={() => setOpen(false)}
                      className="flex items-center gap-3 px-4 py-2 hover:bg-[var(--color-surface-hover)] transition-colors">
                      <span className="text-sm text-[var(--color-text-base)]">{s.name}</span>
                    </Link>
                  ))}
                </div>
              )}
              {results!.entities.length > 0 && (
                <div>
                  <p className="text-[10px] font-semibold tracking-widest text-[var(--color-text-ghost)] uppercase px-4 pt-3 pb-1">Characters</p>
                  {results!.entities.map((e) => (
                    <Link key={e.id} href={`/characters/${e.slug}`} onClick={() => setOpen(false)}
                      className="flex items-center gap-3 px-4 py-2 hover:bg-[var(--color-surface-hover)] transition-colors">
                      <div className="w-8 h-8 rounded-full bg-[var(--color-border)] overflow-hidden shrink-0">
                        {e.imageUrl && (
                          <Image src={e.imageUrl} alt={e.name} width={32} height={32} className="object-cover w-full h-full" unoptimized={e.imageUrl.startsWith("/uploads/")} />
                        )}
                      </div>
                      <div>
                        <p className="text-sm text-[var(--color-text-base)]">{e.name}</p>
                        <p className="text-xs text-[var(--color-text-muted)]">{e.series.name}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
