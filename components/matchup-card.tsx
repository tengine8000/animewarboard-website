import Link from "next/link";
import Image from "next/image";
import type { MatchupCard } from "@/lib/queries";
import { deriveSideLabel, computeVoteSummary } from "@/lib/queries";

function FighterThumb({ name, imageUrl }: { name: string; imageUrl: string | null }) {
  return (
    <div className="flex flex-col items-center gap-1.5 min-w-0">
      <div className="w-14 h-14 rounded-full bg-[var(--color-border)] overflow-hidden ring-2 ring-[var(--color-border)] shrink-0">
        {imageUrl ? (
          <Image src={imageUrl} alt={name} width={56} height={56} className="object-cover w-full h-full" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[var(--color-text-ghost)] font-bold text-lg">
            {name[0]}
          </div>
        )}
      </div>
      <span className="text-xs font-semibold text-[var(--color-text-base)] text-center leading-tight line-clamp-2 px-1">
        {name}
      </span>
    </div>
  );
}

export function MatchupCard({ matchup }: { matchup: MatchupCard }) {
  const { slug, sideA, sideB, sideALabel, sideBLabel, votes } = matchup;

  const labelA = deriveSideLabel(sideALabel, sideA);
  const labelB = deriveSideLabel(sideBLabel, sideB);
  const summary = computeVoteSummary(votes.aVotes, votes.bVotes, votes.drawVotes);

  const leadA = sideA[0];
  const leadB = sideB[0];

  return (
    <Link href={`/battles/${slug}`}
      className="group block bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl overflow-hidden hover:border-[var(--color-accent)] transition-all hover:shadow-lg hover:shadow-[var(--color-accent)]/5">

      {/* Fighter row */}
      <div className="p-4 grid grid-cols-[1fr_auto_1fr] gap-3 items-center">
        {/* Side A */}
        <div className="flex flex-col items-center gap-2">
          <FighterThumb
            name={leadA?.variant.name ?? labelA}
            imageUrl={leadA?.variant.imageUrl ?? leadA?.entity.imageUrl ?? null}
          />
          {sideA.length > 1 && (
            <span className="text-[10px] text-[var(--color-side-a)] font-semibold">
              +{sideA.length - 1} more
            </span>
          )}
        </div>

        {/* VS */}
        <div className="flex flex-col items-center gap-1">
          <span className="text-[var(--color-accent)] font-black text-lg tracking-widest">VS</span>
          {votes.total > 0 && (
            <span className="text-[10px] text-[var(--color-text-muted)]">
              {votes.total.toLocaleString()} predictions
            </span>
          )}
        </div>

        {/* Side B */}
        <div className="flex flex-col items-center gap-2">
          <FighterThumb
            name={leadB?.variant.name ?? labelB}
            imageUrl={leadB?.variant.imageUrl ?? leadB?.entity.imageUrl ?? null}
          />
          {sideB.length > 1 && (
            <span className="text-[10px] text-[var(--color-side-b)] font-semibold">
              +{sideB.length - 1} more
            </span>
          )}
        </div>
      </div>

      {/* Vote bar */}
      {votes.total > 0 ? (
        <div className="h-1.5 flex">
          <div
            className="bg-[var(--color-side-a)] transition-all"
            style={{ width: `${summary.aPercent}%` }}
          />
          <div
            className="bg-[var(--color-side-b)] transition-all"
            style={{ width: `${summary.bPercent}%` }}
          />
          {summary.drawPercent > 0 && (
            <div
              className="bg-[var(--color-text-muted)] transition-all"
              style={{ width: `${summary.drawPercent}%` }}
            />
          )}
        </div>
      ) : (
        <div className="h-1.5 bg-[var(--color-border)]" />
      )}

      {/* Footer: series badges */}
      <div className="px-4 py-2 flex items-center justify-between">
        <span className="text-[10px] text-[var(--color-text-muted)] truncate">
          {leadA?.series.name ?? "—"}
        </span>
        {summary.settled && (
          <span className="text-[9px] font-bold text-emerald-500 tracking-widest uppercase">Settled</span>
        )}
        {summary.contested && (
          <span className="text-[9px] font-bold text-amber-500 tracking-widest uppercase">Contested</span>
        )}
        <span className="text-[10px] text-[var(--color-text-muted)] truncate text-right">
          {leadB?.series.name ?? "—"}
        </span>
      </div>
    </Link>
  );
}
