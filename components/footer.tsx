import Link from "next/link";
import { LogoMark } from "./logo-mark";

const NAV_LINKS = [
  { label: "Battles",      href: "/battles" },
  { label: "Characters",   href: "/characters" },
  { label: "Anime",        href: "/anime" },
  { label: "Leaderboards", href: "/leaderboards" },
  { label: "Ranks",        href: "/ranks" },
];

const ACCOUNT_LINKS = [
  { label: "Sign In",   href: "/login" },
  { label: "Register",  href: "/register" },
  { label: "Profile",   href: "/profile" },
];

const LEGAL_LINKS = [
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Terms of Use",   href: "/terms" },
];

export function Footer() {
  return (
    <footer style={{ borderTop: "1px solid var(--color-border)", background: "var(--color-surface)" }}>
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 sm:gap-12">

          {/* Brand */}
          <div className="col-span-2 sm:col-span-1 flex flex-col gap-4">
            <Link href="/" className="flex items-center gap-2 font-black text-base tracking-tight w-fit">
              <LogoMark size={32} />
              <span>
                ANIME<span className="text-[var(--color-accent)]">WAR</span>BOARD
              </span>
            </Link>
            <p className="text-sm leading-relaxed" style={{ color: "var(--color-text-muted)", maxWidth: "220px" }}>
              Make your case. Settle the debate. The community-driven anime battle arena.
            </p>
            <p className="text-xs" style={{ color: "var(--color-text-ghost)" }}>
              © {new Date().getFullYear()} AnimeWarBoard
            </p>
          </div>

          {/* Explore */}
          <div className="flex flex-col gap-3">
            <p className="text-[10px] font-black tracking-widest uppercase" style={{ color: "var(--color-text-ghost)" }}>
              Explore
            </p>
            {NAV_LINKS.map((l) => (
              <Link key={l.href} href={l.href}
                className="text-sm transition-colors hover:text-[var(--color-accent)]"
                style={{ color: "var(--color-text-muted)" }}>
                {l.label}
              </Link>
            ))}
          </div>

          {/* Account */}
          <div className="flex flex-col gap-3">
            <p className="text-[10px] font-black tracking-widest uppercase" style={{ color: "var(--color-text-ghost)" }}>
              Account
            </p>
            {ACCOUNT_LINKS.map((l) => (
              <Link key={l.href} href={l.href}
                className="text-sm transition-colors hover:text-[var(--color-accent)]"
                style={{ color: "var(--color-text-muted)" }}>
                {l.label}
              </Link>
            ))}
          </div>

          {/* Legal + community tease */}
          <div className="flex flex-col gap-3">
            <p className="text-[10px] font-black tracking-widest uppercase" style={{ color: "var(--color-text-ghost)" }}>
              Legal
            </p>
            {LEGAL_LINKS.map((l) => (
              <Link key={l.href} href={l.href} prefetch={false}
                className="text-sm transition-colors hover:text-[var(--color-accent)]"
                style={{ color: "var(--color-text-muted)" }}>
                {l.label}
              </Link>
            ))}
            <div style={{ marginTop: "12px", paddingTop: "12px", borderTop: "1px solid var(--color-border)" }}>
              <p className="text-[10px] font-black tracking-widest uppercase mb-2" style={{ color: "var(--color-text-ghost)" }}>
                Community
              </p>
              <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                Power-scaling debates since 2026.
              </p>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 pt-6 flex flex-wrap items-center justify-between gap-4"
          style={{ borderTop: "1px solid var(--color-border)" }}>
          <p className="text-xs" style={{ color: "var(--color-text-ghost)" }}>
            All anime characters and series belong to their respective creators and studios. AnimeWarBoard is a fan community platform.
          </p>
          <div className="flex items-center gap-1 text-xs" style={{ color: "var(--color-text-ghost)" }}>
            <LogoMark size={13} />
            <span>Built for the community</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
