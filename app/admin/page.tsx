export const dynamic = "force-dynamic";

import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import {
  Settings, TrendingUp, Users, Swords, BarChart2,
  PlusCircle, UserCog, Inbox, List, Zap, AlertTriangle,
  BookOpen, Trophy,
} from "lucide-react";
import type { Metadata } from "next";
import { getAdminDashboardStats } from "@/lib/queries";
import {
  getPlatformPulse,
  getActivityTrend,
  getContentHealth,
  getCommunityStats,
} from "@/lib/admin-analytics";
import { PeriodSelector } from "@/components/admin/period-selector";
import { TrendChart } from "@/components/admin/trend-chart";

export const metadata: Metadata = { title: "Admin Dashboard" };

const CLIP = "polygon(12px 0, calc(100% - 12px) 0, 100% 12px, 100% calc(100% - 12px), calc(100% - 12px) 100%, 12px 100%, 0 calc(100% - 12px), 0 12px)";

function ClipCard({ children, borderColor, className }: { children: React.ReactNode; borderColor?: string; className?: string }) {
  return (
    <div style={{ clipPath: CLIP, background: borderColor ?? "var(--color-border)", padding: "1px" }}>
      <div style={{ clipPath: CLIP, background: "var(--color-surface)" }} className={className}>{children}</div>
    </div>
  );
}

function SectionLabel({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <Icon size={12} style={{ color: "var(--color-text-ghost)" }} />
      <h2 className="text-[10px] font-black tracking-widest uppercase" style={{ color: "var(--color-text-ghost)" }}>
        {label}
      </h2>
    </div>
  );
}

function PulseCard({
  label, total, inPeriod, today, period, color, borderColor, icon: Icon,
}: {
  label: string; total: number; inPeriod: number; today: number;
  period: number; color: string; borderColor?: string; icon: React.ElementType;
}) {
  return (
    <ClipCard borderColor={borderColor}>
      <div className="p-5 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-black tracking-widest uppercase" style={{ color: "var(--color-text-ghost)" }}>
            {label}
          </p>
          <Icon size={13} style={{ color }} />
        </div>
        <p className="text-3xl font-black" style={{ color }}>{total.toLocaleString()}</p>
        <div className="flex gap-3 text-[10px] font-bold">
          <span style={{ color: "var(--color-text-ghost)" }}>+{inPeriod} in {period}d</span>
          <span style={{ color: "var(--color-text-muted)" }}>+{today} today</span>
        </div>
      </div>
    </ClipCard>
  );
}

const RANK_COLORS: Record<string, string> = {
  "Civilian":      "#7c82a0",
  "Corporal":      "#60a5fa",
  "Sergeant":      "#4ade80",
  "Lieutenant":    "#f59e0b",
  "Colonel":       "#f97316",
  "General":       "#f87171",
  "Field Marshal": "#c084fc",
};

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const [sp, session] = await Promise.all([searchParams, auth()]);
  if ((session?.user as any)?.role !== "admin") redirect("/");

  const period = Math.max(1, Math.min(365, parseInt(sp.period ?? "7", 10) || 7));

  const [trafficStats, pulse, trend, content, community] = await Promise.all([
    getAdminDashboardStats(),
    getPlatformPulse(period),
    getActivityTrend(period),
    getContentHealth(),
    getCommunityStats(),
  ]);

  const charTotal = content.characters.approved + content.characters.pending + content.characters.rejected;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
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
        <SectionLabel icon={List} label="Content & Moderation" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {[
            { href: "/admin/characters",    icon: List,       label: "Characters",   color: "var(--color-accent)" },
            { href: "/admin/series",        icon: BookOpen,   label: "Series",       color: "var(--color-accent)" },
            { href: "/admin/battles",       icon: Swords,     label: "Battles",      color: "#f87171"             },
            { href: "/admin/submissions",   icon: Inbox,      label: `Submissions${pulse.pending > 0 ? ` (${pulse.pending})` : ""}`, color: pulse.pending > 0 ? "#f59e0b" : "#818cf8" },
            { href: "/admin/users",         icon: UserCog,    label: "Manage Users", color: "#22c55e"             },
            { href: "/admin/characters/new",icon: PlusCircle, label: "Add Character",color: "#60a5fa"             },
            { href: "/admin/series/new",    icon: PlusCircle, label: "Add Series",   color: "#60a5fa"             },
          ].map(({ href, icon: Icon, label, color }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-2 px-4 py-3 text-sm font-bold transition-colors hover:bg-[var(--color-surface-hover)]"
              style={{ border: "1px solid var(--color-border)", background: "var(--color-surface)" }}
            >
              <Icon size={14} style={{ color, flexShrink: 0 }} />
              {label}
            </Link>
          ))}
        </div>
      </section>

      {/* Period selector + Pulse header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <SectionLabel icon={TrendingUp} label="Platform Pulse" />
        <Suspense fallback={null}>
          <PeriodSelector active={period} />
        </Suspense>
      </div>

      {/* Pulse cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 -mt-4">
        <PulseCard label="Users"   total={pulse.users.total}   inPeriod={pulse.users.inPeriod}   today={pulse.users.today}   period={period} color="#60a5fa" icon={Users}    />
        <PulseCard label="Battles" total={pulse.battles.total} inPeriod={pulse.battles.inPeriod} today={pulse.battles.today} period={period} color="#f87171" icon={Swords}   />
        <PulseCard label="Votes"   total={pulse.votes.total}   inPeriod={pulse.votes.inPeriod}   today={pulse.votes.today}   period={period} color="#4ade80" icon={BarChart2} />

        <ClipCard borderColor={pulse.pending > 0 ? "#f59e0b" : undefined}>
          <div className="p-5 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-black tracking-widest uppercase" style={{ color: "var(--color-text-ghost)" }}>Pending</p>
              <AlertTriangle size={13} style={{ color: pulse.pending > 0 ? "#f59e0b" : "var(--color-text-ghost)" }} />
            </div>
            <p className="text-3xl font-black" style={{ color: pulse.pending > 0 ? "#f59e0b" : "var(--color-text-base)" }}>
              {pulse.pending}
            </p>
            <Link href="/admin/submissions" className="text-[10px] font-bold hover:underline" style={{ color: "var(--color-text-ghost)" }}>
              Review submissions →
            </Link>
          </div>
        </ClipCard>

        <ClipCard>
          <div className="p-5 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-black tracking-widest uppercase" style={{ color: "var(--color-text-ghost)" }}>XP Given</p>
              <Zap size={13} style={{ color: "#c084fc" }} />
            </div>
            <p className="text-3xl font-black" style={{ color: "#c084fc" }}>{pulse.xpDistributed.toLocaleString()}</p>
            <p className="text-[10px]" style={{ color: "var(--color-text-ghost)" }}>total XP distributed</p>
          </div>
        </ClipCard>

        <ClipCard>
          <div className="p-5 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-black tracking-widest uppercase" style={{ color: "var(--color-text-ghost)" }}>Series</p>
              <BookOpen size={13} style={{ color: "#f59e0b" }} />
            </div>
            <p className="text-3xl font-black" style={{ color: "#f59e0b" }}>{pulse.totalSeries.toLocaleString()}</p>
            <p className="text-[10px]" style={{ color: "var(--color-text-ghost)" }}>anime &amp; game series</p>
          </div>
        </ClipCard>
      </div>

      {/* Activity Trends */}
      <section className="space-y-3">
        <SectionLabel icon={TrendingUp} label={`Activity — Last ${period} Day${period === 1 ? "" : "s"}`} />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {([
            { label: "New Users",   key: "newUsers"   as const, color: "#60a5fa", total: pulse.users.inPeriod   },
            { label: "New Battles", key: "newBattles" as const, color: "#f87171", total: pulse.battles.inPeriod },
            { label: "New Votes",   key: "newVotes"   as const, color: "#4ade80", total: pulse.votes.inPeriod   },
          ] as const).map(({ label, key, color, total }) => (
            <ClipCard key={label}>
              <TrendChart
                data={trend.map((d) => ({ day: d.day, value: d[key] }))}
                color={color}
                label={label}
                total={total}
              />
            </ClipCard>
          ))}
        </div>
      </section>

      {/* Engagement KPIs */}
      <section className="space-y-3">
        <SectionLabel icon={BarChart2} label="Engagement KPIs" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1">
          <ClipCard borderColor="var(--color-accent)">
            <div className="p-5 space-y-1">
              <p className="text-[10px] font-black tracking-widest uppercase" style={{ color: "var(--color-text-ghost)" }}>Votes / Visitor</p>
              <p className="text-3xl font-black" style={{ color: "var(--color-accent)" }}>{trafficStats.votesPerVisitor}</p>
              <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>Target: &gt;0.3 at launch</p>
            </div>
          </ClipCard>
          <ClipCard>
            <div className="p-5 space-y-1">
              <p className="text-[10px] font-black tracking-widest uppercase" style={{ color: "var(--color-text-ghost)" }}>Unique Visitors</p>
              <p className="text-3xl font-black">{trafficStats.totalVisitors.toLocaleString()}</p>
              <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>Distinct session IDs</p>
            </div>
          </ClipCard>
          <ClipCard>
            <div className="p-5 space-y-1">
              <p className="text-[10px] font-black tracking-widest uppercase" style={{ color: "var(--color-text-ghost)" }}>Conversion Rate</p>
              <p className="text-3xl font-black" style={{ color: "#22c55e" }}>{trafficStats.conversionFunnel.conversionRate}</p>
              <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>{trafficStats.conversionFunnel.registeredVoters} logged-in voters</p>
            </div>
          </ClipCard>
          <ClipCard>
            <div className="p-5 space-y-1">
              <p className="text-[10px] font-black tracking-widest uppercase" style={{ color: "var(--color-text-ghost)" }}>0-Vote Battles</p>
              <p className="text-3xl font-black" style={{ color: content.battlesWithZeroVotes > 0 ? "#f59e0b" : "#4ade80" }}>
                {content.battlesWithZeroVotes}
              </p>
              <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>battles need promotion</p>
            </div>
          </ClipCard>
        </div>
      </section>

      {/* Traffic + Top Battles by votes */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <section className="space-y-3">
          <SectionLabel icon={TrendingUp} label="Traffic Sources" />
          <ClipCard>
            {trafficStats.trafficSources.length === 0 ? (
              <div className="py-8 text-center text-sm" style={{ color: "var(--color-text-ghost)" }}>No data yet.</div>
            ) : (() => {
              const total = trafficStats.trafficSources.reduce((s, r) => s + r.count, 0);
              return trafficStats.trafficSources.map((src, i) => {
                const pct = total > 0 ? Math.round((src.count / total) * 100) : 0;
                return (
                  <div key={src.source} className="flex items-center gap-4 px-5 py-3"
                    style={{ borderTop: i === 0 ? "none" : "1px solid var(--color-border)" }}>
                    <span className="text-sm font-semibold flex-1">{src.source}</span>
                    <div className="w-28 shrink-0 space-y-0.5">
                      <div className="flex justify-between text-[9px] font-bold">
                        <span>{pct}%</span>
                        <span style={{ color: "var(--color-text-ghost)" }}>{src.count.toLocaleString()}</span>
                      </div>
                      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--color-border)" }}>
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: "var(--color-accent)" }} />
                      </div>
                    </div>
                  </div>
                );
              });
            })()}
          </ClipCard>
        </section>

        <section className="space-y-3">
          <SectionLabel icon={Swords} label="Top Battles — Votes" />
          <ClipCard>
            {trafficStats.topMatchupsByVotes.length === 0 ? (
              <div className="py-8 text-center text-sm" style={{ color: "var(--color-text-ghost)" }}>No votes yet.</div>
            ) : trafficStats.topMatchupsByVotes.map((m, i) => (
              <div key={m.matchupId} className="flex items-center gap-3 px-4 py-2.5"
                style={{ borderTop: i === 0 ? "none" : "1px solid var(--color-border)" }}>
                <span className="text-xs font-bold w-5 text-right shrink-0" style={{ color: "var(--color-text-ghost)" }}>{i + 1}</span>
                <Link href={`/battles/${m.slug}`} className="text-xs font-semibold flex-1 truncate hover:underline">{m.slug}</Link>
                <span className="text-xs font-black shrink-0" style={{ color: "var(--color-accent)" }}>{m.totalVotes.toLocaleString()}</span>
              </div>
            ))}
          </ClipCard>
        </section>
      </div>

      {/* Top pages by views */}
      <section className="space-y-3">
        <SectionLabel icon={BarChart2} label="Top Battles — Page Views" />
        <ClipCard>
          {trafficStats.topMatchupsByViews.length === 0 ? (
            <div className="py-8 text-center text-sm" style={{ color: "var(--color-text-ghost)" }}>No page-view data yet.</div>
          ) : trafficStats.topMatchupsByViews.map((m, i) => (
            <div key={m.path} className="flex items-center gap-3 px-4 py-2.5"
              style={{ borderTop: i === 0 ? "none" : "1px solid var(--color-border)" }}>
              <span className="text-xs font-bold w-5 text-right shrink-0" style={{ color: "var(--color-text-ghost)" }}>{i + 1}</span>
              <Link href={m.path} className="text-xs font-semibold flex-1 truncate hover:underline">{m.path}</Link>
              <span className="text-xs font-black shrink-0" style={{ color: "#22c55e" }}>{m.views.toLocaleString()}</span>
            </div>
          ))}
        </ClipCard>
      </section>

      {/* Content Health */}
      <section className="space-y-3">
        <SectionLabel icon={List} label="Content Health" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <ClipCard>
            <div className="px-5 py-4 space-y-4">
              <p className="text-[10px] font-black tracking-widest uppercase" style={{ color: "var(--color-text-ghost)" }}>
                Characters ({charTotal.toLocaleString()} total)
              </p>
              {[
                { label: "Approved", value: content.characters.approved, color: "#4ade80" },
                { label: "Pending",  value: content.characters.pending,  color: "#f59e0b" },
                { label: "Rejected", value: content.characters.rejected, color: "#f87171" },
              ].map(({ label, value, color }) => (
                <div key={label} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span>{label}</span>
                    <span className="font-black" style={{ color }}>{value.toLocaleString()}</span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--color-border)" }}>
                    <div className="h-full rounded-full" style={{
                      width: `${charTotal > 0 ? Math.round((value / charTotal) * 100) : 0}%`,
                      background: color,
                    }} />
                  </div>
                </div>
              ))}
            </div>
          </ClipCard>

          <ClipCard>
            <div className="px-5 py-4">
              <p className="text-[10px] font-black tracking-widest uppercase mb-3" style={{ color: "var(--color-text-ghost)" }}>
                Top Series by Characters
              </p>
              {content.topSeries.length === 0 ? (
                <p className="text-sm py-4 text-center" style={{ color: "var(--color-text-ghost)" }}>No data.</p>
              ) : (() => {
                const max = content.topSeries[0].count;
                return content.topSeries.map((s, i) => (
                  <div key={s.slug} className="flex items-center gap-3 py-1.5"
                    style={{ borderTop: i === 0 ? "none" : "1px solid var(--color-border)" }}>
                    <Link href={`/anime/${s.slug}`} className="text-xs font-semibold flex-1 truncate hover:underline">{s.name}</Link>
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="w-16 h-1.5 rounded-full overflow-hidden" style={{ background: "var(--color-border)" }}>
                        <div className="h-full rounded-full" style={{ width: `${Math.round((s.count / max) * 100)}%`, background: "var(--color-accent)" }} />
                      </div>
                      <span className="text-[10px] font-black w-5 text-right" style={{ color: "var(--color-accent)" }}>{s.count}</span>
                    </div>
                  </div>
                ));
              })()}
            </div>
          </ClipCard>
        </div>
      </section>

      {/* Community */}
      <section className="space-y-3">
        <SectionLabel icon={Trophy} label="Community" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <ClipCard>
            <div className="px-5 py-4">
              <p className="text-[10px] font-black tracking-widest uppercase mb-3" style={{ color: "var(--color-text-ghost)" }}>Top Voters</p>
              {community.topVoters.length === 0 ? (
                <p className="text-sm py-4 text-center" style={{ color: "var(--color-text-ghost)" }}>No votes yet.</p>
              ) : community.topVoters.map((u, i) => (
                <div key={i} className="flex items-center gap-2 py-2"
                  style={{ borderTop: i === 0 ? "none" : "1px solid var(--color-border)" }}>
                  <span className="text-xs font-bold w-4 shrink-0" style={{ color: "var(--color-text-ghost)" }}>{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold truncate">{u.name ?? u.username ?? "Unknown"}</p>
                    {u.username && <p className="text-[10px] truncate" style={{ color: "var(--color-text-ghost)" }}>@{u.username}</p>}
                  </div>
                  <span className="text-xs font-black shrink-0" style={{ color: "#4ade80" }}>{u.count.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </ClipCard>

          <ClipCard>
            <div className="px-5 py-4">
              <p className="text-[10px] font-black tracking-widest uppercase mb-3" style={{ color: "var(--color-text-ghost)" }}>Top Creators</p>
              {community.topCreators.length === 0 ? (
                <p className="text-sm py-4 text-center" style={{ color: "var(--color-text-ghost)" }}>No battles yet.</p>
              ) : community.topCreators.map((u, i) => (
                <div key={i} className="flex items-center gap-2 py-2"
                  style={{ borderTop: i === 0 ? "none" : "1px solid var(--color-border)" }}>
                  <span className="text-xs font-bold w-4 shrink-0" style={{ color: "var(--color-text-ghost)" }}>{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold truncate">{u.name ?? u.username ?? "Unknown"}</p>
                    {u.username && <p className="text-[10px] truncate" style={{ color: "var(--color-text-ghost)" }}>@{u.username}</p>}
                  </div>
                  <span className="text-xs font-black shrink-0" style={{ color: "#f87171" }}>{u.count.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </ClipCard>

          <ClipCard>
            <div className="px-5 py-4">
              <p className="text-[10px] font-black tracking-widest uppercase mb-3" style={{ color: "var(--color-text-ghost)" }}>Rank Distribution</p>
              {community.rankDistribution.length === 0 ? (
                <p className="text-sm py-4 text-center" style={{ color: "var(--color-text-ghost)" }}>No users yet.</p>
              ) : (() => {
                const maxCount = Math.max(...community.rankDistribution.map((r) => r.count));
                return community.rankDistribution.map((r, i) => {
                  const color = RANK_COLORS[r.rank] ?? "var(--color-accent)";
                  return (
                    <div key={r.rank} className="flex items-center gap-2 py-1.5"
                      style={{ borderTop: i === 0 ? "none" : "1px solid var(--color-border)" }}>
                      <span className="text-[10px] font-bold w-20 shrink-0 truncate" style={{ color }}>{r.rank}</span>
                      <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "var(--color-border)" }}>
                        <div className="h-full rounded-full" style={{ width: `${Math.round((r.count / maxCount) * 100)}%`, background: color }} />
                      </div>
                      <span className="text-[10px] font-black w-5 text-right shrink-0" style={{ color }}>{r.count}</span>
                    </div>
                  );
                });
              })()}
            </div>
          </ClipCard>
        </div>
      </section>

      {/* Conversion funnel */}
      <section className="space-y-3">
        <SectionLabel icon={Users} label="Guest → Registered Funnel" />
        <ClipCard>
          <div className="p-5 space-y-4">
            {[
              { label: "Unique Sessions (Visitors)", value: trafficStats.conversionFunnel.visitors,         pct: 100,        color: "var(--color-accent)" },
              { label: "Logged-in Voters",           value: trafficStats.conversionFunnel.registeredVoters, pct: trafficStats.conversionFunnel.visitors > 0 ? Math.round((trafficStats.conversionFunnel.registeredVoters / trafficStats.conversionFunnel.visitors) * 100) : 0, color: "#22c55e" },
            ].map((row) => (
              <div key={row.label} className="space-y-1">
                <div className="flex justify-between text-xs font-semibold">
                  <span>{row.label}</span>
                  <span className="font-black" style={{ color: row.color }}>{row.value.toLocaleString()} ({row.pct}%)</span>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--color-border)" }}>
                  <div className="h-full rounded-full" style={{ width: `${row.pct}%`, background: row.color }} />
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
