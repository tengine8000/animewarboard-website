"use client";

import { useState } from "react";
import Image from "next/image";

type Variant = {
  id: string;
  name: string;
  imageUrl: string | null;
  isDefault: boolean;
};

type Props = {
  variants: Variant[];
  entityName: string;
  entityImage: string | null;
  seriesColor: string;
};

export function VariantSelector({ variants, entityName, entityImage, seriesColor }: Props) {
  const defaultVariant = variants.find((v) => v.isDefault) ?? variants[0];
  const [selectedId, setSelectedId] = useState(defaultVariant?.id ?? "");

  if (variants.length <= 1) return null;

  const selected = variants.find((v) => v.id === selectedId) ?? defaultVariant;
  const displayImage = selected?.imageUrl ?? entityImage;

  return (
    <section className="space-y-3">
      <h2 className="text-lg font-black">Forms &amp; Variants</h2>

      <div className="flex flex-wrap gap-2">
        {variants.map((v) => {
          const active = v.id === selectedId;
          return (
            <button
              key={v.id}
              onClick={() => setSelectedId(v.id)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm font-medium transition-colors ${
                active
                  ? "border-[var(--color-accent)] text-[var(--color-accent)] bg-[var(--color-accent-bg)]"
                  : "border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[var(--color-border-muted)] hover:text-[var(--color-text-base)]"
              }`}
            >
              {v.imageUrl && (
                <Image
                  src={v.imageUrl}
                  alt={v.name}
                  width={20}
                  height={20}
                  className="rounded-full object-cover"
                />
              )}
              {v.name}
            </button>
          );
        })}
      </div>

      {/* Active variant preview */}
      {selected && (
        <div
          className="flex items-center gap-4 p-4 rounded-2xl border"
          style={{ borderColor: `${seriesColor}44`, background: `${seriesColor}08` }}
        >
          <div
            className="w-14 h-14 rounded-xl overflow-hidden shrink-0"
            style={{ border: `1px solid ${seriesColor}44` }}
          >
            {displayImage ? (
              <Image
                src={displayImage}
                alt={selected.name}
                width={56}
                height={56}
                className="object-cover object-top w-full h-full"
              />
            ) : (
              <div
                className="w-full h-full flex items-center justify-center text-xl font-black"
                style={{ background: `${seriesColor}22`, color: seriesColor }}
              >
                {entityName[0]}
              </div>
            )}
          </div>
          <div>
            <p className="font-black text-[var(--color-text-base)]">{selected.name}</p>
            <p className="text-xs text-[var(--color-text-muted)]">
              {selected.isDefault ? "Base / Default form" : "Alternate form"}
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
