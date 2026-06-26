export const dynamic = "force-dynamic";

import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CheckCircle, XCircle, Clock } from "lucide-react";
import { getPendingEntities } from "@/lib/queries";
import { approveEntityAction, rejectEntityAction } from "@/app/actions/admin-content";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Submissions Queue — Admin" };

export default async function AdminSubmissionsPage() {
  const session = await auth();
  const role = (session?.user as any)?.role;
  if (!["admin", "moderator"].includes(role)) redirect("/");

  const pending = await getPendingEntities();

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin" style={{ color: "var(--color-text-muted)" }}>
          <ArrowLeft size={16} />
        </Link>
        <div>
          <h1 className="text-xl font-black tracking-tight">Submissions Queue</h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--color-text-muted)" }}>
            Pending character submissions from the community.
          </p>
        </div>
      </div>

      {pending.length === 0 ? (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "10px",
            padding: "60px 20px",
            border: "1px dashed var(--color-border)",
            borderRadius: "16px",
            color: "var(--color-text-ghost)",
          }}
        >
          <Clock size={28} />
          <p style={{ fontSize: "14px", fontWeight: 700 }}>No pending submissions</p>
          <p style={{ fontSize: "12px" }}>New submissions will appear here.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
          {pending.map((e, i) => (
            <div
              key={e.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "14px",
                padding: "14px 16px",
                background: "var(--color-surface)",
                borderRadius: i === 0 ? "12px 12px 4px 4px" : i === pending.length - 1 ? "4px 4px 12px 12px" : "4px",
                border: "1px solid var(--color-border)",
              }}
            >
              {/* Avatar */}
              {e.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={e.imageUrl}
                  alt={e.name}
                  style={{ width: 48, height: 48, borderRadius: "8px", objectFit: "cover", flexShrink: 0 }}
                />
              ) : (
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: "8px",
                    background: "var(--color-border)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "18px",
                    fontWeight: 900,
                    color: "var(--color-text-ghost)",
                    flexShrink: 0,
                  }}
                >
                  {e.name[0]}
                </div>
              )}

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: "14px", fontWeight: 800 }}>{e.name}</p>
                <p style={{ fontSize: "11px", color: "var(--color-text-muted)", marginTop: "2px" }}>
                  {e.seriesName ?? "Unknown series"}
                  {e.creatorName && ` · submitted by ${e.creatorName}`}
                </p>
              </div>

              {/* Actions */}
              <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
                <form action={approveEntityAction.bind(null, e.id)}>
                  <button
                    type="submit"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "5px",
                      padding: "7px 12px",
                      borderRadius: "7px",
                      background: "color-mix(in srgb, #22c55e 15%, transparent)",
                      border: "1px solid #22c55e40",
                      color: "#22c55e",
                      fontSize: "12px",
                      fontWeight: 800,
                      cursor: "pointer",
                    }}
                  >
                    <CheckCircle size={12} />
                    Approve
                  </button>
                </form>
                <form action={rejectEntityAction.bind(null, e.id)}>
                  <button
                    type="submit"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "5px",
                      padding: "7px 12px",
                      borderRadius: "7px",
                      background: "color-mix(in srgb, #ef4444 10%, transparent)",
                      border: "1px solid #ef444430",
                      color: "#ef4444",
                      fontSize: "12px",
                      fontWeight: 800,
                      cursor: "pointer",
                    }}
                  >
                    <XCircle size={12} />
                    Reject
                  </button>
                </form>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
