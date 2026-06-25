import Link from "next/link";
import { Swords } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Sign In" };

export default function LoginPage() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <Swords size={32} className="text-[var(--color-accent)]" />
          </div>
          <h1 className="text-2xl font-black tracking-tight">Welcome back</h1>
          <p className="text-sm text-[var(--color-text-muted)]">Sign in to submit predictions and earn rank.</p>
        </div>

        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-6 space-y-4">
          <form className="space-y-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">Email</label>
              <input
                type="email"
                name="email"
                placeholder="you@example.com"
                className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl px-4 py-2.5 text-sm text-[var(--color-text-base)] placeholder:text-[var(--color-text-ghost)] outline-none focus:border-[var(--color-accent)] transition-colors"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">Password</label>
              <input
                type="password"
                name="password"
                placeholder="••••••••"
                className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl px-4 py-2.5 text-sm text-[var(--color-text-base)] placeholder:text-[var(--color-text-ghost)] outline-none focus:border-[var(--color-accent)] transition-colors"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white font-black py-2.5 rounded-xl text-sm tracking-wide transition-colors">
              SIGN IN
            </button>
          </form>

          <div className="relative flex items-center gap-3">
            <div className="flex-1 h-px bg-[var(--color-border)]" />
            <span className="text-xs text-[var(--color-text-ghost)]">or continue with</span>
            <div className="flex-1 h-px bg-[var(--color-border)]" />
          </div>

          <div className="grid grid-cols-2 gap-2">
            {[
              { label: "Google",  href: "/api/auth/signin/google"  },
              { label: "Discord", href: "/api/auth/signin/discord" },
              { label: "Reddit",  href: "/api/auth/signin/reddit"  },
              { label: "X / Twitter", href: "/api/auth/signin/twitter" },
            ].map(({ label, href }) => (
              <Link key={label} href={href}
                className="flex items-center justify-center py-2 rounded-xl border border-[var(--color-border)] text-sm font-semibold text-[var(--color-text-muted)] hover:border-[var(--color-accent)] hover:text-[var(--color-text-base)] transition-colors">
                {label}
              </Link>
            ))}
          </div>
        </div>

        <p className="text-center text-sm text-[var(--color-text-muted)]">
          No account?{" "}
          <Link href="/register" className="text-[var(--color-accent)] font-semibold hover:underline">
            Join for free
          </Link>
        </p>
      </div>
    </div>
  );
}
