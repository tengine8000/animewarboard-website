"use client";

import { useState, useEffect, useCallback, useTransition } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { Bell, X, MessageSquareReply, ThumbsUp, CheckCheck, UserCheck, UserX, Flag, ShieldOff, Coins } from "lucide-react";
import { getNotificationsAction, markAllReadAction } from "@/app/actions/notifications";
import type { NotificationRow } from "@/lib/queries";

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 1)  return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function notifText(n: NotificationRow): string {
  switch (n.type) {
    case "reply_to_comment":      return `${n.actorName ?? "Someone"} replied to your comment`;
    case "comment_upvoted":       return "Your comment got an upvote";
    case "entity_approved":       return "Your character submission was approved";
    case "entity_rejected":       return "Your character submission was rejected";
    case "flag_confirmed":        return "Your flag was confirmed";
    case "flag_dismissed":        return "Your flag was dismissed";
    case "admin_point_adjustment": return n.bodyExcerpt
      ? `Admin adjusted your points: ${n.bodyExcerpt}`
      : "An admin adjusted your points";
    default:                      return "New notification";
  }
}

function notifHref(n: NotificationRow): string | null {
  if (!n.contextSlug) return null;
  if (n.referenceType === "matchup_comment") return `/battles/${n.contextSlug}`;
  if (n.referenceType === "entity_comment")  return `/characters/${n.contextSlug}`;
  if (n.referenceType === "entity")          return `/characters/${n.contextSlug}`;
  return null;
}

function NotifIcon({ type }: { type: string }) {
  const cls = "shrink-0";
  const sz = 14;
  switch (type) {
    case "reply_to_comment": return <MessageSquareReply size={sz} className={cls} style={{ color: "var(--color-accent)" }} />;
    case "comment_upvoted":  return <ThumbsUp           size={sz} className={cls} style={{ color: "#22c55e" }} />;
    case "entity_approved":  return <UserCheck          size={sz} className={cls} style={{ color: "#22c55e" }} />;
    case "entity_rejected":  return <UserX              size={sz} className={cls} style={{ color: "#ef4444" }} />;
    case "flag_confirmed":        return <Flag     size={sz} className={cls} style={{ color: "#22c55e" }} />;
    case "flag_dismissed":        return <ShieldOff size={sz} className={cls} style={{ color: "#ef4444" }} />;
    case "admin_point_adjustment": return <Coins   size={sz} className={cls} style={{ color: "#f59e0b" }} />;
    default:                      return <Bell     size={sz} className={cls} style={{ color: "var(--color-text-muted)" }} />;
  }
}

export function NotificationBell({ initialCount }: { initialCount: number }) {
  const [open, setOpen]           = useState(false);
  const [mounted, setMounted]     = useState(false);
  const [count, setCount]         = useState(initialCount);
  const [items, setItems]         = useState<NotificationRow[] | null>(null);
  const [loading, setLoading]     = useState(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (open) {
      const y = window.scrollY;
      document.body.dataset.lockY = String(y);
      document.body.style.overflow = "hidden";
      document.body.style.position = "fixed";
      document.body.style.top = `-${y}px`;
      document.body.style.width = "100%";
    } else {
      const y = parseFloat(document.body.dataset.lockY ?? "0");
      document.body.style.overflow = "";
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.width = "";
      delete document.body.dataset.lockY;
      window.scrollTo(0, y);
    }
    return () => {
      document.body.style.overflow = "";
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.width = "";
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const handleOpen = useCallback(async () => {
    setOpen(true);
    if (items !== null) return;
    setLoading(true);
    const rows = await getNotificationsAction();
    setItems(rows);
    setLoading(false);
  }, [items]);

  const handleMarkAll = useCallback(() => {
    startTransition(async () => {
      await markAllReadAction();
      setCount(0);
      setItems((prev) => prev?.map((n) => ({ ...n, read: true }) ) ?? prev);
    });
  }, []);

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        aria-label={`Notifications${count > 0 ? ` (${count} unread)` : ""}`}
        className="relative flex items-center justify-center w-9 h-9 rounded-lg transition-colors"
        style={{ color: "var(--color-text-muted)", border: "1px solid var(--color-border)" }}
      >
        <Bell size={16} />
        {count > 0 && (
          <span
            aria-hidden="true"
            style={{
              position: "absolute",
              top: "4px",
              right: "4px",
              width: "16px",
              height: "16px",
              borderRadius: "50%",
              background: "var(--color-accent)",
              color: "#fff",
              fontSize: "9px",
              fontWeight: 900,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              lineHeight: 1,
            }}
          >
            {count > 9 ? "9+" : count}
          </span>
        )}
      </button>

      {mounted && open && createPortal(
        <>
          {/* Backdrop */}
          <div
            aria-hidden="true"
            onClick={() => setOpen(false)}
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 49,
              background: "rgba(0,0,0,0.4)",
              animation: "awbFadeIn 200ms ease forwards",
            }}
          />

          {/* Panel — slides down from top-right */}
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Notifications"
            style={{
              position: "fixed",
              top: "60px",
              right: "16px",
              width: "min(380px, calc(100vw - 32px))",
              maxHeight: "min(520px, calc(100vh - 80px))",
              zIndex: 50,
              display: "flex",
              flexDirection: "column",
              background: "var(--color-bg)",
              border: "1px solid var(--color-border)",
              borderRadius: "16px",
              overflow: "hidden",
              animation: "awbScaleIn 200ms ease forwards",
            }}
          >
            {/* Header */}
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "14px 16px 12px",
              borderBottom: "1px solid var(--color-border)",
              flexShrink: 0,
            }}>
              <span style={{ fontWeight: 900, fontSize: "13px", letterSpacing: "-0.01em" }}>
                Notifications
              </span>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                {count > 0 && (
                  <button
                    type="button"
                    onClick={handleMarkAll}
                    disabled={isPending}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                      fontSize: "11px",
                      fontWeight: 700,
                      color: "var(--color-accent)",
                      padding: "4px 8px",
                      borderRadius: "6px",
                      border: "1px solid var(--color-accent-border)",
                      background: "var(--color-accent-bg)",
                      cursor: "pointer",
                      opacity: isPending ? 0.5 : 1,
                    }}
                  >
                    <CheckCheck size={11} />
                    Mark all read
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Close notifications"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "26px",
                    height: "26px",
                    borderRadius: "6px",
                    color: "var(--color-text-muted)",
                    border: "1px solid var(--color-border)",
                  }}
                >
                  <X size={13} />
                </button>
              </div>
            </div>

            {/* List */}
            <div style={{ overflowY: "auto", flex: 1 }}>
              {loading && (
                <div style={{ padding: "32px 16px", textAlign: "center", color: "var(--color-text-ghost)", fontSize: "13px" }}>
                  Loading…
                </div>
              )}

              {!loading && items !== null && items.length === 0 && (
                <div style={{ padding: "40px 16px", textAlign: "center" }}>
                  <Bell size={28} style={{ margin: "0 auto 10px", color: "var(--color-text-ghost)", display: "block" }} />
                  <p style={{ fontSize: "13px", fontWeight: 700, color: "var(--color-text-muted)" }}>No notifications yet</p>
                  <p style={{ fontSize: "12px", color: "var(--color-text-ghost)", marginTop: "4px" }}>
                    Replies and upvotes will appear here.
                  </p>
                </div>
              )}

              {!loading && items !== null && items.map((n) => {
                const href = notifHref(n);
                const rowStyle = {
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "10px",
                  padding: "12px 16px",
                  borderBottom: "1px solid var(--color-border)",
                  background: n.read ? "transparent" : "color-mix(in srgb, var(--color-accent) 5%, transparent)",
                  cursor: href ? "pointer" : ("default" as const),
                  textDecoration: "none",
                } as const;

                const inner = (
                  <>
                    <span style={{
                      width: "6px",
                      height: "6px",
                      borderRadius: "50%",
                      background: n.read ? "transparent" : "var(--color-accent)",
                      flexShrink: 0,
                      marginTop: "5px",
                    }} />
                    <NotifIcon type={n.type} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: "12px", fontWeight: 600, color: "var(--color-text-base)", lineHeight: 1.4 }}>
                        {notifText(n)}
                      </p>
                      {n.bodyExcerpt && (
                        <p style={{
                          fontSize: "11px",
                          color: "var(--color-text-ghost)",
                          marginTop: "2px",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}>
                          &ldquo;{n.bodyExcerpt}{(n.bodyExcerpt?.length ?? 0) >= 80 ? "…" : ""}&rdquo;
                        </p>
                      )}
                      <p style={{ fontSize: "10px", color: "var(--color-text-ghost)", marginTop: "3px" }}>
                        {timeAgo(n.createdAt)}
                      </p>
                    </div>
                  </>
                );

                return href ? (
                  <Link key={n.id} href={href} onClick={() => setOpen(false)} style={rowStyle}>
                    {inner}
                  </Link>
                ) : (
                  <div key={n.id} style={rowStyle}>
                    {inner}
                  </div>
                );
              })}
            </div>
          </div>
        </>,
        document.body
      )}
    </>
  );
}
