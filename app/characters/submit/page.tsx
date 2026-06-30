export const dynamic = "force-dynamic";

import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CheckCircle, Lock } from "lucide-react";
import { ImageUploadCrop } from "@/components/image-upload-crop";
import { StatSlider } from "@/components/admin-stat-slider";
import { submitCharacterAction } from "@/app/actions/character-submit";
import { getAnimeSeries, getAnimeAttributes } from "@/lib/queries";
import { getUserPointSummary } from "@/lib/points";
import { SERGEANT_RANK_INDEX, RANK_COLORS, RANK_ICONS } from "@/lib/ranks";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Submit a Character" };

type Props = { searchParams: Promise<Record<string, string>> };

export default async function SubmitCharacterPage({ searchParams }: Props) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?returnTo=/characters/submit");

  const sp      = await searchParams;
  const success = sp.success === "1";
  const err     = sp.error ?? null;

  const [{ rankIndex, rank, xpToNext, nextRank }, series, attrs] = await Promise.all([
    getUserPointSummary(session.user.id),
    getAnimeSeries(),
    getAnimeAttributes(),
  ]);

  const rankColor = RANK_COLORS[rank];
  const rankIcon  = RANK_ICONS[rank];
  const locked    = rankIndex < SERGEANT_RANK_INDEX;

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "10px 12px",
    borderRadius: "8px",
    border: "1px solid var(--color-border)",
    background: "var(--color-surface)",
    color: "var(--color-text-base)",
    fontSize: "14px",
  };

  if (locked) {
    const sergeantColor = RANK_COLORS["Sergeant"];
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-6">
        <div className="flex items-center justify-center w-16 h-16 rounded-2xl mx-auto"
          style={{ background: `${sergeantColor}18`, border: `1px solid ${sergeantColor}40` }}>
          <Lock size={28} style={{ color: sergeantColor }} />
        </div>
        <div className="space-y-2">
          <p className="text-xs font-black tracking-widest uppercase" style={{ color: sergeantColor }}>
            Sergeant rank required
          </p>
          <h1 className="text-2xl font-black">Submit a Character</h1>
          <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
            Submitting characters is unlocked at{" "}
            <span className="font-bold" style={{ color: sergeantColor }}>Sergeant</span> rank.
            {xpToNext !== null && (
              <> You need <span className="font-bold">{xpToNext.toLocaleString()} more XP</span> to get there.</>
            )}
          </p>
        </div>
        <div className="flex items-center justify-center gap-2 text-sm px-5 py-3 rounded-xl inline-flex mx-auto"
          style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
          <span style={{ fontSize: 18 }}>{rankIcon}</span>
          <span className="font-bold" style={{ color: rankColor }}>Your rank: {rank}</span>
          {nextRank && (
            <span style={{ color: "var(--color-text-ghost)" }}>→ {nextRank}</span>
          )}
        </div>
        <div className="flex gap-3 justify-center pt-2">
          <Link href="/battles"
            className="px-5 py-2.5 rounded-lg text-sm font-bold"
            style={{ background: "var(--color-accent)", color: "#fff" }}>
            Earn XP in Battles
          </Link>
          <Link href="/ranks"
            className="px-5 py-2.5 rounded-lg text-sm font-bold"
            style={{ border: "1px solid var(--color-border)", color: "var(--color-text-muted)" }}>
            View All Ranks
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/characters" style={{ color: "var(--color-text-muted)" }}>
          <ArrowLeft size={16} />
        </Link>
        <div>
          <h1 className="text-xl font-black tracking-tight">Submit a Character</h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--color-text-muted)" }}>
            Your submission will be reviewed before going live.
          </p>
        </div>
        <div className="ml-auto flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full"
          style={{ background: `${rankColor}18`, color: rankColor, border: `1px solid ${rankColor}30` }}>
          <span>{rankIcon}</span> {rank}
        </div>
      </div>

      {success && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-bold"
          style={{ background: "color-mix(in srgb, #22c55e 12%, transparent)", border: "1px solid #22c55e40", color: "#22c55e" }}>
          <CheckCircle size={14} />
          Submitted! An admin will review it shortly.{" "}
          <Link href="/characters/submit" style={{ textDecoration: "underline" }}>Submit another</Link>
        </div>
      )}

      {err === "missing_fields" && (
        <p className="text-sm text-red-400 px-4 py-3 rounded-lg"
          style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
          Name and series are required.
        </p>
      )}

      <form action={submitCharacterAction} className="space-y-5">
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
          <input name="variantName" placeholder="Base (leave empty for default)" style={inputStyle} />
        </Field>

        <Field label="Bio">
          <textarea
            name="bio" rows={4}
            placeholder="Character description, abilities, background…"
            style={{ ...inputStyle, resize: "vertical" }}
          />
        </Field>

        <ImageUploadCrop
          name="imageUrl"
          uploadType="characters"
          aspectRatio={1}
          label="Character Portrait (1:1)"
          apiRoute="/api/upload"
        />

        {attrs.length > 0 && (
          <div className="space-y-3">
            <p className="text-[11px] font-black tracking-widest uppercase" style={{ color: "var(--color-text-ghost)" }}>
              Base Stats (0–100)
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {attrs.map((a) => (
                <StatSlider key={a.id} id={a.id} name={a.name} />
              ))}
            </div>
          </div>
        )}

        <button
          type="submit"
          className="w-full py-3 rounded-lg text-sm font-black tracking-wide text-white"
          style={{ background: "var(--color-accent)" }}
        >
          Submit for Review
        </button>
      </form>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[11px] font-black tracking-widest uppercase" style={{ color: "var(--color-text-ghost)" }}>
        {label}
      </label>
      {children}
    </div>
  );
}
