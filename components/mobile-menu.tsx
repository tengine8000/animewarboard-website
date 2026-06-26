"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, Swords, Zap, LogOut } from "lucide-react";
import { signOutAction } from "@/app/actions/auth";
import { SearchBar } from "./search-bar";

const NAV_LINKS = [
  { href: "/battles",      label: "Battles",      icon: "⚔" },
  { href: "/anime",        label: "Anime",        icon: "✦" },
  { href: "/characters",   label: "Characters",   icon: "◈" },
  { href: "/leaderboards", label: "Leaderboards", icon: "★" },
  { href: "/ranks",        label: "Ranks",        icon: "▪" },
];

type User = { name?: string | null; email?: string | null; image?: string | null };

export function MobileMenuButton({ user }: { user: User | null }) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => { setOpen(false); }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const initial = ((user?.name ?? user?.email ?? "?")[0]).toUpperCase();

  return (
    <>
      {/* Hamburger — visible on mobile only */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open navigation menu"
        className="md:hidden flex items-center justify-center rounded-lg transition-colors"
        style={{ color: "var(--color-text-muted)", border: "1px solid var(--color-border)", width: 44, height: 44, minWidth: 44 }}
      >
        <Menu size={18} />
      </button>

      {/* Backdrop + drawer rendered into document.body via portal.
          This escapes the <header>'s backdrop-filter stacking context,
          which would otherwise clip position:fixed children to 56px. */}
      {mounted && createPortal(
        <>
        <div
        aria-hidden="true"
        onClick={() => setOpen(false)}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 49,
          background: "rgba(0,0,0,0.65)",
          backdropFilter: "blur(2px)",
          opacity: open ? 1 : 0,
          pointerEvents: open ? "auto" : "none",
          transition: "opacity 280ms ease",
        }}
      />

      {/* Slide-in drawer */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          bottom: 0,
          width: "288px",
          zIndex: 50,
          display: "flex",
          flexDirection: "column",
          background: "var(--color-bg)",
          borderRight: "1px solid var(--color-border)",
          transform: open ? "translateX(0)" : "translateX(-100%)",
          transition: "transform 300ms cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      >
        {/* Drawer header */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 16px",
          height: "56px",
          borderBottom: "1px solid var(--color-border)",
          flexShrink: 0,
        }}>
          <Link
            href="/"
            onClick={() => setOpen(false)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontWeight: 900,
              fontSize: "15px",
              letterSpacing: "-0.02em",
            }}
          >
            <Swords size={17} style={{ color: "var(--color-accent)" }} />
            <span>ANIME<span style={{ color: "var(--color-accent)" }}>WAR</span>BOARD</span>
          </Link>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close menu"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "32px",
              height: "32px",
              borderRadius: "8px",
              color: "var(--color-text-muted)",
              border: "1px solid var(--color-border)",
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Search */}
        <div style={{ padding: "10px 12px", borderBottom: "1px solid var(--color-border)" }}>
          <SearchBar />
        </div>

        {/* Nav links */}
        <nav style={{ flex: 1, padding: "8px", overflowY: "auto" }}>
          <p style={{
            fontSize: "9px",
            fontWeight: 900,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            padding: "12px 16px 6px",
            color: "var(--color-text-ghost)",
          }}>
            Browse
          </p>
          {NAV_LINKS.map(({ href, label, icon }) => {
            const isActive = pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: "11px 16px",
                  borderRadius: "10px",
                  fontSize: "14px",
                  fontWeight: 700,
                  color: isActive ? "var(--color-accent)" : "var(--color-text-muted)",
                  background: isActive ? "color-mix(in srgb, var(--color-accent) 10%, transparent)" : "transparent",
                  marginBottom: "2px",
                }}
              >
                <span style={{ fontSize: "16px", width: "20px", textAlign: "center", flexShrink: 0 }}>
                  {icon}
                </span>
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Auth section */}
        <div style={{ padding: "12px 16px", borderTop: "1px solid var(--color-border)", flexShrink: 0 }}>
          {user ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <Link
                href="/profile"
                onClick={() => setOpen(false)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "10px 14px",
                  borderRadius: "10px",
                  border: "1px solid var(--color-border)",
                  fontSize: "14px",
                  fontWeight: 700,
                  color: "var(--color-text-base)",
                }}
              >
                {user.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={user.image} alt={user.name ?? ""} style={{ width: 28, height: 28, borderRadius: "50%", objectFit: "cover" }} />
                ) : (
                  <span style={{
                    width: 28, height: 28, borderRadius: "50%",
                    background: "var(--color-accent)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: "#fff", fontSize: "11px", fontWeight: 900, flexShrink: 0,
                  }}>
                    {initial}
                  </span>
                )}
                <span>{user.name ?? "Profile"}</span>
                <span style={{ marginLeft: "auto", fontSize: "11px", color: "var(--color-text-ghost)" }}>
                  <Zap size={11} />
                </span>
              </Link>
              <form action={signOutAction}>
                <button
                  type="submit"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: "10px",
                    border: "1px solid var(--color-border)",
                    fontSize: "13px",
                    fontWeight: 700,
                    color: "var(--color-text-muted)",
                    background: "transparent",
                    cursor: "pointer",
                  }}
                >
                  <LogOut size={13} />
                  Sign Out
                </button>
              </form>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <Link
                href="/register"
                onClick={() => setOpen(false)}
                style={{
                  display: "block",
                  textAlign: "center",
                  padding: "11px",
                  borderRadius: "10px",
                  background: "var(--color-accent)",
                  color: "#fff",
                  fontSize: "14px",
                  fontWeight: 800,
                }}
              >
                Join Free
              </Link>
              <Link
                href="/login"
                onClick={() => setOpen(false)}
                style={{
                  display: "block",
                  textAlign: "center",
                  padding: "10px",
                  borderRadius: "10px",
                  border: "1px solid var(--color-border)",
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "var(--color-text-muted)",
                }}
              >
                Sign In
              </Link>
            </div>
          )}
        </div>
      </div>
        </>,
        document.body
      )}
    </>
  );
}
