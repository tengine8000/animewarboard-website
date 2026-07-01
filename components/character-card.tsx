import Link from "next/link";
import Image from "next/image";

type Props = {
  entity: {
    id: string;
    name: string;
    slug: string;
    imageUrl: string | null;
    series: { name: string; slug: string };
  };
  compact?: boolean;
};

const SERIES_COLORS: Record<string, { bg: string; text: string }> = {
  naruto:      { bg: "#f97316", text: "#7c2d12" },
  bleach:      { bg: "#6366f1", text: "#1e1b4b" },
  "one-piece": { bg: "#ef4444", text: "#7f1d1d" },
  default:     { bg: "#8b5cf6", text: "#2e1065" },
};

function getSeriesColor(slug: string) {
  return SERIES_COLORS[slug] ?? SERIES_COLORS.default;
}

export function CharacterCard({ entity, compact = false }: Props) {
  const color = getSeriesColor(entity.series.slug);
  const initial = entity.name[0].toUpperCase();

  return (
    <Link
      href={`/characters/${entity.slug}`}
      className="group block bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl overflow-hidden hover:border-[var(--color-accent)] transition-all hover:shadow-md"
    >
      {/* Image / fallback */}
      <div className="aspect-square relative overflow-hidden" style={{ background: color.bg + "22" }}>
        {entity.imageUrl ? (
          <Image
            src={entity.imageUrl}
            alt={entity.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 17vw"
            className="object-cover object-top group-hover:scale-105 transition-transform duration-300"
            unoptimized={entity.imageUrl.startsWith("/uploads/")}
          />
        ) : (
          <div
            className="absolute inset-0 flex flex-col items-center justify-center gap-1"
            style={{ background: `linear-gradient(135deg, ${color.bg}33 0%, ${color.bg}11 100%)` }}
          >
            <span
              className="font-black leading-none select-none"
              style={{ fontSize: compact ? "2rem" : "2.5rem", color: color.bg, opacity: 0.9 }}
            >
              {initial}
            </span>
          </div>
        )}

        {/* Series badge — not a link (card is already wrapped in <a>) */}
        <div className="absolute bottom-1.5 left-1.5">
          <span
            className="text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wide"
            style={{ background: color.bg, color: "#fff" }}
          >
            {entity.series.name}
          </span>
        </div>
      </div>

      {/* Name */}
      <div className="px-2 py-1.5">
        <p className="font-bold text-xs text-[var(--color-text-base)] line-clamp-1 leading-tight">
          {entity.name}
        </p>
      </div>
    </Link>
  );
}
