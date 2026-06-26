ALTER TYPE "public"."transaction_type" ADD VALUE 'entity_stat_rated' BEFORE 'account_milestone';

INSERT INTO admin_settings (id, key, value, label, updated_at)
VALUES (gen_random_uuid(), 'entity_stat_rating_points', 5, 'Points earned for first character stat rating submission', NOW())
ON CONFLICT (key) DO NOTHING;