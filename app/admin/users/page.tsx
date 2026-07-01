export const dynamic = "force-dynamic";

import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Shield, ShieldX, ShieldCheck, Star, Clock } from "lucide-react";
import { getAdminUserList } from "@/lib/queries";
import {
  setUserRoleAction,
  setPatronAction,
  setPostingRestrictionAction,
  manualPointAdjustAction,
  deleteUserAction,
} from "@/app/actions/admin-moderation";
import { AdminDeleteButton } from "@/components/admin-delete-button";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "User Management — Admin" };

const ROLE_COLORS: Record<string, string> = {
  admin:     "var(--color-accent)",
  moderator: "#818cf8",
  banned:    "#ef4444",
  user:      "var(--color-text-ghost)",
};

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const session = await auth();
  if ((session?.user as any)?.role !== "admin") redirect("/");

  const sp     = await searchParams;
  const search = sp.q ?? "";
  const users  = await getAdminUserList(search, 50, 0);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <Link href="/admin" style={{ color: "var(--color-text-muted)", flexShrink: 0 }}>
            <ArrowLeft size={16} />
          </Link>
          <div className="min-w-0">
            <h1 className="text-xl font-black tracking-tight">User Management</h1>
            <p className="text-sm mt-0.5" style={{ color: "var(--color-text-muted)" }}>
              {users.length} user{users.length !== 1 ? "s" : ""} shown
            </p>
          </div>
        </div>
        <form method="GET" className="w-full sm:w-auto">
          <input
            name="q"
            defaultValue={search}
            placeholder="Search by name or email…"
            style={{
              padding: "8px 12px",
              borderRadius: "8px",
              border: "1px solid var(--color-border)",
              background: "var(--color-surface)",
              color: "var(--color-text-base)",
              fontSize: "13px",
              width: "100%",
            }}
          />
        </form>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
        {users.map((u, i) => {
          const initial = ((u.name ?? u.email ?? "?")[0]).toUpperCase();
          const isSelf  = u.id === session!.user!.id;
          const radius  = i === 0 ? "12px 12px 4px 4px" : i === users.length - 1 ? "4px 4px 12px 12px" : "4px";

          return (
            <details
              key={u.id}
              style={{
                background: "var(--color-surface)",
                border: "1px solid var(--color-border)",
                borderRadius: radius,
                overflow: "hidden",
              }}
            >
              <summary
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: "12px 16px",
                  cursor: "pointer",
                  listStyle: "none",
                }}
              >
                {/* Avatar */}
                <div
                  style={{
                    width: 36, height: 36, borderRadius: "50%", flexShrink: 0,
                    background: "var(--color-accent)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: "#fff", fontSize: "13px", fontWeight: 900,
                  }}
                >
                  {initial}
                </div>

                {/* Name + email */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: "13px", fontWeight: 800, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {u.name ?? "(no name)"}
                    {isSelf && <span style={{ fontSize: "10px", marginLeft: "6px", color: "var(--color-text-ghost)" }}>you</span>}
                  </p>
                  <p style={{ fontSize: "11px", color: "var(--color-text-muted)", marginTop: "1px" }}>{u.email}</p>
                </div>

                {/* Role badge */}
                <span
                  style={{
                    fontSize: "9px",
                    fontWeight: 900,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    color: ROLE_COLORS[u.role] ?? "var(--color-text-ghost)",
                    padding: "2px 7px",
                    border: `1px solid ${ROLE_COLORS[u.role] ?? "var(--color-border)"}40`,
                    borderRadius: "4px",
                    flexShrink: 0,
                  }}
                >
                  {u.role}
                </span>

                {/* XP */}
                <span style={{ fontSize: "11px", color: "var(--color-text-ghost)", flexShrink: 0, minWidth: "60px", textAlign: "right" }}>
                  {Number(u.xp).toLocaleString()} XP
                </span>
              </summary>

              {/* Expanded moderation panel */}
              <div
                style={{
                  padding: "16px",
                  borderTop: "1px solid var(--color-border)",
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
                  gap: "12px",
                }}
              >
                {/* Role control — disabled for self to prevent lockout */}
                <ActionCard title="Role" icon={<Shield size={12} />}>
                  {isSelf ? (
                    <p style={{ fontSize: "11px", color: "var(--color-text-ghost)", fontStyle: "italic" }}>
                      Cannot change your own role
                    </p>
                  ) : (
                    <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                      {(["user", "moderator", "admin", "banned"] as const).map((r) => (
                        <form key={r} action={setUserRoleAction.bind(null, u.id, r)}>
                          <button
                            type="submit"
                            style={{
                              padding: "5px 10px",
                              borderRadius: "6px",
                              fontSize: "11px",
                              fontWeight: 800,
                              cursor: "pointer",
                              border: "1px solid",
                              borderColor: u.role === r ? (ROLE_COLORS[r] ?? "var(--color-border)") : "var(--color-border)",
                              color: u.role === r ? (ROLE_COLORS[r] ?? "var(--color-text-base)") : "var(--color-text-muted)",
                              background: u.role === r ? `${ROLE_COLORS[r]}18` : "transparent",
                            }}
                          >
                            {r === "banned" ? "Ban" : r.charAt(0).toUpperCase() + r.slice(1)}
                          </button>
                        </form>
                      ))}
                    </div>
                  )}
                </ActionCard>

                {/* Patron toggle */}
                <ActionCard title="Patron" icon={<Star size={12} />}>
                  <form action={setPatronAction.bind(null, u.id, !u.isPatron)}>
                    <button
                      type="submit"
                      style={{
                        padding: "5px 12px",
                        borderRadius: "6px",
                        fontSize: "11px",
                        fontWeight: 800,
                        cursor: "pointer",
                        border: "1px solid",
                        borderColor: u.isPatron ? "#f59e0b40" : "var(--color-border)",
                        color: u.isPatron ? "#f59e0b" : "var(--color-text-muted)",
                        background: u.isPatron ? "#f59e0b18" : "transparent",
                      }}
                    >
                      {u.isPatron ? "★ Patron — Remove" : "Grant Patron"}
                    </button>
                  </form>
                </ActionCard>

                {/* Posting restriction */}
                <ActionCard title="Restrict Posting Until" icon={<Clock size={12} />}>
                  <RestrictForm userId={u.id} restrictedUntil={u.restrictedUntil} />
                </ActionCard>

                {/* Manual point adjustment */}
                <ActionCard title="Point Adjustment" icon={<ShieldCheck size={12} />}>
                  <AdjustForm userId={u.id} />
                </ActionCard>

                {/* Delete user — never show for self */}
                {!isSelf && (
                  <ActionCard title="Danger Zone" icon={<ShieldX size={12} />}>
                    <p style={{ fontSize: "10px", color: "var(--color-text-ghost)", marginBottom: "6px" }}>
                      Permanently deletes the account and all their votes, comments, and points. Content they submitted (characters, battles) is kept but unattributed.
                    </p>
                    <AdminDeleteButton
                      action={deleteUserAction.bind(null, u.id)}
                      label={`user ${u.name ?? u.email ?? u.id}`}
                    />
                  </ActionCard>
                )}
              </div>
            </details>
          );
        })}
      </div>
    </div>
  );
}

function RestrictForm({ userId, restrictedUntil }: { userId: string; restrictedUntil: string | null }) {
  async function action(fd: FormData): Promise<void> {
    "use server";
    const until = (fd.get("until") as string | null) || null;
    await setPostingRestrictionAction(userId, until);
  }
  async function liftAction(): Promise<void> {
    "use server";
    await setPostingRestrictionAction(userId, null);
  }
  return (
    <>
      <form action={action} style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
        <input
          type="datetime-local"
          name="until"
          defaultValue={restrictedUntil ? restrictedUntil.replace("Z", "") : ""}
          style={{ width: "100%", padding: "5px 8px", borderRadius: "6px", border: "1px solid var(--color-border)", background: "var(--color-bg)", color: "var(--color-text-base)", fontSize: "11px", boxSizing: "border-box" }}
        />
        <button type="submit" style={{ padding: "5px 10px", borderRadius: "6px", background: "var(--color-accent)", color: "#fff", fontSize: "11px", fontWeight: 800, cursor: "pointer", border: "none" }}>
          Set
        </button>
      </form>
      {restrictedUntil && (
        <form action={liftAction} style={{ marginTop: "6px" }}>
          <button type="submit" style={{ fontSize: "10px", color: "#ef4444", cursor: "pointer", background: "none", border: "none", textDecoration: "underline" }}>
            Lift restriction
          </button>
        </form>
      )}
    </>
  );
}

function AdjustForm({ userId }: { userId: string }) {
  async function action(fd: FormData): Promise<void> {
    "use server";
    const sign   = fd.get("sign") === "deduct" ? -1 : 1;
    const amount = Math.abs(parseInt(fd.get("amount") as string, 10));
    const note   = (fd.get("note") as string) ?? "";
    await manualPointAdjustAction(userId, sign * amount, note);
  }

  const fieldStyle = { padding: "5px 8px", borderRadius: "6px", border: "1px solid var(--color-border)", background: "var(--color-bg)", color: "var(--color-text-base)", fontSize: "11px" } as const;

  return (
    <form action={action} style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
      <input type="number" name="amount" min="1" placeholder="Amount" required style={fieldStyle} />
      <input type="text" name="note" placeholder="Reason (required)" required style={fieldStyle} />
      <div style={{ display: "flex", gap: "6px" }}>
        <button type="submit" name="sign" value="award"
          style={{ flex: 1, padding: "6px", borderRadius: "6px", fontSize: "11px", fontWeight: 800, cursor: "pointer", background: "color-mix(in srgb, #22c55e 15%, transparent)", border: "1px solid #22c55e40", color: "#22c55e" }}>
          + Award
        </button>
        <button type="submit" name="sign" value="deduct"
          style={{ flex: 1, padding: "6px", borderRadius: "6px", fontSize: "11px", fontWeight: 800, cursor: "pointer", background: "color-mix(in srgb, #ef4444 10%, transparent)", border: "1px solid #ef444430", color: "#ef4444" }}>
          − Deduct
        </button>
      </div>
    </form>
  );
}

function ActionCard({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "8px",
        padding: "12px",
        border: "1px solid var(--color-border)",
        borderRadius: "8px",
        background: "var(--color-bg)",
      }}
    >
      <p style={{ fontSize: "9px", fontWeight: 900, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--color-text-ghost)", display: "flex", alignItems: "center", gap: "5px" }}>
        {icon}{title}
      </p>
      {children}
    </div>
  );
}
