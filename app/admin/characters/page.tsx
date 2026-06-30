export const dynamic = "force-dynamic";

import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus, Pencil } from "lucide-react";
import { db } from "@/db";
import { entities, categories } from "@/db/schema";
import { eq, desc, ilike, and, asc, isNull } from "drizzle-orm";
import { deleteCharacterAction, approveEntityAction, rejectEntityAction } from "@/app/actions/admin-content";
import { AdminDeleteButton } from "@/components/admin-delete-button";
import { AdminReviewButtons } from "@/components/admin-review-buttons";
import { AdminSearchBar } from "@/components/admin-search-bar";
import { users } from "@/db/schema";
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

  const sp       = await searchParams;
  const deleted  = sp.deleted === "1";
  const q        = sp.q?.trim() ?? "";
  const status   = sp.status ?? "";
  const seriesId = sp.seriesId ?? "";

  const [animeParent] = await db
    .select({ id: categories.id })
    .from(categories)
    .where(and(isNull(categories.parentId), eq(categories.slug, "anime")))
    .limit(1);

  const [allSeries, rows] = await Promise.all([
    animeParent
      ? db.select({ id: categories.id, name: categories.name })
          .from(categories)
          .where(eq(categories.parentId, animeParent.id))
          .orderBy(asc(categories.name))
      : Promise.resolve([]),
    db
      .select({
        id:                entities.id,
        name:              entities.name,
        slug:              entities.slug,
        status:            entities.status,
        imageUrl:          entities.imageUrl,
        bio:               entities.bio,
        series:            categories.name,
        createdAt:         entities.createdAt,
        submitterUsername: users.username,
      })
      .from(entities)
      .leftJoin(categories, eq(entities.categoryId, categories.id))
      .leftJoin(users, eq(entities.createdBy, users.id))
      .where(and(
        q        ? ilike(entities.name, `%${q}%`)     : undefined,
        status   ? eq(entities.status, status as any) : undefined,
        seriesId ? eq(entities.categoryId, seriesId)  : undefined,
      ))
      .orderBy(desc(entities.createdAt)),
  ]);

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
            {rows.length} character{rows.length !== 1 ? "s" : ""}{(q || status || seriesId) ? " (filtered)" : ""}
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

      <AdminSearchBar
        placeholder="Search characters…"
        extraFilters={[
          {
            key: "status", label: "All statuses",
            value: status,
            options: [
              { value: "approved", label: "Approved" },
              { value: "pending",  label: "Pending"  },
              { value: "rejected", label: "Rejected" },
            ],
          },
          {
            key: "seriesId", label: "All series",
            value: seriesId,
            options: allSeries.map((s) => ({ value: s.id, label: s.name })),
          },
        ]}
      />

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
            {rows.map((row) =>
              row.status === "pending" ? (
                /* ── Expanded review card for pending submissions ── */
                <div key={row.id} className="p-4 space-y-3" style={{ borderLeft: `3px solid ${STATUS_COLOR.pending}` }}>
                  <div className="flex gap-4">
                    {/* Image */}
                    {row.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={row.imageUrl} alt={row.name}
                        style={{ width: 80, height: 80, borderRadius: 10, objectFit: "cover", objectPosition: "top", flexShrink: 0 }}
                      />
                    ) : (
                      <div style={{ width: 80, height: 80, borderRadius: 10, background: "var(--color-surface-hover)", flexShrink: 0 }} />
                    )}

                    {/* Details */}
                    <div className="flex-1 min-w-0 space-y-1">
                      <p className="font-black text-base" style={{ color: "var(--color-text-base)" }}>{row.name}</p>
                      <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                        {row.series ?? "Unknown series"}
                        {row.submitterUsername && (
                          <> · submitted by <Link href={`/u/${row.submitterUsername}`} className="hover:underline" style={{ color: "var(--color-accent)" }}>@{row.submitterUsername}</Link></>
                        )}
                      </p>
                      <span className="inline-block text-[10px] font-black tracking-widest uppercase px-2 py-0.5 rounded"
                        style={{ background: `${STATUS_COLOR.pending}18`, color: STATUS_COLOR.pending }}>
                        pending review
                      </span>
                    </div>
                  </div>

                  {row.bio && (
                    <p className="text-sm leading-relaxed" style={{ color: "var(--color-text-muted)" }}>
                      {row.bio}
                    </p>
                  )}

                  <div className="flex items-center justify-between pt-1">
                    <AdminReviewButtons
                      approveAction={approveEntityAction.bind(null, row.id)}
                      rejectAction={rejectEntityAction.bind(null, row.id)}
                      label={row.name}
                    />
                    <div className="flex items-center gap-1">
                      <Link
                        href={`/admin/characters/${row.id}/edit`}
                        className="flex items-center justify-center w-8 h-8 rounded-lg"
                        style={{ color: "var(--color-text-muted)" }}
                        title="Edit"
                      >
                        <Pencil size={14} />
                      </Link>
                      <AdminDeleteButton action={deleteCharacterAction.bind(null, row.id)} label={row.name} />
                    </div>
                  </div>
                </div>
              ) : (
                /* ── Compact row for approved / rejected ── */
                <div key={row.id} className="flex items-center gap-3 px-4 py-3">
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

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate" style={{ color: "var(--color-text-base)" }}>
                      {row.name}
                    </p>
                    <p className="text-xs truncate" style={{ color: "var(--color-text-muted)" }}>
                      {row.series ?? "—"} · <span style={{ color: STATUS_COLOR[row.status] }}>{row.status}</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <Link
                      href={`/admin/characters/${row.id}/edit`}
                      className="flex items-center justify-center w-8 h-8 rounded-lg transition-colors"
                      style={{ color: "var(--color-text-muted)" }}
                      title="Edit"
                    >
                      <Pencil size={14} />
                    </Link>
                    <AdminDeleteButton action={deleteCharacterAction.bind(null, row.id)} label={row.name} />
                  </div>
                </div>
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
}
