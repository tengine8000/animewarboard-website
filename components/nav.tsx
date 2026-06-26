import Link from "next/link";
import { Swords, ChevronDown } from "lucide-react";
import { auth } from "@/auth";
import { ThemeToggle } from "./theme-toggle";
import { SearchBar } from "./search-bar";

export async function Nav() {
  const session = await auth();
  const user = session?.user;

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--color-border)] bg-[var(--color-bg)]/90 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0 font-black text-lg tracking-tight">
          <Swords size={20} className="text-[var(--color-accent)]" />
          <span>
            ANIME<span className="text-[var(--color-accent)]">WAR</span>BOARD
          </span>
        </Link>

        {/* Browse nav */}
        <nav className="hidden md:flex items-center gap-1 text-sm">
          <Link href="/anime"
            className="px-3 py-1.5 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-text-base)] hover:bg-[var(--color-surface-hover)] transition-colors">
            Anime
          </Link>
          <Link href="/characters"
            className="px-3 py-1.5 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-text-base)] hover:bg-[var(--color-surface-hover)] transition-colors">
            Characters
          </Link>
          <Link href="/battles"
            className="px-3 py-1.5 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-text-base)] hover:bg-[var(--color-surface-hover)] transition-colors">
            Battles
          </Link>
          <Link href="/ranks"
            className="px-3 py-1.5 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-text-base)] hover:bg-[var(--color-surface-hover)] transition-colors">
            Ranks
          </Link>
          <Link href="/leaderboards"
            className="px-3 py-1.5 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-text-base)] hover:bg-[var(--color-surface-hover)] transition-colors">
            Leaderboards
          </Link>
        </nav>

        {/* Search */}
        <div className="flex-1 max-w-xs hidden sm:block">
          <SearchBar />
        </div>

        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle />

          {user ? (
            <Link href="/profile"
              className="flex items-center gap-2 text-sm text-[var(--color-text-base)] px-3 py-1.5 rounded-lg border border-[var(--color-border)] hover:border-[var(--color-accent)] transition-colors">
              {user.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.image} alt={user.name ?? ""} className="w-5 h-5 rounded-full object-cover" />
              ) : (
                <span className="w-5 h-5 rounded-full bg-[var(--color-accent)] flex items-center justify-center text-white text-[10px] font-bold">
                  {(user.name ?? user.email ?? "?")[0].toUpperCase()}
                </span>
              )}
              <span className="hidden md:inline">{user.name ?? "Profile"}</span>
            </Link>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login"
                className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-base)] px-3 py-1.5 rounded-lg transition-colors">
                Sign In
              </Link>
              <Link href="/register"
                className="text-sm font-semibold bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white px-4 py-1.5 rounded-lg transition-colors">
                Join
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
