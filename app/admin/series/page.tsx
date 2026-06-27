export const dynamic = "force-dynamic";

import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus, Pencil, Trash2 } from "lucide-react";
import { db } from "@/db";
import { categories } from "@/db/schema";
import { eq, asc, isNull, and } from "drizzle-orm";
import { deleteSeriesAction } from "@/app/actions/admin-content";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Series — Admin" };

export default async function AdminSeriesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const session = await auth();
  if ((session?.user as any)?.role !== "admin") redirect("/");

  const sp      = await searchParams;
  const deleted = sp.deleted === "1";

  const [anime] = await db
    .select({ id: categories.id })
    .from(categories)
    .where(and(isNull(categories.parentId), eq(categories.slug, "anime")))
    .limit(1);

  const rows = anime
    ? await db
        .select()
        .from(categories)
        .where(eq(categories.parentId, anime.id))
        .orderBy(asc(categories.name))
    : [];

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center gap-3 flex-wrap">
        <Link href="/admin" style={{ color: "var(--color-text-muted)" }}>
          <ArrowLeft size={16} />
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-black tracking-tight">Anime Series</h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--color-text-muted)" }}>
            {rows.length} series
          </p>
        </div>
        <Link
          href="/admin/series/new"
          className="flex items-center gap-2 text-sm font-bold px-4 py-2 rounded-lg"
          style={{ background: "var(--color-accent)", color: "#fff" }}
        >
          <Plus size={14} /> Add Series
        </Link>
      </div>

      {deleted && (
        <div className="text-sm px-4 py-3 rounded-lg"
          style={{ background: "color-mix(in srgb, #22c55e 12%, transparent)", border: "1px solid #22c55e40", color: "#22c55e" }}>
          Series deleted.
        </div>
      )}

      <div style={{ border: "1px solid var(--color-border)", borderRadius: "10px", overflow: "hidden" }}>
        {rows.length === 0 ? (
          <p className="text-sm text-center py-12" style={{ color: "var(--color-text-muted)" }}>
            No series yet.{" "}
            <Link href="/admin/series/new" className="underline" style={{ color: "var(--color-accent)" }}>
              Add the first one.
            </Link>
          </p>
        ) : (
          <div className="divide-y" style={{ borderColor: "var(--color-border)" }}>
            {rows.map((row) => (
              <div key={row.id} className="flex items-center gap-3 px-4 py-3">
                {/* Cover */}
                <div style={{
                  width: 36, height: 36, borderRadius: "8px",
                  background: "var(--color-surface-hover)",
                  overflow: "hidden", flexShrink: 0,
                }}>
                  {row.coverImage && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={row.coverImage} alt={row.name} className="w-full h-full object-cover" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold truncate" style={{ color: "var(--color-text-base)" }}>
                    {row.name}
                  </p>
                  {row.description && (
                    <p className="text-xs truncate" style={{ color: "var(--color-text-muted)" }}>
                      {row.description}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <Link
                    href={`/admin/series/${row.id}/edit`}
                    className="flex items-center justify-center w-8 h-8 rounded-lg transition-colors"
                    style={{ color: "var(--color-text-muted)" }}
                    title="Edit"
                  >
                    <Pencil size={14} />
                  </Link>
                  <form action={deleteSeriesAction.bind(null, row.id)}>
                    <button
                      type="submit"
                      className="flex items-center justify-center w-8 h-8 rounded-lg transition-colors hover:text-red-400"
                      style={{ color: "var(--color-text-muted)" }}
                      title="Delete"
                      onClick={(e) => { if (!confirm(`Delete "${row.name}"? This cannot be undone.`)) e.preventDefault(); }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
