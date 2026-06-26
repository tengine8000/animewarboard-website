export const dynamic = "force-dynamic";

import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CheckCircle } from "lucide-react";
import { ImageUploadCrop } from "@/components/image-upload-crop";
import { createSeriesAction } from "@/app/actions/admin-content";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Add Series — Admin" };

export default async function AdminNewSeriesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const session = await auth();
  if ((session?.user as any)?.role !== "admin") redirect("/");

  const sp = await searchParams;
  const success = sp.success === "1";

  return (
    <div className="max-w-xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin" style={{ color: "var(--color-text-muted)" }}>
          <ArrowLeft size={16} />
        </Link>
        <h1 className="text-xl font-black tracking-tight">Add Series</h1>
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
          Series created successfully.{" "}
          <Link href="/admin/series/new" style={{ textDecoration: "underline" }}>
            Add another
          </Link>
        </div>
      )}

      <form action={createSeriesAction} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        <Field label="Series Name *">
          <input
            name="name"
            required
            placeholder="e.g. Dragon Ball Z"
            style={inputStyle}
          />
        </Field>

        <Field label="Description">
          <textarea
            name="description"
            rows={3}
            placeholder="Short description of the series…"
            style={{ ...inputStyle, resize: "vertical" }}
          />
        </Field>

        <ImageUploadCrop name="coverImage" uploadType="series" aspectRatio={16 / 9} label="Cover Image (16:9)" />

        <button type="submit" style={btnStyle}>
          Create Series
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
  letterSpacing: "0.02em",
  cursor: "pointer",
  border: "none",
};
