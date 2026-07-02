-- Add code column as nullable first so existing rows don't violate NOT NULL
ALTER TABLE "matchups" ADD COLUMN "code" text;--> statement-breakpoint

-- Backfill existing battles with a deterministic code derived from their UUID
UPDATE "matchups"
SET "code" = 'AWB-' || upper(substr(md5(id::text), 1, 7))
WHERE "code" IS NULL;--> statement-breakpoint

-- Now enforce NOT NULL and uniqueness
ALTER TABLE "matchups" ALTER COLUMN "code" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "matchups" ADD CONSTRAINT "matchups_code_unique" UNIQUE("code");--> statement-breakpoint
CREATE INDEX "matchups_code_idx" ON "matchups" USING btree ("code");
