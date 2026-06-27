export const dynamic = "force-dynamic";

import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CheckCircle } from "lucide-react";
import { db } from "@/db";
import { categories } from "@/db/schema";
import { eq } from "drizzle-orm";
import { updateSeriesAction } from "@/app/actions/admin-content";
import { ImageUploadCrop } from "@/components/image-upload-crop";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Edit Series — Admin" };

type Props = { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string>> };

export default async function EditSeriesPage({ params, searchParams }: Props) {
  const session = await auth();
  if ((session?.user as any)?.role !== "admin") redirect("/");

  const { id } = await params;
  const sp      = await searchParams;
  const success = sp.success === "1";
  const error   = sp.error;

  const [row] = await db
    .select()
    .from(categories)
    .where(eq(categories.id, id))
    .limit(1);

  if (!row) notFound();

  const updateAction = updateSeriesAction.bind(null, id);

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/series" style={{ color: "var(--color-text-muted)" }}>
          <ArrowLeft size={16} />
        </Link>
        <h1 className="text-xl font-black tracking-tight">Edit Series</h1>
      </div>

      {success && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-bold"
          style={{ background: "color-mix(in srgb, #22c55e 12%, transparent)", border: "1px solid #22c55e40", color: "#22c55e" }}>
          <CheckCircle size={15} /> Saved successfully.
        </div>
      )}
      {error && (
        <div className="px-4 py-3 rounded-lg text-sm"
          style={{ background: "color-mix(in srgb, #ef4444 12%, transparent)", border: "1px solid #ef444440", color: "#ef4444" }}>
          {error === "name_required" ? "Name is required." : "An error occurred."}
        </div>
      )}

      <form action={updateAction} className="space-y-5">
        <div>
          <label className="block text-xs font-black tracking-widest uppercase mb-1.5" style={{ color: "var(--color-text-muted)" }}>
            Name
          </label>
          <input name="name" defaultValue={row.name} required
            className="w-full px-3 py-2 rounded-lg text-sm"
            style={{ border: "1px solid var(--color-border)", background: "var(--color-surface)", color: "var(--color-text-base)" }} />
        </div>

        <div>
          <label className="block text-xs font-black tracking-widest uppercase mb-1.5" style={{ color: "var(--color-text-muted)" }}>
            Description
          </label>
          <textarea name="description" defaultValue={row.description ?? ""} rows={3}
            className="w-full px-3 py-2 rounded-lg text-sm resize-y"
            style={{ border: "1px solid var(--color-border)", background: "var(--color-surface)", color: "var(--color-text-base)" }} />
        </div>

        <div>
          <label className="block text-xs font-black tracking-widest uppercase mb-1.5" style={{ color: "var(--color-text-muted)" }}>
            Cover Image
          </label>
          <ImageUploadCrop name="coverImage" uploadType="series" currentUrl={row.coverImage ?? undefined} />
        </div>

        <div className="flex gap-3 pt-2">
          <button type="submit"
            className="px-6 py-2.5 rounded-lg text-sm font-black tracking-wide text-white"
            style={{ background: "var(--color-accent)" }}>
            Save Changes
          </button>
          <Link href="/admin/series"
            className="px-6 py-2.5 rounded-lg text-sm font-bold"
            style={{ border: "1px solid var(--color-border)", color: "var(--color-text-muted)" }}>
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
