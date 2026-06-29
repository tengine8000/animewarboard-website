import Link from "next/link";
import { LogOut } from "lucide-react";
import { LogoMark } from "./logo-mark";
import { auth } from "@/auth";
import { ThemeToggle } from "./theme-toggle";
import { SearchTrigger } from "./search-modal";
import { MobileMenuButton } from "./mobile-menu";
import { NotificationBell } from "./notification-bell";
import { getUnreadNotificationCount } from "@/lib/queries";
import { signOutAction } from "@/app/actions/auth";

export async function Nav() {
  const session = await auth();
  const user = session?.user;
  const unreadCount = user?.id ? await getUnreadNotificationCount(user.id) : 0;

  return (
    <header className="fixed inset-x-0 top-0 z-40 border-b border-[var(--color-border)] bg-[var(--color-bg)] md:bg-[var(--color-bg)]/90 md:backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <LogoMark size={38} priority />
          <span className="font-black text-base tracking-tight hidden sm:block">
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

        {/* Search — icon always visible (mobile + desktop), opens full-screen modal */}
        <SearchTrigger />

        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle />

          {user && <NotificationBell initialCount={unreadCount} />}

          {/* Desktop auth — hidden on mobile (accessible via hamburger drawer) */}
          {user ? (
            <div className="hidden md:flex items-center gap-1">
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
                <span>{user.name ?? "Profile"}</span>
              </Link>
              <form action={signOutAction} suppressHydrationWarning>
                <button
                  type="submit"
                  title="Sign out"
                  className="flex items-center justify-center w-8 h-8 rounded-lg border border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text-base)] hover:border-[var(--color-accent)] transition-colors"
                >
                  <LogOut size={13} />
                </button>
              </form>
            </div>
          ) : (
            <div className="hidden md:flex items-center gap-2">
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

          {/* Mobile hamburger */}
          <MobileMenuButton user={user ? { name: user.name, email: user.email, image: user.image } : null} />
        </div>
      </div>
    </header>
  );
}
