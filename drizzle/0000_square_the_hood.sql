CREATE TYPE "public"."analytics_event_type" AS ENUM('page_view', 'prediction_submitted', 'anonymous_prediction', 'battle_hopped', 'comment_posted', 'share_card_opened');--> statement-breakpoint
CREATE TYPE "public"."comment_type" AS ENUM('matchup', 'entity');--> statement-breakpoint
CREATE TYPE "public"."entity_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."matchup_side" AS ENUM('a', 'b');--> statement-breakpoint
CREATE TYPE "public"."notification_ref_type" AS ENUM('matchup_comment', 'entity_comment', 'entity');--> statement-breakpoint
CREATE TYPE "public"."notification_type" AS ENUM('reply_to_comment', 'comment_upvoted', 'entity_approved', 'entity_rejected', 'flag_confirmed', 'flag_dismissed');--> statement-breakpoint
CREATE TYPE "public"."sponsor_placement" AS ENUM('matchup_of_the_week', 'sidebar', 'footer', 'banner');--> statement-breakpoint
CREATE TYPE "public"."transaction_ref_type" AS ENUM('comment', 'matchup', 'entity', 'vote', 'system');--> statement-breakpoint
CREATE TYPE "public"."transaction_type" AS ENUM('daily_login', 'streak_bonus', 'comment_upvoted', 'comment_downvoted', 'vote_upvoted', 'entity_approved', 'account_milestone', 'flag_content', 'flag_rewarded', 'flag_dismissed', 'boost_matchup', 'content_penalty', 'admin_adjustment');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('user', 'moderator', 'admin', 'banned');--> statement-breakpoint
CREATE TYPE "public"."vote_difficulty" AS ENUM('very_easy', 'easy', 'medium', 'hard', 'extreme');--> statement-breakpoint
CREATE TYPE "public"."vote_verdict" AS ENUM('a', 'b', 'draw');--> statement-breakpoint
CREATE TABLE "admin_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" text NOT NULL,
	"value" integer NOT NULL,
	"label" text NOT NULL,
	"updated_by" uuid,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "admin_settings_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "analytics_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" text NOT NULL,
	"user_id" uuid,
	"event_type" "analytics_event_type" NOT NULL,
	"path" text,
	"referrer" text,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "anonymous_votes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"matchup_id" uuid NOT NULL,
	"session_token" text NOT NULL,
	"verdict" "vote_verdict" NOT NULL,
	"difficulty" "vote_difficulty" NOT NULL,
	"merged_vote_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "attributes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"category_id" uuid NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"sort_order" smallint DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "auth_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"type" text NOT NULL,
	"provider" text NOT NULL,
	"provider_account_id" text NOT NULL,
	"refresh_token" text,
	"access_token" text,
	"expires_at" integer,
	"token_type" text,
	"scope" text,
	"id_token" text,
	"session_state" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"parent_id" uuid,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"cover_image" text,
	"entity_label" text DEFAULT 'Character' NOT NULL,
	"matchup_label" text DEFAULT 'Battle' NOT NULL,
	"search_vec" "tsvector",
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "categories_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "comment_votes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"comment_id" uuid NOT NULL,
	"comment_type" "comment_type" NOT NULL,
	"user_id" uuid NOT NULL,
	"value" smallint NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "comment_votes_value_check" CHECK ("comment_votes"."value" in (1, -1))
);
--> statement-breakpoint
CREATE TABLE "community_entity_stats" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"variant_id" uuid NOT NULL,
	"attribute_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"value" smallint NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "community_stats_value_range" CHECK ("community_entity_stats"."value" between 0 and 100)
);
--> statement-breakpoint
CREATE TABLE "entities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"category_id" uuid NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"image_url" text,
	"image_source_url" text,
	"status" "entity_status" DEFAULT 'pending' NOT NULL,
	"created_by" uuid,
	"search_vec" "tsvector",
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "entities_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "entity_comments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entity_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"parent_id" uuid,
	"body" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "entity_stats" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"variant_id" uuid NOT NULL,
	"attribute_id" uuid NOT NULL,
	"value" smallint NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "entity_stats_value_range" CHECK ("entity_stats"."value" between 0 and 100)
);
--> statement-breakpoint
CREATE TABLE "entity_variants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entity_id" uuid NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"image_url" text,
	"image_source_url" text,
	"is_default" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "entity_variants_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "matchup_comments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"matchup_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"parent_id" uuid,
	"body" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "matchup_participants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"matchup_id" uuid NOT NULL,
	"side" "matchup_side" NOT NULL,
	"variant_id" uuid NOT NULL,
	"sort_order" smallint DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "matchups" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"category_id" uuid NOT NULL,
	"slug" text NOT NULL,
	"canonical_hash" text NOT NULL,
	"side_a_label" text,
	"side_b_label" text,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "matchups_slug_unique" UNIQUE("slug"),
	CONSTRAINT "matchups_canonical_hash_unique" UNIQUE("canonical_hash")
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"type" "notification_type" NOT NULL,
	"read" boolean DEFAULT false NOT NULL,
	"reference_id" uuid,
	"reference_type" "notification_ref_type",
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "point_transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"amount" integer NOT NULL,
	"type" "transaction_type" NOT NULL,
	"reference_id" uuid,
	"reference_type" "transaction_ref_type",
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sponsors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"logo_url" text,
	"link_url" text NOT NULL,
	"placement" "sponsor_placement" NOT NULL,
	"active_from" date NOT NULL,
	"active_to" date,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"name" text,
	"image" text,
	"email_verified" timestamp with time zone,
	"password_hash" text,
	"role" "user_role" DEFAULT 'user' NOT NULL,
	"is_patron" boolean DEFAULT false NOT NULL,
	"last_login_date" date,
	"login_streak" integer DEFAULT 0 NOT NULL,
	"restricted_until" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification_tokens" (
	"identifier" text NOT NULL,
	"token" text NOT NULL,
	"expires" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vote_attributes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"matchup_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"attribute_id" uuid NOT NULL,
	"score_a" smallint NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "vote_attributes_score_range" CHECK ("vote_attributes"."score_a" between 0 and 100)
);
--> statement-breakpoint
CREATE TABLE "votes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"matchup_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"verdict" "vote_verdict" NOT NULL,
	"difficulty" "vote_difficulty" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "admin_settings" ADD CONSTRAINT "admin_settings_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "analytics_events" ADD CONSTRAINT "analytics_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "anonymous_votes" ADD CONSTRAINT "anonymous_votes_matchup_id_matchups_id_fk" FOREIGN KEY ("matchup_id") REFERENCES "public"."matchups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "anonymous_votes" ADD CONSTRAINT "anonymous_votes_merged_vote_id_votes_id_fk" FOREIGN KEY ("merged_vote_id") REFERENCES "public"."votes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attributes" ADD CONSTRAINT "attributes_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auth_accounts" ADD CONSTRAINT "auth_accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "categories" ADD CONSTRAINT "categories_parent_id_categories_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comment_votes" ADD CONSTRAINT "comment_votes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "community_entity_stats" ADD CONSTRAINT "community_entity_stats_variant_id_entity_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."entity_variants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "community_entity_stats" ADD CONSTRAINT "community_entity_stats_attribute_id_attributes_id_fk" FOREIGN KEY ("attribute_id") REFERENCES "public"."attributes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "community_entity_stats" ADD CONSTRAINT "community_entity_stats_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "entities" ADD CONSTRAINT "entities_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "entities" ADD CONSTRAINT "entities_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "entity_comments" ADD CONSTRAINT "entity_comments_entity_id_entities_id_fk" FOREIGN KEY ("entity_id") REFERENCES "public"."entities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "entity_comments" ADD CONSTRAINT "entity_comments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "entity_comments" ADD CONSTRAINT "entity_comments_parent_id_entity_comments_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."entity_comments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "entity_stats" ADD CONSTRAINT "entity_stats_variant_id_entity_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."entity_variants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "entity_stats" ADD CONSTRAINT "entity_stats_attribute_id_attributes_id_fk" FOREIGN KEY ("attribute_id") REFERENCES "public"."attributes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "entity_variants" ADD CONSTRAINT "entity_variants_entity_id_entities_id_fk" FOREIGN KEY ("entity_id") REFERENCES "public"."entities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matchup_comments" ADD CONSTRAINT "matchup_comments_matchup_id_matchups_id_fk" FOREIGN KEY ("matchup_id") REFERENCES "public"."matchups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matchup_comments" ADD CONSTRAINT "matchup_comments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matchup_comments" ADD CONSTRAINT "matchup_comments_parent_id_matchup_comments_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."matchup_comments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matchup_participants" ADD CONSTRAINT "matchup_participants_matchup_id_matchups_id_fk" FOREIGN KEY ("matchup_id") REFERENCES "public"."matchups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matchup_participants" ADD CONSTRAINT "matchup_participants_variant_id_entity_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."entity_variants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matchups" ADD CONSTRAINT "matchups_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matchups" ADD CONSTRAINT "matchups_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "point_transactions" ADD CONSTRAINT "point_transactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vote_attributes" ADD CONSTRAINT "vote_attributes_matchup_id_matchups_id_fk" FOREIGN KEY ("matchup_id") REFERENCES "public"."matchups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vote_attributes" ADD CONSTRAINT "vote_attributes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vote_attributes" ADD CONSTRAINT "vote_attributes_attribute_id_attributes_id_fk" FOREIGN KEY ("attribute_id") REFERENCES "public"."attributes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "votes" ADD CONSTRAINT "votes_matchup_id_matchups_id_fk" FOREIGN KEY ("matchup_id") REFERENCES "public"."matchups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "votes" ADD CONSTRAINT "votes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "analytics_events_type_created_idx" ON "analytics_events" USING btree ("event_type","created_at");--> statement-breakpoint
CREATE INDEX "analytics_events_session_idx" ON "analytics_events" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "analytics_events_path_type_idx" ON "analytics_events" USING btree ("path","event_type");--> statement-breakpoint
CREATE INDEX "analytics_events_user_idx" ON "analytics_events" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "anonymous_votes_session_idx" ON "anonymous_votes" USING btree ("session_token");--> statement-breakpoint
CREATE INDEX "anonymous_votes_matchup_idx" ON "anonymous_votes" USING btree ("matchup_id");--> statement-breakpoint
CREATE UNIQUE INDEX "attributes_category_slug_idx" ON "attributes" USING btree ("category_id","slug");--> statement-breakpoint
CREATE INDEX "attributes_category_sort_idx" ON "attributes" USING btree ("category_id","sort_order");--> statement-breakpoint
CREATE UNIQUE INDEX "auth_accounts_provider_account_idx" ON "auth_accounts" USING btree ("provider","provider_account_id");--> statement-breakpoint
CREATE INDEX "auth_accounts_user_idx" ON "auth_accounts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "categories_parent_idx" ON "categories" USING btree ("parent_id");--> statement-breakpoint
CREATE INDEX "categories_search_vec_gin" ON "categories" USING gin ("search_vec");--> statement-breakpoint
CREATE UNIQUE INDEX "comment_votes_comment_user_idx" ON "comment_votes" USING btree ("comment_id","comment_type","user_id");--> statement-breakpoint
CREATE INDEX "comment_votes_comment_idx" ON "comment_votes" USING btree ("comment_id","comment_type");--> statement-breakpoint
CREATE UNIQUE INDEX "community_stats_variant_attr_user_idx" ON "community_entity_stats" USING btree ("variant_id","attribute_id","user_id");--> statement-breakpoint
CREATE INDEX "community_stats_variant_attr_idx" ON "community_entity_stats" USING btree ("variant_id","attribute_id");--> statement-breakpoint
CREATE INDEX "entities_category_idx" ON "entities" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "entities_status_idx" ON "entities" USING btree ("status");--> statement-breakpoint
CREATE INDEX "entities_search_vec_gin" ON "entities" USING gin ("search_vec");--> statement-breakpoint
CREATE INDEX "entity_comments_entity_idx" ON "entity_comments" USING btree ("entity_id");--> statement-breakpoint
CREATE INDEX "entity_comments_user_idx" ON "entity_comments" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "entity_comments_parent_idx" ON "entity_comments" USING btree ("parent_id");--> statement-breakpoint
CREATE UNIQUE INDEX "entity_stats_variant_attr_idx" ON "entity_stats" USING btree ("variant_id","attribute_id");--> statement-breakpoint
CREATE INDEX "entity_stats_variant_idx" ON "entity_stats" USING btree ("variant_id");--> statement-breakpoint
CREATE INDEX "entity_variants_entity_idx" ON "entity_variants" USING btree ("entity_id");--> statement-breakpoint
CREATE INDEX "matchup_comments_matchup_idx" ON "matchup_comments" USING btree ("matchup_id");--> statement-breakpoint
CREATE INDEX "matchup_comments_user_idx" ON "matchup_comments" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "matchup_comments_parent_idx" ON "matchup_comments" USING btree ("parent_id");--> statement-breakpoint
CREATE UNIQUE INDEX "matchup_participants_matchup_variant_idx" ON "matchup_participants" USING btree ("matchup_id","variant_id");--> statement-breakpoint
CREATE INDEX "matchup_participants_matchup_side_order_idx" ON "matchup_participants" USING btree ("matchup_id","side","sort_order");--> statement-breakpoint
CREATE INDEX "matchup_participants_variant_idx" ON "matchup_participants" USING btree ("variant_id");--> statement-breakpoint
CREATE INDEX "matchups_canonical_hash_idx" ON "matchups" USING btree ("canonical_hash");--> statement-breakpoint
CREATE INDEX "matchups_category_idx" ON "matchups" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "matchups_created_at_idx" ON "matchups" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "notifications_user_read_idx" ON "notifications" USING btree ("user_id","read");--> statement-breakpoint
CREATE INDEX "notifications_user_created_idx" ON "notifications" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "point_transactions_user_amount_idx" ON "point_transactions" USING btree ("user_id","amount");--> statement-breakpoint
CREATE INDEX "point_transactions_user_created_idx" ON "point_transactions" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "point_transactions_type_idx" ON "point_transactions" USING btree ("type");--> statement-breakpoint
CREATE INDEX "sponsors_placement_dates_idx" ON "sponsors" USING btree ("placement","active_from","active_to");--> statement-breakpoint
CREATE UNIQUE INDEX "verification_tokens_identifier_token_idx" ON "verification_tokens" USING btree ("identifier","token");--> statement-breakpoint
CREATE UNIQUE INDEX "vote_attributes_matchup_user_attr_idx" ON "vote_attributes" USING btree ("matchup_id","user_id","attribute_id");--> statement-breakpoint
CREATE INDEX "vote_attributes_matchup_attr_idx" ON "vote_attributes" USING btree ("matchup_id","attribute_id");--> statement-breakpoint
CREATE UNIQUE INDEX "votes_matchup_user_idx" ON "votes" USING btree ("matchup_id","user_id");--> statement-breakpoint
CREATE INDEX "votes_matchup_verdict_idx" ON "votes" USING btree ("matchup_id","verdict");