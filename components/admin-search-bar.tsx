"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { Search, X } from "lucide-react";

type Filter = { key: string; value: string; label: string; options: { value: string; label: string }[] };

type Props = {
  placeholder?: string;
  extraFilters?: Filter[];
};

const inputStyle = {
  background: "var(--color-bg)",
  border: "1px solid var(--color-border)",
  color: "var(--color-text-base)",
  fontSize: 13,
  outline: "none",
  height: 36,
} as const;

export function AdminSearchBar({ placeholder = "Search…", extraFilters = [] }: Props) {
  const router      = useRouter();
  const pathname    = usePathname();
  const searchParams = useSearchParams();

  const update = useCallback((key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value); else params.delete(key);
    params.delete("deleted");
    router.push(`${pathname}?${params.toString()}`);
  }, [router, pathname, searchParams]);

  const q = searchParams.get("q") ?? "";
  const hasFilter = q || extraFilters.some((f) => searchParams.get(f.key));

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <div className="relative">
        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
          style={{ color: "var(--color-text-ghost)" }} />
        <input
          type="text"
          placeholder={placeholder}
          defaultValue={q}
          onChange={(e) => update("q", e.target.value)}
          className="pl-8 pr-3 text-sm"
          style={{ ...inputStyle, width: 220, padding: "7px 10px 7px 32px" }}
        />
      </div>

      {extraFilters.map((f) => (
        <select
          key={f.key}
          value={searchParams.get(f.key) ?? ""}
          onChange={(e) => update(f.key, e.target.value)}
          style={{ ...inputStyle, padding: "7px 10px" }}
        >
          <option value="">{f.label}</option>
          {f.options.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      ))}

      {hasFilter && (
        <button
          onClick={() => router.push(pathname)}
          className="flex items-center gap-1.5 text-xs font-bold px-3"
          style={{ ...inputStyle, padding: "7px 10px", color: "var(--color-text-ghost)" }}
        >
          <X size={12} /> Clear
        </button>
      )}
    </div>
  );
}
