export const dynamic = "force-dynamic";

import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { adminSettings } from "@/db/schema";
import { asc } from "drizzle-orm";
import { updateAdminSettingAction } from "@/app/actions/admin";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Admin — Settings" };

// Group labels for display
const GROUPS: Record<string, string> = {
  daily_login_points:         "Points & Login",
  login_streak_bonus_day:     "Points & Login",
  streak_bonus_multiplier:    "Points & Login",
  account_milestone_points:   "Points & Login",
  comment_upvote_points:      "Points & Login",
  comment_downvote_points:    "Points & Login",
  vote_upvote_points:         "Points & Login",
  entity_approved_points:     "Points & Login",
  entity_stat_rating_points:  "Points & Login",
  battle_vote_points:         "Points & Login",
  signup_bonus_points:        "Points & Login",
  corporal_xp_threshold:      "XP Thresholds",
  sergeant_xp_threshold:      "XP Thresholds",
  lieutenant_xp_threshold:    "XP Thresholds",
  colonel_xp_threshold:       "XP Thresholds",
  general_xp_threshold:       "XP Thresholds",
  field_marshal_xp_threshold: "XP Thresholds",
  boost_matchup_cost:              "Spend Costs",
  flag_content_cost:               "Spend Costs",
  flag_valid_multiplier:           "Spend Costs",
  flag_invalid_multiplier:         "Spend Costs",
  content_penalty_points:          "Spend Costs",
  username_change_cooldown_days:   "User Settings",
  characters_per_page:             "Content Display",
  anime_per_page:                  "Content Display",
  battles_per_page:                "Content Display",
};

export default async function AdminSettingsPage() {
  const session = await auth();
  if ((session?.user as any)?.role !== "admin") redirect("/");

  const rows = await db.select().from(adminSettings).orderBy(asc(adminSettings.key));

  // Group by category
  const grouped = new Map<string, typeof rows>();
  for (const row of rows) {
    const g = GROUPS[row.key] ?? "Other";
    const list = grouped.get(g) ?? [];
    list.push(row);
    grouped.set(g, list);
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
      <div>
        <h1 className="text-2xl font-black tracking-tight">Admin Settings</h1>
        <p className="text-sm mt-1" style={{ color: "var(--color-text-muted)" }}>
          All point values and XP thresholds. Changes take effect immediately — no redeploy needed.
        </p>
      </div>

      {Array.from(grouped.entries()).map(([group, settings]) => (
        <section key={group} className="space-y-2">
          <h2 className="text-[10px] font-black tracking-widest uppercase" style={{ color: "var(--color-text-ghost)" }}>
            {group}
          </h2>
          <div style={{ border: "1px solid var(--color-border)" }}>
            {settings.map((setting, i) => (
              <form
                key={setting.key}
                action={async (fd: FormData) => {
                  "use server";
                  const v = parseInt(fd.get("value") as string, 10);
                  if (!isNaN(v)) await updateAdminSettingAction(setting.key, v);
                }}
                className="flex items-center justify-between gap-4 px-5 py-3"
                style={{ borderTop: i === 0 ? "none" : "1px solid var(--color-border)" }}
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold">{setting.label}</p>
                  <p className="text-[10px] font-mono" style={{ color: "var(--color-text-ghost)" }}>{setting.key}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <input
                    name="value"
                    type="number"
                    defaultValue={setting.value}
                    min={-9999} max={99999}
                    className="w-24 text-right text-sm font-black px-2 py-1 outline-none"
                    style={{
                      background: "var(--color-bg)",
                      border: "1px solid var(--color-border)",
                      color: "var(--color-text-base)",
                    }}
                  />
                  <button
                    type="submit"
                    className="text-[10px] font-black tracking-widest uppercase px-3 py-1.5 transition-opacity hover:opacity-80"
                    style={{ background: "var(--color-accent)", color: "#fff" }}
                  >
                    Save
                  </button>
                </div>
              </form>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
