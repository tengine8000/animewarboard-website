ALTER TYPE "public"."transaction_type" ADD VALUE 'vote_cast';--> statement-breakpoint
INSERT INTO "admin_settings" ("key", "value", "label")
VALUES ('vote_cast_points', 5, 'XP awarded to voter on first battle vote cast')
ON CONFLICT ("key") DO NOTHING;
