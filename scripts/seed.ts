import "dotenv/config";
import { db } from "../db";
import { adminSettings } from "../db/schema";

const DEFAULTS: { key: string; value: number; label: string }[] = [
  { key: "daily_login_points",           value: 10,    label: "Daily login reward" },
  { key: "streak_bonus_multiplier",      value: 2,     label: "Login streak day-7 multiplier" },
  { key: "login_streak_bonus_day",       value: 7,     label: "Which streak day triggers the bonus multiplier" },
  { key: "comment_upvote_points",        value: 5,     label: "Points earned when comment is upvoted" },
  { key: "comment_downvote_points",      value: -2,    label: "Points lost when comment is downvoted" },
  { key: "vote_upvote_points",           value: 3,     label: "Points earned when verdict is upvoted" },
  { key: "entity_approved_points",       value: 50,    label: "Points for approved entity submission" },
  { key: "account_milestone_points",     value: 20,    label: "Points for account age milestones" },
  { key: "flag_content_cost",            value: 10,    label: "Points spent upfront when submitting a flag" },
  { key: "flag_valid_multiplier",        value: 2,     label: "Reward multiplier when flag is confirmed valid" },
  { key: "flag_invalid_multiplier",      value: 2,     label: "Penalty multiplier when flag is dismissed as invalid" },
  { key: "boost_matchup_cost",           value: 25,    label: "Points spent to boost a matchup to trending" },
  { key: "content_penalty_points",       value: 15,    label: "Points deducted from the user whose content was removed" },
  { key: "battle_vote_points",           value: 2,     label: "XP awarded to battle creator per new voter" },
  { key: "corporal_xp_threshold",        value: 100,   label: "Lifetime XP needed for Corporal rank" },
  { key: "sergeant_xp_threshold",        value: 300,   label: "Lifetime XP needed for Sergeant rank" },
  { key: "lieutenant_xp_threshold",      value: 750,   label: "Lifetime XP needed for Lieutenant rank" },
  { key: "colonel_xp_threshold",         value: 2000,  label: "Lifetime XP needed for Colonel rank" },
  { key: "general_xp_threshold",         value: 5000,  label: "Lifetime XP needed for General rank" },
  { key: "field_marshal_xp_threshold",   value: 15000, label: "Lifetime XP needed for Field Marshal rank" },
];

async function main() {
  console.log("Seeding admin_settings...");
  for (const row of DEFAULTS) {
    await db
      .insert(adminSettings)
      .values(row)
      .onConflictDoNothing({ target: adminSettings.key });
  }
  console.log(`✅ Seeded ${DEFAULTS.length} admin_settings rows (skipped existing).`);
  process.exit(0);
}

main().catch((err) => { console.error(err); process.exit(1); });
