import Link from "next/link";
import { Swords, Home, Users, Tv } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center space-y-8">

        {/* Big 404 */}
        <div className="relative">
          <p className="text-[120px] font-black leading-none text-[var(--color-border)] select-none">
            404
          </p>
          <div className="absolute inset-0 flex items-center justify-center">
            <Swords size={48} className="text-[var(--color-accent)]" />
          </div>
        </div>

        {/* Message */}
        <div className="space-y-2">
          <h1 className="text-2xl font-black tracking-tight">
            Page not found
          </h1>
          <p className="text-[var(--color-text-muted)] text-sm leading-relaxed">
            This page was either deleted, moved, or never existed.
            Use the links below to get back on track.
          </p>
        </div>

        {/* Navigation options */}
        <div className="grid grid-cols-3 gap-3">
          <Link
            href="/"
            className="flex flex-col items-center gap-2 p-4 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl hover:border-[var(--color-accent)] transition-colors group"
          >
            <Home size={20} className="text-[var(--color-text-muted)] group-hover:text-[var(--color-accent)] transition-colors" />
            <span className="text-xs font-semibold text-[var(--color-text-muted)] group-hover:text-[var(--color-text-base)] transition-colors">
              Home
            </span>
          </Link>
          <Link
            href="/battles"
            className="flex flex-col items-center gap-2 p-4 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl hover:border-[var(--color-accent)] transition-colors group"
          >
            <Swords size={20} className="text-[var(--color-text-muted)] group-hover:text-[var(--color-accent)] transition-colors" />
            <span className="text-xs font-semibold text-[var(--color-text-muted)] group-hover:text-[var(--color-text-base)] transition-colors">
              Battles
            </span>
          </Link>
          <Link
            href="/characters"
            className="flex flex-col items-center gap-2 p-4 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl hover:border-[var(--color-accent)] transition-colors group"
          >
            <Users size={20} className="text-[var(--color-text-muted)] group-hover:text-[var(--color-accent)] transition-colors" />
            <span className="text-xs font-semibold text-[var(--color-text-muted)] group-hover:text-[var(--color-text-base)] transition-colors">
              Characters
            </span>
          </Link>
        </div>

        {/* Back CTA */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white font-black px-6 py-3 rounded-xl text-sm tracking-wide transition-colors"
        >
          <Swords size={14} />
          Go Home
        </Link>
      </div>
    </div>
  );
}
