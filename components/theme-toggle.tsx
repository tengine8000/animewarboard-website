"use client";

import { useTheme } from "@/components/theme-provider";
import { Sun, Moon } from "lucide-react";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const isDark = theme === "dark";
  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="w-9 h-9 flex items-center justify-center rounded-lg border border-[var(--color-border)] hover:border-[var(--color-accent)] text-[var(--color-text-muted)] hover:text-[var(--color-accent)] transition-colors"
      title={isDark ? "Switch to light theme" : "Switch to dark theme"}
      suppressHydrationWarning
    >
      <span suppressHydrationWarning>{isDark ? <Sun size={16} /> : <Moon size={16} />}</span>
    </button>
  );
}
