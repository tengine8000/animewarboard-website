export const dynamic = "force-dynamic";

import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus, Pencil, Trash2 } from "lucide-react";
import { db } from "@/db";
import { entities, categories } from "@/db/schema";
import { eq, asc, desc } from "drizzle-orm";
import { deleteCharacterAction } from "@/app/actions/admin-content";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Characters — Admin" };

const STATUS_COLOR: Record<string, string> = {
  approved: "#22c55e",
  pending:  "#f59e0b",
  rejected: "#ef4444",
};

export default async function AdminCharactersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const session = await auth();
  if ((session?.user as any)?.role !== "admin") redirect("/");

  const sp      = await searchParams;
  const deleted = sp.deleted === "1";

  const rows = await db
    .select({
      id:       entities.id,
      name:     entities.name,
      slug:     entities.slug,
      status:   entities.status,
      imageUrl: entities.imageUrl,
      series:   categories.name,
      createdAt: entities.createdAt,
    })
    .from(entities)
    .leftJoin(categories, eq(entities.categoryId, categories.id))
    .orderBy(desc(entities.createdAt));

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 flex-wrap">
        <Link href="/admin" style={{ color: "var(--color-text-muted)" }}>
          <ArrowLeft size={16} />
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-black tracking-tight">Characters</h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--color-text-muted)" }}>
            {rows.length} character{rows.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Link
          href="/admin/characters/new"
          className="flex items-center gap-2 text-sm font-bold px-4 py-2 rounded-lg"
          style={{ background: "var(--color-accent)", color: "#fff" }}
        >
          <Plus size={14} /> Add Character
        </Link>
      </div>

      {deleted && (
        <div className="text-sm px-4 py-3 rounded-lg" style={{ background: "color-mix(in srgb, #22c55e 12%, transparent)", border: "1px solid #22c55e40", color: "#22c55e" }}>
          Character deleted.
        </div>
      )}

      {/* Table */}
      <div style={{ border: "1px solid var(--color-border)", borderRadius: "10px", overflow: "hidden" }}>
        {rows.length === 0 ? (
          <p className="text-sm text-center py-12" style={{ color: "var(--color-text-muted)" }}>
            No characters yet. <Link href="/admin/characters/new" className="underline" style={{ color: "var(--color-accent)" }}>Add the first one.</Link>
          </p>
        ) : (
          <div className="divide-y" style={{ borderColor: "var(--color-border)" }}>
            {rows.map((row) => (
              <div key={row.id} className="flex items-center gap-3 px-4 py-3">
                {/* Avatar */}
                <div style={{
                  width: 36, height: 36, borderRadius: "50%",
                  background: "var(--color-surface-hover)",
                  overflow: "hidden", flexShrink: 0,
                }}>
                  {row.imageUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={row.imageUrl} alt={row.name} className="w-full h-full object-cover object-top" />
                  )}
                </div>

                {/* Name + series */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold truncate" style={{ color: "var(--color-text-base)" }}>
                    {row.name}
                  </p>
                  <p className="text-xs truncate" style={{ color: "var(--color-text-muted)" }}>
                    {row.series ?? "—"} · <span style={{ color: STATUS_COLOR[row.status] }}>{row.status}</span>
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  <Link
                    href={`/admin/characters/${row.id}/edit`}
                    className="flex items-center justify-center w-8 h-8 rounded-lg transition-colors"
                    style={{ color: "var(--color-text-muted)" }}
                    title="Edit"
                  >
                    <Pencil size={14} />
                  </Link>
                  <form action={deleteCharacterAction.bind(null, row.id)}>
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
