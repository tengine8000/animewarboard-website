export const dynamic = "force-dynamic";

import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CheckCircle, ExternalLink } from "lucide-react";
import { db } from "@/db";
import { matchups, matchupParticipants, entityVariants, entities } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { updateMatchupAction } from "@/app/actions/admin-content";
import { AdminParticipantEditor } from "@/components/admin-participant-editor";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Edit Battle — Admin" };

type Props = { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string>> };

export default async function EditBattlePage({ params, searchParams }: Props) {
  const session = await auth();
  if ((session?.user as any)?.role !== "admin") redirect("/");

  const { id } = await params;
  const sp      = await searchParams;
  const success = sp.success === "1";

  const [[matchup], participants] = await Promise.all([
    db.select().from(matchups).where(eq(matchups.id, id)).limit(1),
    db.select({
        id:          matchupParticipants.id,
        variantId:   matchupParticipants.variantId,
        side:        matchupParticipants.side,
        sortOrder:   matchupParticipants.sortOrder,
        variantName: entityVariants.name,
        entityName:  entities.name,
        imageUrl:    entityVariants.imageUrl,
      })
      .from(matchupParticipants)
      .innerJoin(entityVariants, eq(matchupParticipants.variantId, entityVariants.id))
      .innerJoin(entities, eq(entityVariants.entityId, entities.id))
      .where(eq(matchupParticipants.matchupId, id))
      .orderBy(matchupParticipants.side, asc(matchupParticipants.sortOrder)),
  ]);

  if (!matchup) notFound();

  const sideA = participants.filter((p) => p.side === "a");
  const sideB = participants.filter((p) => p.side === "b");
  const action = updateMatchupAction.bind(null, id);

  const fieldStyle = {
    border: "1px solid var(--color-border)",
    background: "var(--color-surface)",
    color: "var(--color-text-base)",
  } as const;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/battles" style={{ color: "var(--color-text-muted)" }}>
          <ArrowLeft size={16} />
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-black tracking-tight">Edit Battle</h1>
          <p className="text-xs font-mono mt-0.5" style={{ color: "var(--color-text-ghost)" }}>{matchup.slug}</p>
        </div>
        <Link href={`/battles/${matchup.slug}`} target="_blank"
          className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5"
          style={{ border: "1px solid var(--color-border)", color: "var(--color-text-muted)" }}>
          <ExternalLink size={12} /> View
        </Link>
      </div>

      {success && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-bold"
          style={{ background: "color-mix(in srgb, #22c55e 12%, transparent)", border: "1px solid #22c55e40", color: "#22c55e" }}>
          <CheckCircle size={15} /> Saved successfully.
        </div>
      )}

      {/* Participants — editable */}
      <div className="space-y-2">
        <p className="text-xs font-black tracking-widest uppercase" style={{ color: "var(--color-text-ghost)" }}>Participants</p>
        <AdminParticipantEditor matchupId={id} sideA={sideA} sideB={sideB} />
      </div>

      {/* Editable fields */}
      <form action={action} className="space-y-5">
        <div>
          <label className="block text-xs font-black tracking-widest uppercase mb-1.5" style={{ color: "var(--color-text-muted)" }}>
            Side A Label <span style={{ color: "var(--color-text-ghost)", fontWeight: 400 }}>(overrides character name)</span>
          </label>
          <input name="sideALabel" defaultValue={matchup.sideALabel ?? ""}
            placeholder="e.g. Team 7"
            className="w-full px-3 py-2 rounded-lg text-sm" style={fieldStyle} />
        </div>

        <div>
          <label className="block text-xs font-black tracking-widest uppercase mb-1.5" style={{ color: "var(--color-text-muted)" }}>
            Side B Label <span style={{ color: "var(--color-text-ghost)", fontWeight: 400 }}>(overrides character name)</span>
          </label>
          <input name="sideBLabel" defaultValue={matchup.sideBLabel ?? ""}
            placeholder="e.g. Akatsuki"
            className="w-full px-3 py-2 rounded-lg text-sm" style={fieldStyle} />
        </div>

        <div className="flex gap-3 pt-2">
          <button type="submit"
            className="px-6 py-2.5 rounded-lg text-sm font-black tracking-wide text-white"
            style={{ background: "var(--color-accent)" }}>
            Save Changes
          </button>
          <Link href="/admin/battles"
            className="px-6 py-2.5 rounded-lg text-sm font-bold"
            style={{ border: "1px solid var(--color-border)", color: "var(--color-text-muted)" }}>
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
