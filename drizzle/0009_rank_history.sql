CREATE TABLE IF NOT EXISTS "rank_upgrades" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL,
  "rank" text NOT NULL,
  "achieved_at" timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "rank_upgrades_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "rank_upgrades_user_idx" ON "rank_upgrades" ("user_id");
