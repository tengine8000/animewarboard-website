"use client";

import { createContext, useContext, useEffect, useState } from "react";

type Ctx = { theme: string; setTheme: (t: string) => void };

const ThemeCtx = createContext<Ctx>({ theme: "dark", setTheme: () => {} });

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<string>("dark");

  useEffect(() => {
    try {
      const stored = localStorage.getItem("awb-theme") ?? "dark";
      setThemeState(stored);
    } catch {}
  }, []);

  function setTheme(t: string) {
    setThemeState(t);
    try { localStorage.setItem("awb-theme", t); } catch {}
    document.documentElement.classList.toggle("dark", t === "dark");
  }

  return <ThemeCtx.Provider value={{ theme, setTheme }}>{children}</ThemeCtx.Provider>;
}

export function useTheme(): Ctx {
  return useContext(ThemeCtx);
}
