@AGENTS.md

# AnimeWarBoard.com

All planning docs are in `learnings/animewarboard/`:
- `how-it-should-work.md` — full concept doc + all locked decisions (6 revisions)
- `db-schema.md` — DB schema + 10 critical user flows mapped to tables
- `tasks.md` — 12-phase task checklist

Read `db-schema.md` and `how-it-should-work.md` before writing any code.

## Fork source
This project is forked from eFinidata at `/Users/mac/Desktop/efinidata`.
Before scaffolding, read these files from eFinidata to copy the exact patterns — do NOT guess:
- `/Users/mac/Desktop/efinidata/package.json` — exact Next.js version to match
- `/Users/mac/Desktop/efinidata/lib/db.ts` — Drizzle + PostgreSQL connection
- `/Users/mac/Desktop/efinidata/lib/redis.ts` — Redis client
- `/Users/mac/Desktop/efinidata/tailwind.config.ts` — Tailwind + CSS variables
- `/Users/mac/Desktop/efinidata/next.config.ts` — base Next.js config

Copy only the utility/config layer above. Do NOT copy pages, components, or schema.

## Where we start
Phase 0 — repo setup. The DB schema is fully designed. No code has been written yet.

1. Scaffold Next.js matching the exact version in `/Users/mac/Desktop/efinidata/package.json`
2. Copy utility patterns from eFinidata (paths above)
3. Set up `.env.local` (DB, Redis, Auth.js secrets)
4. Write Drizzle schema from `learnings/animewarboard/db-schema.md`
5. Run first migration
6. Auth.js v5 with 6 providers: Email, Google, Discord, Reddit, X, Facebook

## Hard rules
- `npm install` always uses `--legacy-peer-deps`
- All OG image routes must have `export const dynamic = "force-dynamic"`
- Battle pages are dynamically generated — never statically pre-built
- Sitemap: hub pages only (`/`, `/anime/[slug]`, `/characters/[slug]`)
- `score_b` on `battle_stat_votes` is NEVER stored — always computed as `100 − score_a`
- No mutable `balance` or `lifetime_xp` columns on `users` — always derived from `point_transactions`
