# Tests & Feedback — AnimeWarBoard

## Pending Tasks (planned 2026-06-29)

---

### 1. Character submission flow for regular users
- Unlock a `/characters/submit` page for users at **Sergeant** rank or above
- Use the existing `RankGateToast` / rank gate pattern to block lower-ranked users
- Submissions insert with `status = "pending"` (same as current admin flow)
- Admin approves or rejects from `/admin/submissions` (page already exists)
- Notify submitter on approval/rejection via the `notifications` table (actions already written: `approveEntityAction`, `rejectEntityAction`)

### 2. Battle creation rank gate
- Decide minimum rank for creating battles (suggestion: **Corporal**)
- Add rank check to `createMatchupAction` in `app/actions/matchup.ts`
- Add rank gate UI on `/battles/create` page — fire `awb:rank-gate` CustomEvent if below threshold so `RankGateToast` shows

### 3. Commit & push remaining pre-existing polish
- Files: nav, footer, globals.css, layout, login/register forms, rank-badge, image-upload-crop, etc.
- These were modified before the current session and just need to be staged and pushed

### 4. Deployment
- Set all env vars on host (DATABASE_URL, REDIS_URL, AUTH_SECRET, all 5 OAuth provider IDs/secrets)
- Run `npx drizzle-kit migrate` on production DB
- Seed `admin_settings` rows on production
- Verify `public/uploads/` storage or swap to S3/R2 if needed

### 5. OAuth flow deep testing (after deployment)
- Google — sign in, auto-username generated, profile visible at `/u/[username]`
- Discord — same
- Reddit — same
- X (Twitter) — same
- Facebook — same
- Verify: existing email user cannot collide with OAuth user on same email
- Verify: username change cooldown works across sessions
