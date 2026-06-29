export const dynamic = "force-dynamic";

import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus, Pencil, ExternalLink } from "lucide-react";
import { db } from "@/db";
import { matchups, matchupParticipants, entityVariants, entities, votes } from "@/db/schema";
import { eq, desc, count, ilike, sql } from "drizzle-orm";
import { adminSettings } from "@/db/schema";
import { deleteMatchupAction } from "@/app/actions/admin-content";
import { AdminDeleteButton } from "@/components/admin-delete-button";
import { AdminSearchBar } from "@/components/admin-search-bar";
import { Pagination } from "@/components/pagination";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Battles — Admin" };

export default async function AdminBattlesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const session = await auth();
  if ((session?.user as any)?.role !== "admin") redirect("/");

  const sp      = await searchParams;
  const deleted = sp.deleted === "1";
  const q       = sp.q?.trim() ?? "";
  const page    = Math.max(1, parseInt(sp.page ?? "1", 10));

  const [perPageRow, [{ total }]] = await Promise.all([
    db.select({ value: adminSettings.value }).from(adminSettings).where(eq(adminSettings.key, "battles_per_page")).limit(1),
    db.select({ total: count() }).from(matchups).where(q ? ilike(matchups.slug, `%${q}%`) : undefined),
  ]);

  const perPage    = perPageRow[0]?.value ?? 20;
  const totalPages = Math.max(1, Math.ceil(Number(total) / perPage));
  const safePage   = Math.min(page, totalPages);
  const offset     = (safePage - 1) * perPage;

  // Get matchups with vote count + first participant name per side
  const rows = await db
    .select({
      id:         matchups.id,
      slug:       matchups.slug,
      sideALabel: matchups.sideALabel,
      sideBLabel: matchups.sideBLabel,
      createdAt:  matchups.createdAt,
      voteCount:  count(votes.id),
    })
    .from(matchups)
    .leftJoin(votes, eq(votes.matchupId, matchups.id))
    .where(q ? ilike(matchups.slug, `%${q}%`) : undefined)
    .groupBy(matchups.id)
    .orderBy(desc(matchups.createdAt))
    .limit(perPage)
    .offset(offset);

  // Fetch first side-A and side-B participant names for display
  const matchupIds = rows.map((r) => r.id);
  const participants = matchupIds.length > 0
    ? await db
        .select({
          matchupId:  matchupParticipants.matchupId,
          side:       matchupParticipants.side,
          entityName: entities.name,
          imageUrl:   entityVariants.imageUrl,
        })
        .from(matchupParticipants)
        .innerJoin(entityVariants, eq(matchupParticipants.variantId, entityVariants.id))
        .innerJoin(entities, eq(entityVariants.entityId, entities.id))
        .where(sql`${matchupParticipants.matchupId} = ANY(ARRAY[${sql.join(matchupIds.map((id) => sql`${id}::uuid`), sql`, `)}])`)
        .orderBy(matchupParticipants.sortOrder)
    : [];

  // Build lookup: matchupId → { a: name, b: name }
  const participantMap: Record<string, { a?: string; b?: string; aImg?: string | null; bImg?: string | null }> = {};
  for (const p of participants) {
    if (!participantMap[p.matchupId]) participantMap[p.matchupId] = {};
    const entry = participantMap[p.matchupId];
    if (p.side === "a" && !entry.a) { entry.a = p.entityName; entry.aImg = p.imageUrl; }
    if (p.side === "b" && !entry.b) { entry.b = p.entityName; entry.bImg = p.imageUrl; }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 flex-wrap">
        <Link href="/admin" style={{ color: "var(--color-text-muted)" }}>
          <ArrowLeft size={16} />
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-black tracking-tight">Battles</h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--color-text-muted)" }}>
            {Number(total).toLocaleString()} battle{Number(total) !== 1 ? "s" : ""}{q ? " (filtered)" : ""}
          </p>
        </div>
        <Link
          href="/battles/create"
          className="flex items-center gap-2 text-sm font-bold px-4 py-2 rounded-lg"
          style={{ background: "var(--color-accent)", color: "#fff" }}
        >
          <Plus size={14} /> Create Battle
        </Link>
      </div>

      <AdminSearchBar placeholder="Search by slug…" />

      {deleted && (
        <div className="text-sm px-4 py-3 rounded-lg"
          style={{ background: "color-mix(in srgb, #22c55e 12%, transparent)", border: "1px solid #22c55e40", color: "#22c55e" }}>
          Battle deleted.
        </div>
      )}

      {/* Table */}
      <div style={{ border: "1px solid var(--color-border)", borderRadius: "10px", overflow: "hidden" }}>
        {rows.length === 0 ? (
          <p className="text-sm text-center py-12" style={{ color: "var(--color-text-muted)" }}>
            No battles yet.{" "}
            <Link href="/battles/create" className="underline" style={{ color: "var(--color-accent)" }}>
              Create the first one.
            </Link>
          </p>
        ) : (
          <div className="divide-y" style={{ borderColor: "var(--color-border)" }}>
            {rows.map((row) => {
              const pm = participantMap[row.id] ?? {};
              const labelA = row.sideALabel ?? pm.a ?? "Side A";
              const labelB = row.sideBLabel ?? pm.b ?? "Side B";
              return (
                <div key={row.id} className="flex items-center gap-3 px-4 py-3">
                  {/* Fighter thumbnails */}
                  <div className="flex items-center gap-1 shrink-0">
                    {[pm.aImg, pm.bImg].map((img, i) => (
                      <div key={i} style={{ width: 30, height: 30, borderRadius: "6px", overflow: "hidden", background: "var(--color-surface-hover)" }}>
                        {img && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={img} alt="" className="w-full h-full object-cover object-top" />
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Names + slug */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate">
                      <span style={{ color: "var(--color-side-a)" }}>{labelA}</span>
                      <span className="mx-1.5" style={{ color: "var(--color-text-ghost)" }}>vs</span>
                      <span style={{ color: "var(--color-side-b)" }}>{labelB}</span>
                    </p>
                    <p className="text-xs font-mono truncate" style={{ color: "var(--color-text-ghost)" }}>
                      {row.slug} · {Number(row.voteCount).toLocaleString()} votes
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    <Link href={`/battles/${row.slug}`} target="_blank"
                      className="flex items-center justify-center w-8 h-8 rounded-lg"
                      style={{ color: "var(--color-text-muted)" }} title="View public page">
                      <ExternalLink size={13} />
                    </Link>
                    <Link href={`/admin/battles/${row.id}/edit`}
                      className="flex items-center justify-center w-8 h-8 rounded-lg"
                      style={{ color: "var(--color-text-muted)" }} title="Edit">
                      <Pencil size={13} />
                    </Link>
                    <AdminDeleteButton action={deleteMatchupAction.bind(null, row.id)} label={`${labelA} vs ${labelB}`} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Pagination
        page={safePage}
        totalPages={totalPages}
        buildHref={(p) => {
          const params = new URLSearchParams();
          if (q) params.set("q", q);
          if (p > 1) params.set("page", String(p));
          const qs = params.toString();
          return qs ? `/admin/battles?${qs}` : "/admin/battles";
        }}
      />
    </div>
  );
}
