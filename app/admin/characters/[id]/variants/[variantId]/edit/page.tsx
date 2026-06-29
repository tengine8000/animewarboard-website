export const dynamic = "force-dynamic";

import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CheckCircle } from "lucide-react";
import { db } from "@/db";
import { entities, entityVariants, entityStats } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getAnimeAttributes } from "@/lib/queries";
import { updateVariantAction } from "@/app/actions/admin-content";
import { ImageUploadCrop } from "@/components/image-upload-crop";
import { StatSlider } from "@/components/admin-stat-slider";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Edit Variant — Admin" };

type Props = { params: Promise<{ id: string; variantId: string }>; searchParams: Promise<Record<string, string>> };

export default async function EditVariantPage({ params, searchParams }: Props) {
  const session = await auth();
  if ((session?.user as any)?.role !== "admin") redirect("/");

  const { id, variantId } = await params;
  const sp                 = await searchParams;
  const success            = sp.success === "1";

  const [[entity], [variant], existingStats, attrs] = await Promise.all([
    db.select({ id: entities.id, name: entities.name }).from(entities).where(eq(entities.id, id)).limit(1),
    db.select().from(entityVariants).where(eq(entityVariants.id, variantId)).limit(1),
    db.select({ attributeId: entityStats.attributeId, value: entityStats.value }).from(entityStats).where(eq(entityStats.variantId, variantId)),
    getAnimeAttributes(),
  ]);

  if (!entity || !variant) notFound();

  const statMap = Object.fromEntries(existingStats.map((s) => [s.attributeId, s.value]));
  const action  = updateVariantAction.bind(null, variantId, id);

  const fieldStyle = {
    border: "1px solid var(--color-border)",
    background: "var(--color-surface)",
    color: "var(--color-text-base)",
  } as const;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center gap-3">
        <Link href={`/admin/characters/${id}/edit`} style={{ color: "var(--color-text-muted)" }}>
          <ArrowLeft size={16} />
        </Link>
        <div>
          <h1 className="text-xl font-black tracking-tight">Edit Variant</h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--color-text-muted)" }}>
            {entity.name} · {variant.name}
          </p>
        </div>
      </div>

      {success && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-bold"
          style={{ background: "color-mix(in srgb, #22c55e 12%, transparent)", border: "1px solid #22c55e40", color: "#22c55e" }}>
          <CheckCircle size={15} /> Saved successfully.
        </div>
      )}
      {sp.error === "name_required" && (
        <div className="px-4 py-3 rounded-lg text-sm" style={{ background: "color-mix(in srgb, #ef4444 12%, transparent)", border: "1px solid #ef444440", color: "#ef4444" }}>
          Variant name is required.
        </div>
      )}

      <form action={action} className="space-y-5">
        <div>
          <label className="block text-xs font-black tracking-widest uppercase mb-1.5" style={{ color: "var(--color-text-muted)" }}>
            Variant Name
          </label>
          <input name="name" defaultValue={variant.name} required className="w-full px-3 py-2 rounded-lg text-sm" style={fieldStyle} />
        </div>

        <div>
          <label className="block text-xs font-black tracking-widest uppercase mb-1.5" style={{ color: "var(--color-text-muted)" }}>
            Image
          </label>
          <ImageUploadCrop name="imageUrl" uploadType="characters" currentUrl={variant.imageUrl ?? undefined} />
        </div>

        {attrs.length > 0 && (
          <div className="space-y-4">
            <p className="text-xs font-black tracking-widest uppercase" style={{ color: "var(--color-text-muted)" }}>
              Battle Stats
            </p>
            <div className="p-4 space-y-4 rounded-lg" style={{ border: "1px solid var(--color-border)" }}>
              {attrs.map((a) => (
                <StatSlider key={a.id} id={a.id} name={a.name} defaultValue={statMap[a.id] ?? 50} />
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <button type="submit" className="px-6 py-2.5 rounded-lg text-sm font-black tracking-wide text-white" style={{ background: "var(--color-accent)" }}>
            Save Changes
          </button>
          <Link href={`/admin/characters/${id}/edit`} className="px-6 py-2.5 rounded-lg text-sm font-bold"
            style={{ border: "1px solid var(--color-border)", color: "var(--color-text-muted)" }}>
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
