ALTER TYPE "public"."transaction_type" ADD VALUE 'battle_vote_received';--> statement-breakpoint
INSERT INTO "admin_settings" ("key", "value", "label")
VALUES ('battle_vote_points', 2, 'XP awarded to battle creator per new voter')
ON CONFLICT ("key") DO NOTHING;