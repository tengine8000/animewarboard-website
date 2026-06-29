export const dynamic = "force-dynamic";

import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CheckCircle } from "lucide-react";
import { ImageUploadCrop } from "@/components/image-upload-crop";
import { StatSlider } from "@/components/admin-stat-slider";
import { createCharacterAction } from "@/app/actions/admin-content";
import { getAnimeSeries, getAnimeAttributes } from "@/lib/queries";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Add Character — Admin" };

export default async function AdminNewCharacterPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const session = await auth();
  if ((session?.user as any)?.role !== "admin") redirect("/");

  const sp = await searchParams;
  const success = sp.success === "1";

  const [series, attrs] = await Promise.all([getAnimeSeries(), getAnimeAttributes()]);

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin" style={{ color: "var(--color-text-muted)" }}>
          <ArrowLeft size={16} />
        </Link>
        <h1 className="text-xl font-black tracking-tight">Add Character</h1>
      </div>

      {success && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "12px 16px",
            borderRadius: "10px",
            background: "color-mix(in srgb, #22c55e 12%, transparent)",
            border: "1px solid #22c55e40",
            color: "#22c55e",
            fontSize: "13px",
            fontWeight: 700,
          }}
        >
          <CheckCircle size={14} />
          Character created and approved.{" "}
          <Link href="/admin/characters/new" style={{ textDecoration: "underline" }}>
            Add another
          </Link>
        </div>
      )}

      <form action={createCharacterAction} style={{ display: "flex", flexDirection: "column", gap: "22px" }}>

        {/* Basic info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Character Name *">
            <input name="name" required placeholder="e.g. Goku" style={inputStyle} />
          </Field>
          <Field label="Series *">
            <select name="categoryId" required style={inputStyle}>
              <option value="">Select series…</option>
              {series.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </Field>
        </div>

        <Field label="Variant Name">
          <input
            name="variantName"
            placeholder="Base (leave empty for default)"
            style={inputStyle}
          />
        </Field>

        <Field label="Bio">
          <textarea
            name="bio"
            rows={4}
            placeholder="Character description, abilities, background…"
            style={{ ...inputStyle, resize: "vertical" }}
          />
        </Field>

        {/* Image upload + crop */}
        <ImageUploadCrop
          name="imageUrl"
          uploadType="characters"
          aspectRatio={1}
          label="Character Portrait (1:1)"
        />

        {/* Base stats */}
        {attrs.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <p style={{ fontSize: "11px", fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--color-text-ghost)" }}>
              Base Stats (0–100)
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {attrs.map((a) => (
                <StatSlider key={a.id} id={a.id} name={a.name} />
              ))}
            </div>
          </div>
        )}

        <button type="submit" style={btnStyle}>
          Create Character
        </button>
      </form>
    </div>
  );
}


function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
      <label style={{ fontSize: "11px", fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--color-text-ghost)" }}>
        {label}
      </label>
      {children}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: "8px",
  border: "1px solid var(--color-border)",
  background: "var(--color-surface)",
  color: "var(--color-text-base)",
  fontSize: "14px",
};

const btnStyle: React.CSSProperties = {
  padding: "12px",
  borderRadius: "10px",
  background: "var(--color-accent)",
  color: "#fff",
  fontWeight: 900,
  fontSize: "14px",
  cursor: "pointer",
  border: "none",
};
