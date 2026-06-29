export const dynamic = "force-dynamic";

import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getAdminDashboardStats } from "@/lib/queries";
import { Settings, TrendingUp, Users, Swords, BarChart2, PlusCircle, UserCog, Inbox, List } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Admin Dashboard" };

const CLIP = "polygon(12px 0, calc(100% - 12px) 0, 100% 12px, 100% calc(100% - 12px), calc(100% - 12px) 100%, 12px 100%, 0 calc(100% - 12px), 0 12px)";

function ClipCard({ children, borderColor }: { children: React.ReactNode; borderColor?: string }) {
  return (
    <div style={{ clipPath: CLIP, background: borderColor ?? "var(--color-border)", padding: "1px" }}>
      <div style={{ clipPath: CLIP, background: "var(--color-surface)" }}>{children}</div>
    </div>
  );
}

function StatBox({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color?: string }) {
  return (
    <div className="p-5 space-y-1">
      <p className="text-[10px] font-black tracking-widest uppercase" style={{ color: "var(--color-text-ghost)" }}>
        {label}
      </p>
      <p className="text-3xl font-black" style={{ color: color ?? "var(--color-text-base)" }}>
        {value}
      </p>
      {sub && <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>{sub}</p>}
    </div>
  );
}

export default async function AdminDashboardPage() {
  const session = await auth();
  if ((session?.user as any)?.role !== "admin") redirect("/");

  const stats = await getAdminDashboardStats();

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">

      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-black tracking-tight">Admin Dashboard</h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--color-text-muted)" }}>
            Live stats — refreshes on every page load.
          </p>
        </div>
        <Link
          href="/admin/settings"
          className="flex items-center gap-2 text-xs font-black tracking-widest uppercase px-4 py-2"
          style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}
        >
          <Settings size={12} />
          Settings
        </Link>
      </div>

      {/* Quick Actions */}
      <section className="space-y-3">
        <h2 className="text-[10px] font-black tracking-widest uppercase" style={{ color: "var(--color-text-ghost)" }}>
          Content & Moderation
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[
            { href: "/admin/characters",     icon: List,        label: "Characters",     color: "var(--color-accent)" },
            { href: "/admin/series",         icon: List,        label: "Series",         color: "var(--color-accent)" },
            { href: "/admin/battles",        icon: Swords,      label: "Battles",        color: "#f87171" },
            { href: "/admin/characters/new", icon: PlusCircle,  label: "Add Character",  color: "#60a5fa" },
            { href: "/admin/series/new",     icon: PlusCircle,  label: "Add Series",     color: "#60a5fa" },
            { href: "/admin/submissions",    icon: Inbox,        label: "Submissions",   color: "#818cf8" },
            { href: "/admin/users",          icon: UserCog,      label: "Manage Users",  color: "#22c55e" },
          ].map(({ href, icon: Icon, label, color }) => (
            <Link
              key={href}
              href={href}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "12px 14px",
                borderRadius: "10px",
                border: "1px solid var(--color-border)",
                background: "var(--color-surface)",
                fontSize: "13px",
                fontWeight: 800,
                color: "var(--color-text-base)",
                textDecoration: "none",
              }}
            >
              <Icon size={14} style={{ color, flexShrink: 0 }} />
              {label}
            </Link>
          ))}
        </div>
      </section>

      {/* Primary KPIs */}
      <section className="space-y-3">
        <h2 className="text-[10px] font-black tracking-widest uppercase" style={{ color: "var(--color-text-ghost)" }}>
          Primary KPIs
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-1">
          <ClipCard borderColor="var(--color-accent)">
            <StatBox
              label="Votes / Visitor"
              value={stats.votesPerVisitor}
              sub="Target: >0.3 at launch"
              color="var(--color-accent)"
            />
          </ClipCard>
          <ClipCard>
            <StatBox label="Unique Visitors" value={stats.totalVisitors.toLocaleString()} sub="Distinct session IDs" />
          </ClipCard>
          <ClipCard>
            <StatBox label="Total Votes" value={stats.totalVotes.toLocaleString()} sub="Registered predictions" />
          </ClipCard>
          <ClipCard>
            <StatBox
              label="Conversion Rate"
              value={stats.conversionFunnel.conversionRate}
              sub={`${stats.conversionFunnel.registeredVoters} logged-in voters`}
              color="#22c55e"
            />
          </ClipCard>
        </div>
      </section>

      {/* Traffic sources */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <TrendingUp size={12} style={{ color: "var(--color-text-ghost)" }} />
          <h2 className="text-[10px] font-black tracking-widest uppercase" style={{ color: "var(--color-text-ghost)" }}>
            Traffic Sources
          </h2>
        </div>
        <ClipCard>
          {stats.trafficSources.length === 0 ? (
            <div className="py-8 text-center text-sm" style={{ color: "var(--color-text-ghost)" }}>
              No page-view events yet. Analytics will populate as users visit.
            </div>
          ) : (
            (() => {
              const total = stats.trafficSources.reduce((s, r) => s + r.count, 0);
              return stats.trafficSources.map((src, i) => {
                const pct = total > 0 ? Math.round((src.count / total) * 100) : 0;
                return (
                  <div
                    key={src.source}
                    className="flex items-center gap-4 px-5 py-3"
                    style={{ borderTop: i === 0 ? "none" : "1px solid var(--color-border)" }}
                  >
                    <span className="text-sm font-semibold flex-1">{src.source}</span>
                    <div className="w-32 shrink-0 space-y-0.5">
                      <div className="flex justify-between text-[9px] font-bold">
                        <span>{pct}%</span>
                        <span style={{ color: "var(--color-text-ghost)" }}>{src.count.toLocaleString()} views</span>
                      </div>
                      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--color-border)" }}>
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${pct}%`, background: "var(--color-accent)" }}
                        />
                      </div>
                    </div>
                  </div>
                );
              });
            })()
          )}
        </ClipCard>
      </section>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">

        {/* Top matchups by votes */}
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Swords size={12} style={{ color: "var(--color-text-ghost)" }} />
            <h2 className="text-[10px] font-black tracking-widest uppercase" style={{ color: "var(--color-text-ghost)" }}>
              Top Battles — Votes
            </h2>
          </div>
          <ClipCard>
            {stats.topMatchupsByVotes.length === 0 ? (
              <div className="py-8 text-center text-sm" style={{ color: "var(--color-text-ghost)" }}>No data</div>
            ) : (
              stats.topMatchupsByVotes.map((m, i) => (
                <div
                  key={m.matchupId}
                  className="flex items-center gap-3 px-4 py-2.5"
                  style={{ borderTop: i === 0 ? "none" : "1px solid var(--color-border)" }}
                >
                  <span className="text-xs font-bold w-5 text-right shrink-0" style={{ color: "var(--color-text-ghost)" }}>
                    {i + 1}
                  </span>
                  <Link href={`/battles/${m.slug}`} className="text-xs font-semibold flex-1 truncate hover:underline">
                    {m.slug}
                  </Link>
                  <span className="text-xs font-black shrink-0" style={{ color: "var(--color-accent)" }}>
                    {m.totalVotes.toLocaleString()}
                  </span>
                </div>
              ))
            )}
          </ClipCard>
        </section>

        {/* Top matchup pages by views */}
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <BarChart2 size={12} style={{ color: "var(--color-text-ghost)" }} />
            <h2 className="text-[10px] font-black tracking-widest uppercase" style={{ color: "var(--color-text-ghost)" }}>
              Top Battles — Page Views
            </h2>
          </div>
          <ClipCard>
            {stats.topMatchupsByViews.length === 0 ? (
              <div className="py-8 text-center text-sm" style={{ color: "var(--color-text-ghost)" }}>
                No page-view data yet.
              </div>
            ) : (
              stats.topMatchupsByViews.map((m, i) => (
                <div
                  key={m.path}
                  className="flex items-center gap-3 px-4 py-2.5"
                  style={{ borderTop: i === 0 ? "none" : "1px solid var(--color-border)" }}
                >
                  <span className="text-xs font-bold w-5 text-right shrink-0" style={{ color: "var(--color-text-ghost)" }}>
                    {i + 1}
                  </span>
                  <Link href={m.path} className="text-xs font-semibold flex-1 truncate hover:underline">
                    {m.path}
                  </Link>
                  <span className="text-xs font-black shrink-0" style={{ color: "#22c55e" }}>
                    {m.views.toLocaleString()}
                  </span>
                </div>
              ))
            )}
          </ClipCard>
        </section>
      </div>

      {/* Conversion funnel */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <Users size={12} style={{ color: "var(--color-text-ghost)" }} />
          <h2 className="text-[10px] font-black tracking-widest uppercase" style={{ color: "var(--color-text-ghost)" }}>
            Guest → Registered Funnel
          </h2>
        </div>
        <ClipCard>
          <div className="p-5 space-y-4">
            {[
              { label: "Unique Sessions (Visitors)",          value: stats.conversionFunnel.visitors,         pct: 100, color: "var(--color-accent)" },
              { label: "Logged-in Voters",                    value: stats.conversionFunnel.registeredVoters, pct: stats.conversionFunnel.visitors > 0 ? Math.round((stats.conversionFunnel.registeredVoters / stats.conversionFunnel.visitors) * 100) : 0, color: "#22c55e" },
            ].map((row) => (
              <div key={row.label} className="space-y-1">
                <div className="flex justify-between text-xs font-semibold">
                  <span>{row.label}</span>
                  <span className="font-black" style={{ color: row.color }}>{row.value.toLocaleString()} ({row.pct}%)</span>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--color-border)" }}>
                  <div className="h-full rounded-full transition-all" style={{ width: `${row.pct}%`, background: row.color }} />
                </div>
              </div>
            ))}
            <p className="text-xs" style={{ color: "var(--color-text-ghost)" }}>
              Conversion = logged-in sessions / total sessions. Target: &gt;15% at launch.
            </p>
          </div>
        </ClipCard>
      </section>

    </div>
  );
}
