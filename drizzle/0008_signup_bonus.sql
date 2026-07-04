-- drizzle-orm: no-transaction
ALTER TYPE "public"."transaction_type" ADD VALUE 'signup_bonus';

INSERT INTO "admin_settings" ("key", "value")
VALUES ('signup_bonus_points', '50')
ON CONFLICT ("key") DO NOTHING;
