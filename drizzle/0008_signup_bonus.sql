-- drizzle-orm: no-transaction
ALTER TYPE "public"."transaction_type" ADD VALUE 'signup_bonus';

INSERT INTO "admin_settings" ("key", "value", "label")
VALUES ('signup_bonus_points', 50, 'One-time XP bonus awarded on first login')
ON CONFLICT ("key") DO NOTHING;
