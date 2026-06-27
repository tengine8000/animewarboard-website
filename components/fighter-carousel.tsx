"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Participant } from "@/lib/queries";

type Props = {
  participants: Participant[];
  side: "a" | "b";
  label: string;
};

export function FighterCarousel({ participants, side, label }: Props) {
  const [idx, setIdx] = useState(0);
  const current = participants[idx];
  const isTeam = participants.length > 1;
  const sideColor = side === "a" ? "var(--color-side-a)" : "var(--color-side-b)";

  if (!current) {
    return (
      <div className="flex flex-col items-center gap-3">
        <div className="w-28 h-28 rounded-full bg-[var(--color-border)] flex items-center justify-center">
          <span className="text-4xl text-[var(--color-text-ghost)] font-black">?</span>
        </div>
        <span className="text-sm font-bold text-[var(--color-text-muted)]">TBD</span>
      </div>
    );
  }

  const imageUrl = current.variant.imageUrl ?? current.entity.imageUrl;

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Fighter image */}
      <div className="relative">
        <div
          className="w-28 h-28 rounded-full overflow-hidden"
          style={{ outline: `4px solid ${sideColor}`, outlineOffset: "2px" }}
        >
          {imageUrl ? (
            <Image src={imageUrl} alt={current.variant.name} fill sizes="(max-width: 640px) 50vw, 320px" className="object-cover object-top" />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center text-4xl font-black"
              style={{ color: sideColor }}
            >
              {current.entity.name[0]}
            </div>
          )}
        </div>

        {/* Team size badge */}
        {isTeam && (
          <div
            className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full text-[10px] font-bold text-white flex items-center justify-center"
            style={{ backgroundColor: sideColor }}
          >
            {participants.length}
          </div>
        )}
      </div>

      {/* Carousel controls */}
      {isTeam && (
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIdx((i) => (i - 1 + participants.length) % participants.length)}
            className="w-6 h-6 rounded-full border border-[var(--color-border)] hover:border-[var(--color-accent)] flex items-center justify-center transition-colors"
          >
            <ChevronLeft size={13} />
          </button>
          <div className="flex gap-1">
            {participants.map((_, i) => (
              <button
                key={i}
                onClick={() => setIdx(i)}
                className="w-1.5 h-1.5 rounded-full transition-colors"
                style={{ backgroundColor: i === idx ? sideColor : "var(--color-border)" }}
              />
            ))}
          </div>
          <button
            onClick={() => setIdx((i) => (i + 1) % participants.length)}
            className="w-6 h-6 rounded-full border border-[var(--color-border)] hover:border-[var(--color-accent)] flex items-center justify-center transition-colors"
          >
            <ChevronRight size={13} />
          </button>
        </div>
      )}

      {/* Name + series */}
      <div className="text-center">
        <p className="font-black text-sm tracking-tight" style={{ color: sideColor }}>
          {side === "a" ? "FIGHTER A" : "FIGHTER B"}
        </p>
        <Link href={`/characters/${current.entity.slug}`}
          className="font-bold text-base text-[var(--color-text-base)] hover:text-[var(--color-accent)] transition-colors">
          {current.variant.name}
        </Link>
        <p className="text-xs text-[var(--color-text-muted)] mt-0.5">{current.series.name}</p>
        {isTeam && (
          <p className="text-[10px] text-[var(--color-text-ghost)] mt-0.5">
            {idx + 1} / {participants.length}
          </p>
        )}
      </div>
    </div>
  );
}
