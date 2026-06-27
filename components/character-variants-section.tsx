"use client";

import { useState } from "react";
import Image from "next/image";
import { EntityStatsPanel } from "@/components/entity-stats-panel";
import type { RadarStat } from "@/lib/queries";
import type { RankName } from "@/lib/ranks";

type Variant = {
  id: string;
  name: string;
  imageUrl: string | null;
  isDefault: boolean;
};

type Props = {
  variants:          Variant[];
  entityName:        string;
  entityImage:       string | null;
  entitySlug:        string;
  seriesColor:       string;
  isLoggedIn:        boolean;
  userRank:          RankName | null;
  xpNeeded:          number | null;
  allEntityStats:    Record<string, RadarStat[]>;
  allCommunityStats: Record<string, RadarStat[]>;
  allUserStats:      Record<string, Record<string, number>>;
};

export function CharacterVariantsSection({
  variants, entityName, entityImage, entitySlug, seriesColor,
  isLoggedIn, userRank, xpNeeded,
  allEntityStats, allCommunityStats, allUserStats,
}: Props) {
  const defaultVariant = variants.find((v) => v.isDefault) ?? variants[0];
  const [selectedId, setSelectedId] = useState(defaultVariant?.id ?? "");

  const selected     = variants.find((v) => v.id === selectedId) ?? defaultVariant;
  const displayImage = selected?.imageUrl ?? entityImage;

  const entityStats    = allEntityStats[selectedId]    ?? [];
  const communityStats = allCommunityStats[selectedId] ?? [];
  const userStats      = allUserStats[selectedId]      ?? {};

  if (!selected) return null;

  return (
    <>
      {/* Variants — only shown when there's more than one */}
      {variants.length > 1 && (
        <section className="space-y-3">
          <h2 className="text-lg font-black">Forms &amp; Variants</h2>

          <div className="flex flex-wrap gap-2">
            {variants.map((v) => {
              const active = v.id === selectedId;
              return (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => setSelectedId(v.id)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm font-medium transition-colors ${
                    active
                      ? "border-[var(--color-accent)] text-[var(--color-accent)] bg-[var(--color-accent-bg)]"
                      : "border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[var(--color-border-muted)] hover:text-[var(--color-text-base)]"
                  }`}
                >
                  {v.imageUrl && (
                    <div className="relative w-5 h-5 rounded-full overflow-hidden shrink-0">
                      <Image src={v.imageUrl} alt={v.name} fill sizes="20px" className="object-cover" />
                    </div>
                  )}
                  {v.name}
                </button>
              );
            })}
          </div>

          {/* Active variant preview card */}
          <div
            className="flex items-center gap-4 p-4 rounded-2xl border"
            style={{ borderColor: `${seriesColor}44`, background: `${seriesColor}08` }}
          >
            <div className="relative w-14 h-14 rounded-xl overflow-hidden shrink-0"
              style={{ border: `1px solid ${seriesColor}44` }}>
              {displayImage ? (
                <Image src={displayImage} alt={selected.name} fill sizes="56px"
                  className="object-cover object-top" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xl font-black"
                  style={{ background: `${seriesColor}22`, color: seriesColor }}>
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
        </section>
      )}

      {/* Power Stats — key resets slider state when variant changes */}
      <section className="space-y-4">
        <h2 className="text-lg font-black">Power Stats</h2>
        <EntityStatsPanel
          key={selectedId}
          variantId={selectedId}
          entitySlug={entitySlug}
          entityStats={entityStats}
          communityStats={communityStats}
          userStats={userStats}
          isLoggedIn={isLoggedIn}
          userRank={userRank}
          xpNeeded={xpNeeded}
          seriesColor={seriesColor}
        />
      </section>
    </>
  );
}
