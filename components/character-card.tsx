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
};

export function CharacterCard({ entity }: Props) {
  return (
    <Link href={`/characters/${entity.slug}`}
      className="group block bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl overflow-hidden hover:border-[var(--color-accent)] transition-all hover:shadow-lg hover:shadow-[var(--color-accent)]/5">
      <div className="aspect-[3/4] bg-[var(--color-border)] relative overflow-hidden">
        {entity.imageUrl ? (
          <Image
            src={entity.imageUrl}
            alt={entity.name}
            fill
            className="object-cover object-top group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-5xl font-black text-[var(--color-text-ghost)]">
              {entity.name[0]}
            </span>
          </div>
        )}
        {/* Series badge */}
        <div className="absolute bottom-2 left-2">
          <Link href={`/anime/${entity.series.slug}`}
            onClick={(e) => e.stopPropagation()}
            className="text-[10px] font-semibold bg-black/60 backdrop-blur-sm text-white px-2 py-0.5 rounded-full hover:bg-[var(--color-accent)] transition-colors">
            {entity.series.name}
          </Link>
        </div>
      </div>
      <div className="p-3">
        <p className="font-bold text-sm text-[var(--color-text-base)] line-clamp-1">{entity.name}</p>
      </div>
    </Link>
  );
}
