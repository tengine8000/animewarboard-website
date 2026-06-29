import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

type Props = {
  page:       number;
  totalPages: number;
  buildHref:  (page: number) => string;
};

export function Pagination({ page, totalPages, buildHref }: Props) {
  if (totalPages <= 1) return null;

  // Show up to 5 page numbers centred on current page
  const delta = 2;
  const start = Math.max(1, page - delta);
  const end   = Math.min(totalPages, page + delta);
  const pages = Array.from({ length: end - start + 1 }, (_, i) => start + i);

  const btn = (active: boolean) => ({
    display: "flex", alignItems: "center", justifyContent: "center",
    minWidth: 36, height: 36, padding: "0 10px",
    border: `1px solid ${active ? "var(--color-accent)" : "var(--color-border)"}`,
    background: active ? "var(--color-accent)" : "var(--color-surface)",
    color: active ? "#fff" : "var(--color-text-muted)",
    fontSize: 13, fontWeight: 700,
    borderRadius: 6,
    textDecoration: "none",
  } as const);

  return (
    <div className="flex items-center justify-center gap-1.5 pt-4">
      {page > 1 ? (
        <Link href={buildHref(page - 1)} style={btn(false)}><ChevronLeft size={14} /></Link>
      ) : (
        <span style={{ ...btn(false), opacity: 0.3, pointerEvents: "none" }}><ChevronLeft size={14} /></span>
      )}

      {start > 1 && (
        <>
          <Link href={buildHref(1)} style={btn(false)}>1</Link>
          {start > 2 && <span style={{ color: "var(--color-text-ghost)", fontSize: 13 }}>…</span>}
        </>
      )}

      {pages.map((p) => (
        <Link key={p} href={buildHref(p)} style={btn(p === page)}>{p}</Link>
      ))}

      {end < totalPages && (
        <>
          {end < totalPages - 1 && <span style={{ color: "var(--color-text-ghost)", fontSize: 13 }}>…</span>}
          <Link href={buildHref(totalPages)} style={btn(false)}>{totalPages}</Link>
        </>
      )}

      {page < totalPages ? (
        <Link href={buildHref(page + 1)} style={btn(false)}><ChevronRight size={14} /></Link>
      ) : (
        <span style={{ ...btn(false), opacity: 0.3, pointerEvents: "none" }}><ChevronRight size={14} /></span>
      )}
    </div>
  );
}
