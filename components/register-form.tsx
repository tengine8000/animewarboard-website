"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Swords, Loader2 } from "lucide-react";
import { registerAction } from "@/app/actions/auth";

const INPUT =
  "w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl px-4 py-2.5 text-sm text-[var(--color-text-base)] placeholder:text-[var(--color-text-ghost)] outline-none focus:border-[var(--color-accent)] transition-colors";

const RANKS = ["Private", "Corporal", "Sergeant", "Colonel", "Field Marshal"];

export function RegisterForm({ returnTo }: { returnTo?: string }) {
  const [state, formAction, pending] = useActionState(registerAction, null);

  return (
    <div className="w-full max-w-sm space-y-6">
      <div className="text-center space-y-2">
        <div className="flex justify-center">
          <Swords size={32} className="text-[var(--color-accent)]" />
        </div>
        <h1 className="text-2xl font-black tracking-tight">Join the community</h1>
        <p className="text-sm text-[var(--color-text-muted)]">
          Submit predictions. Earn rank. Settle debates.
        </p>
      </div>

      {/* Rank preview */}
      <div className="flex justify-center gap-2 flex-wrap">
        {RANKS.map((r, i) => (
          <span
            key={r}
            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
              i === 0
                ? "border-[var(--color-border)] text-[var(--color-text-ghost)]"
                : i === 4
                ? "border-[var(--color-gold)] text-[var(--color-gold)] bg-[var(--color-gold-muted)]"
                : "border-[var(--color-border)] text-[var(--color-text-muted)]"
            }`}
          >
            {r}
          </span>
        ))}
      </div>

      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-6 space-y-4">
        <form action={formAction} className="space-y-3">
          {returnTo && <input type="hidden" name="returnTo" value={returnTo} />}
          {state?.error && (
            <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2.5">
              {state.error}
            </p>
          )}

          <div className="space-y-1">
            <label className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
              Display Name
            </label>
            <input type="text" name="name" required minLength={2} placeholder="SaiyanGod99" className={INPUT} />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
              Email
            </label>
            <input type="email" name="email" required placeholder="you@example.com" className={INPUT} />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
              Password
            </label>
            <input
              type="password"
              name="password"
              required
              minLength={8}
              placeholder="••••••••  (min 8 chars)"
              className={INPUT}
            />
          </div>

          <button
            type="submit"
            disabled={pending}
            className="w-full bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] disabled:opacity-60 text-white font-black py-2.5 rounded-xl text-sm tracking-wide transition-colors flex items-center justify-center gap-2"
          >
            {pending ? <Loader2 size={14} className="animate-spin" /> : <Swords size={14} />}
            {pending ? "Creating account…" : "CREATE ACCOUNT"}
          </button>
        </form>

        <div className="relative flex items-center gap-3">
          <div className="flex-1 h-px bg-[var(--color-border)]" />
          <span className="text-xs text-[var(--color-text-ghost)]">or join with</span>
          <div className="flex-1 h-px bg-[var(--color-border)]" />
        </div>

        <div className="grid grid-cols-2 gap-2">
          {[
            { label: "Google",      href: "/api/auth/signin/google"  },
            { label: "Discord",     href: "/api/auth/signin/discord" },
            { label: "Reddit",      href: "/api/auth/signin/reddit"  },
            { label: "X / Twitter", href: "/api/auth/signin/twitter" },
          ].map(({ label, href }) => (
            <Link
              key={label}
              href={href}
              className="flex items-center justify-center py-2 rounded-xl border border-[var(--color-border)] text-sm font-semibold text-[var(--color-text-muted)] hover:border-[var(--color-accent)] hover:text-[var(--color-text-base)] transition-colors"
            >
              {label}
            </Link>
          ))}
        </div>
      </div>

      <p className="text-center text-sm text-[var(--color-text-muted)]">
        Already have an account?{" "}
        <Link href="/login" className="text-[var(--color-accent)] font-semibold hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
