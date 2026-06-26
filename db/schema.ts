import {
  pgTable,
  pgEnum,
  uuid,
  text,
  boolean,
  smallint,
  integer,
  date,
  jsonb,
  timestamp,
  index,
  uniqueIndex,
  check,
  type AnyPgColumn,
} from "drizzle-orm/pg-core";
import { customType } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

// ---------------------------------------------------------------------------
// Custom types
// ---------------------------------------------------------------------------

const tsvector = customType<{ data: string }>({
  dataType() {
    return "tsvector";
  },
});

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

export const userRoleEnum = pgEnum("user_role", ["user", "moderator", "admin", "banned"]);

export const entityStatusEnum = pgEnum("entity_status", ["pending", "approved", "rejected"]);

export const matchupSideEnum = pgEnum("matchup_side", ["a", "b"]);

export const voteVerdictEnum = pgEnum("vote_verdict", ["a", "b", "draw"]);

export const voteDifficultyEnum = pgEnum("vote_difficulty", [
  "very_easy",
  "easy",
  "medium",
  "hard",
  "extreme",
]);

export const commentTypeEnum = pgEnum("comment_type", ["matchup", "entity"]);

export const transactionTypeEnum = pgEnum("transaction_type", [
  "daily_login",
  "streak_bonus",
  "comment_upvoted",
  "comment_downvoted",
  "vote_upvoted",
  "entity_approved",
  "entity_stat_rated",
  "account_milestone",
  "flag_content",
  "flag_rewarded",
  "flag_dismissed",
  "boost_matchup",
  "content_penalty",
  "admin_adjustment",
]);

export const transactionRefTypeEnum = pgEnum("transaction_ref_type", [
  "comment",
  "matchup",
  "entity",
  "vote",
  "system",
]);

export const notificationTypeEnum = pgEnum("notification_type", [
  "reply_to_comment",
  "comment_upvoted",
  "entity_approved",
  "entity_rejected",
  "flag_confirmed",
  "flag_dismissed",
  "admin_point_adjustment",
]);

export const notificationRefTypeEnum = pgEnum("notification_ref_type", [
  "matchup_comment",
  "entity_comment",
  "entity",
]);

export const analyticsEventTypeEnum = pgEnum("analytics_event_type", [
  "page_view",
  "prediction_submitted",
  "anonymous_prediction",
  "battle_hopped",
  "comment_posted",
  "share_card_opened",
]);

export const sponsorPlacementEnum = pgEnum("sponsor_placement", [
  "matchup_of_the_week",
  "sidebar",
  "footer",
  "banner",
]);

// ---------------------------------------------------------------------------
// 1. users
// ---------------------------------------------------------------------------

export const users = pgTable("users", {
  id:              uuid("id").primaryKey().defaultRandom(),
  email:           text("email").notNull().unique(),
  name:            text("name"),
  // `image` is the Auth.js-compatible field name (avatar URL)
  image:           text("image"),
  emailVerified:   timestamp("email_verified", { withTimezone: true, mode: "date" }),
  passwordHash:    text("password_hash"),  // null for OAuth-only users
  role:            userRoleEnum("role").notNull().default("user"),
  isPatron:        boolean("is_patron").notNull().default(false),
  lastLoginDate:   date("last_login_date"),
  loginStreak:     integer("login_streak").notNull().default(0),
  restrictedUntil: timestamp("restricted_until", { withTimezone: true, mode: "date" }),
  createdAt:       timestamp("created_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
});

// ---------------------------------------------------------------------------
// 2. auth_accounts  (Auth.js v5 Drizzle adapter compatible)
// ---------------------------------------------------------------------------

export const authAccounts = pgTable("auth_accounts", {
  id:                uuid("id").primaryKey().defaultRandom(),
  userId:            uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type:              text("type").notNull(),              // "oauth" | "oidc" | "email" | "credentials"
  provider:          text("provider").notNull(),          // google | discord | reddit | twitter | facebook | credentials
  providerAccountId: text("provider_account_id").notNull(),
  refreshToken:      text("refresh_token"),
  accessToken:       text("access_token"),
  expiresAt:         integer("expires_at"),
  tokenType:         text("token_type"),
  scope:             text("scope"),
  idToken:           text("id_token"),
  sessionState:      text("session_state"),
  createdAt:         timestamp("created_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
}, (t) => [
  uniqueIndex("auth_accounts_provider_account_idx").on(t.provider, t.providerAccountId),
  index("auth_accounts_user_idx").on(t.userId),
]);

// ---------------------------------------------------------------------------
// 3. verification_tokens  (Auth.js — email magic link / passwordless)
// ---------------------------------------------------------------------------

export const verificationTokens = pgTable("verification_tokens", {
  identifier: text("identifier").notNull(),
  token:      text("token").notNull(),
  expires:    timestamp("expires", { withTimezone: true, mode: "date" }).notNull(),
}, (t) => [
  uniqueIndex("verification_tokens_identifier_token_idx").on(t.identifier, t.token),
]);

// ---------------------------------------------------------------------------
// 4. categories  (Anime, Soccer, Naruto, Bleach…)
// ---------------------------------------------------------------------------

export const categories = pgTable("categories", {
  id:           uuid("id").primaryKey().defaultRandom(),
  parentId:     uuid("parent_id").references((): AnyPgColumn => categories.id),
  name:         text("name").notNull(),
  slug:         text("slug").notNull().unique(),
  description:  text("description"),
  coverImage:   text("cover_image"),
  entityLabel:  text("entity_label").notNull().default("Character"),
  matchupLabel: text("matchup_label").notNull().default("Battle"),
  searchVec:    tsvector("search_vec"),
  createdAt:    timestamp("created_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
}, (t) => [
  index("categories_parent_idx").on(t.parentId),
  index("categories_search_vec_gin").using("gin", t.searchVec),
]);

// ---------------------------------------------------------------------------
// 5. attributes  (Speed, Strength, Goals…)
// category_id MUST point to a TOP-LEVEL category (parent_id IS NULL)
// ---------------------------------------------------------------------------

export const attributes = pgTable("attributes", {
  id:          uuid("id").primaryKey().defaultRandom(),
  categoryId:  uuid("category_id").notNull().references(() => categories.id),
  name:        text("name").notNull(),
  slug:        text("slug").notNull(),
  description: text("description"),
  sortOrder:   smallint("sort_order").notNull().default(0),
  createdAt:   timestamp("created_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
}, (t) => [
  uniqueIndex("attributes_category_slug_idx").on(t.categoryId, t.slug),
  index("attributes_category_sort_idx").on(t.categoryId, t.sortOrder),
]);

// ---------------------------------------------------------------------------
// 6. entities  (characters, players…)
// category_id MUST point to a LEAF category (parent_id IS NOT NULL)
// search_vec must be kept in sync via DB trigger or app layer on name change
// ---------------------------------------------------------------------------

export const entities = pgTable("entities", {
  id:             uuid("id").primaryKey().defaultRandom(),
  categoryId:     uuid("category_id").notNull().references(() => categories.id),
  name:           text("name").notNull(),
  slug:           text("slug").notNull().unique(),
  bio:            text("bio"),
  imageUrl:       text("image_url"),
  imageSourceUrl: text("image_source_url"),
  status:         entityStatusEnum("status").notNull().default("pending"),
  createdBy:      uuid("created_by").references(() => users.id),
  searchVec:      tsvector("search_vec"),
  createdAt:      timestamp("created_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
}, (t) => [
  index("entities_category_idx").on(t.categoryId),
  index("entities_status_idx").on(t.status),
  index("entities_search_vec_gin").using("gin", t.searchVec),
]);

// ---------------------------------------------------------------------------
// 7. entity_variants  (Base Naruto, Sage Mode Naruto…)
// If image_url is null, fall back to entities.image_url at render time.
// ---------------------------------------------------------------------------

export const entityVariants = pgTable("entity_variants", {
  id:             uuid("id").primaryKey().defaultRandom(),
  entityId:       uuid("entity_id").notNull().references(() => entities.id, { onDelete: "cascade" }),
  name:           text("name").notNull(),
  slug:           text("slug").notNull().unique(),
  imageUrl:       text("image_url"),
  imageSourceUrl: text("image_source_url"),
  isDefault:      boolean("is_default").notNull().default(false),
  createdAt:      timestamp("created_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
}, (t) => [
  index("entity_variants_entity_idx").on(t.entityId),
]);

// ---------------------------------------------------------------------------
// 8. entity_stats  (admin-set, absolute values, one row per variant per attribute)
// ---------------------------------------------------------------------------

export const entityStats = pgTable("entity_stats", {
  id:          uuid("id").primaryKey().defaultRandom(),
  variantId:   uuid("variant_id").notNull().references(() => entityVariants.id, { onDelete: "cascade" }),
  attributeId: uuid("attribute_id").notNull().references(() => attributes.id),
  value:       smallint("value").notNull(),
  updatedAt:   timestamp("updated_at", { withTimezone: true, mode: "date" }).notNull().defaultNow().$onUpdate(() => new Date()),
}, (t) => [
  uniqueIndex("entity_stats_variant_attr_idx").on(t.variantId, t.attributeId),
  index("entity_stats_variant_idx").on(t.variantId),
  check("entity_stats_value_range", sql`${t.value} between 0 and 100`),
]);

// ---------------------------------------------------------------------------
// 9. community_entity_stats  (user-submitted, one row per user per variant per attribute)
// Community avg = AVG(value) WHERE variant_id = X AND attribute_id = Y
// ---------------------------------------------------------------------------

export const communityEntityStats = pgTable("community_entity_stats", {
  id:          uuid("id").primaryKey().defaultRandom(),
  variantId:   uuid("variant_id").notNull().references(() => entityVariants.id, { onDelete: "cascade" }),
  attributeId: uuid("attribute_id").notNull().references(() => attributes.id),
  userId:      uuid("user_id").notNull().references(() => users.id),
  value:       smallint("value").notNull(),
  updatedAt:   timestamp("updated_at", { withTimezone: true, mode: "date" }).notNull().defaultNow().$onUpdate(() => new Date()),
}, (t) => [
  uniqueIndex("community_stats_variant_attr_user_idx").on(t.variantId, t.attributeId, t.userId),
  index("community_stats_variant_attr_idx").on(t.variantId, t.attributeId),
  check("community_stats_value_range", sql`${t.value} between 0 and 100`),
]);

// ---------------------------------------------------------------------------
// 10. matchups
// category_id MUST point to a TOP-LEVEL category (parent_id IS NULL).
// canonical_hash: SHA-256(sort(sideA slugs)|::|sort(sideB slugs), smaller side first)
// ---------------------------------------------------------------------------

export const matchups = pgTable("matchups", {
  id:            uuid("id").primaryKey().defaultRandom(),
  categoryId:    uuid("category_id").notNull().references(() => categories.id),
  slug:          text("slug").notNull().unique(),
  canonicalHash: text("canonical_hash").notNull().unique(),
  sideALabel:    text("side_a_label"),
  sideBLabel:    text("side_b_label"),
  createdBy:     uuid("created_by").references(() => users.id),
  createdAt:     timestamp("created_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
}, (t) => [
  index("matchups_canonical_hash_idx").on(t.canonicalHash),
  index("matchups_category_idx").on(t.categoryId),
  index("matchups_created_at_idx").on(t.createdAt),
]);

// ---------------------------------------------------------------------------
// 11. matchup_participants  (which variants are on each side)
// UNIQUE(matchup_id, variant_id) prevents same variant appearing on both sides.
// sort_order drives carousel display order when a side has 2+ participants.
// ---------------------------------------------------------------------------

export const matchupParticipants = pgTable("matchup_participants", {
  id:        uuid("id").primaryKey().defaultRandom(),
  matchupId: uuid("matchup_id").notNull().references(() => matchups.id, { onDelete: "cascade" }),
  side:      matchupSideEnum("side").notNull(),
  variantId: uuid("variant_id").notNull().references(() => entityVariants.id),
  sortOrder: smallint("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
}, (t) => [
  uniqueIndex("matchup_participants_matchup_variant_idx").on(t.matchupId, t.variantId),
  index("matchup_participants_matchup_side_order_idx").on(t.matchupId, t.side, t.sortOrder),
  index("matchup_participants_variant_idx").on(t.variantId),
]);

// ---------------------------------------------------------------------------
// 12. votes  (official registered-user verdict)
// ---------------------------------------------------------------------------

export const votes = pgTable("votes", {
  id:         uuid("id").primaryKey().defaultRandom(),
  matchupId:  uuid("matchup_id").notNull().references(() => matchups.id, { onDelete: "cascade" }),
  userId:     uuid("user_id").notNull().references(() => users.id),
  verdict:    voteVerdictEnum("verdict").notNull(),
  difficulty: voteDifficultyEnum("difficulty").notNull(),
  createdAt:  timestamp("created_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
}, (t) => [
  uniqueIndex("votes_matchup_user_idx").on(t.matchupId, t.userId),
  index("votes_matchup_verdict_idx").on(t.matchupId, t.verdict),
]);

// ---------------------------------------------------------------------------
// 13. anonymous_votes  (guest soft-votes, kept after merge for audit)
// ---------------------------------------------------------------------------

export const anonymousVotes = pgTable("anonymous_votes", {
  id:           uuid("id").primaryKey().defaultRandom(),
  matchupId:    uuid("matchup_id").notNull().references(() => matchups.id, { onDelete: "cascade" }),
  sessionToken: text("session_token").notNull(),
  verdict:      voteVerdictEnum("verdict").notNull(),
  difficulty:   voteDifficultyEnum("difficulty").notNull(),
  mergedVoteId: uuid("merged_vote_id").references(() => votes.id),
  createdAt:    timestamp("created_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
}, (t) => [
  index("anonymous_votes_session_idx").on(t.sessionToken),
  index("anonymous_votes_matchup_idx").on(t.matchupId),
]);

// ---------------------------------------------------------------------------
// 14. vote_attributes  (shared-100 per-attribute sliders)
// score_b = 100 - score_a. score_b is NEVER stored.
// ---------------------------------------------------------------------------

export const voteAttributes = pgTable("vote_attributes", {
  id:          uuid("id").primaryKey().defaultRandom(),
  matchupId:   uuid("matchup_id").notNull().references(() => matchups.id, { onDelete: "cascade" }),
  userId:      uuid("user_id").notNull().references(() => users.id),
  attributeId: uuid("attribute_id").notNull().references(() => attributes.id),
  scoreA:      smallint("score_a").notNull(),
  updatedAt:   timestamp("updated_at", { withTimezone: true, mode: "date" }).notNull().defaultNow().$onUpdate(() => new Date()),
}, (t) => [
  uniqueIndex("vote_attributes_matchup_user_attr_idx").on(t.matchupId, t.userId, t.attributeId),
  index("vote_attributes_matchup_attr_idx").on(t.matchupId, t.attributeId),
  check("vote_attributes_score_range", sql`${t.scoreA} between 0 and 100`),
]);

// ---------------------------------------------------------------------------
// 15. matchup_comments
// ---------------------------------------------------------------------------

export const matchupComments = pgTable("matchup_comments", {
  id:        uuid("id").primaryKey().defaultRandom(),
  matchupId: uuid("matchup_id").notNull().references(() => matchups.id, { onDelete: "cascade" }),
  userId:    uuid("user_id").notNull().references(() => users.id),
  parentId:  uuid("parent_id").references((): AnyPgColumn => matchupComments.id),
  body:      text("body").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
}, (t) => [
  index("matchup_comments_matchup_idx").on(t.matchupId),
  index("matchup_comments_user_idx").on(t.userId),
  index("matchup_comments_parent_idx").on(t.parentId),
]);

// ---------------------------------------------------------------------------
// 16. entity_comments
// ---------------------------------------------------------------------------

export const entityComments = pgTable("entity_comments", {
  id:        uuid("id").primaryKey().defaultRandom(),
  entityId:  uuid("entity_id").notNull().references(() => entities.id, { onDelete: "cascade" }),
  userId:    uuid("user_id").notNull().references(() => users.id),
  parentId:  uuid("parent_id").references((): AnyPgColumn => entityComments.id),
  body:      text("body").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
}, (t) => [
  index("entity_comments_entity_idx").on(t.entityId),
  index("entity_comments_user_idx").on(t.userId),
  index("entity_comments_parent_idx").on(t.parentId),
]);

// ---------------------------------------------------------------------------
// 17. comment_votes  (upvote/downvote on matchup or entity comments)
// comment_id is polymorphic — references either matchup_comments or entity_comments
// ---------------------------------------------------------------------------

export const commentVotes = pgTable("comment_votes", {
  id:          uuid("id").primaryKey().defaultRandom(),
  commentId:   uuid("comment_id").notNull(),
  commentType: commentTypeEnum("comment_type").notNull(),
  userId:      uuid("user_id").notNull().references(() => users.id),
  value:       smallint("value").notNull(),
  createdAt:   timestamp("created_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
}, (t) => [
  uniqueIndex("comment_votes_comment_user_idx").on(t.commentId, t.commentType, t.userId),
  index("comment_votes_comment_idx").on(t.commentId, t.commentType),
  check("comment_votes_value_check", sql`${t.value} in (1, -1)`),
]);

// ---------------------------------------------------------------------------
// 18. point_transactions  (immutable ledger — no mutable balance on users)
// current_points = SUM(amount) WHERE user_id = X
// lifetime_xp    = SUM(amount) WHERE user_id = X AND amount > 0
// ---------------------------------------------------------------------------

export const pointTransactions = pgTable("point_transactions", {
  id:            uuid("id").primaryKey().defaultRandom(),
  userId:        uuid("user_id").notNull().references(() => users.id),
  amount:        integer("amount").notNull(),
  type:          transactionTypeEnum("type").notNull(),
  referenceId:   uuid("reference_id"),
  referenceType: transactionRefTypeEnum("reference_type"),
  note:          text("note"),
  createdAt:     timestamp("created_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
}, (t) => [
  index("point_transactions_user_amount_idx").on(t.userId, t.amount),
  index("point_transactions_user_created_idx").on(t.userId, t.createdAt),
  index("point_transactions_type_idx").on(t.type),
]);

// ---------------------------------------------------------------------------
// 19. notifications
// ---------------------------------------------------------------------------

export const notifications = pgTable("notifications", {
  id:            uuid("id").primaryKey().defaultRandom(),
  userId:        uuid("user_id").notNull().references(() => users.id),
  type:          notificationTypeEnum("type").notNull(),
  read:          boolean("read").notNull().default(false),
  referenceId:   uuid("reference_id"),
  referenceType: notificationRefTypeEnum("reference_type"),
  createdAt:     timestamp("created_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
}, (t) => [
  index("notifications_user_read_idx").on(t.userId, t.read),
  index("notifications_user_created_idx").on(t.userId, t.createdAt),
]);

// ---------------------------------------------------------------------------
// 20. analytics_events  (internal only, no third-party scripts at launch)
// ---------------------------------------------------------------------------

export const analyticsEvents = pgTable("analytics_events", {
  id:        uuid("id").primaryKey().defaultRandom(),
  sessionId: text("session_id").notNull(),
  userId:    uuid("user_id").references(() => users.id),
  eventType: analyticsEventTypeEnum("event_type").notNull(),
  path:      text("path"),
  referrer:  text("referrer"),
  metadata:  jsonb("metadata"),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
}, (t) => [
  index("analytics_events_type_created_idx").on(t.eventType, t.createdAt),
  index("analytics_events_session_idx").on(t.sessionId),
  index("analytics_events_path_type_idx").on(t.path, t.eventType),
  index("analytics_events_user_idx").on(t.userId),
]);

// ---------------------------------------------------------------------------
// 21. admin_settings  (runtime-configurable point values and XP thresholds)
// ---------------------------------------------------------------------------

export const adminSettings = pgTable("admin_settings", {
  id:        uuid("id").primaryKey().defaultRandom(),
  key:       text("key").notNull().unique(),
  value:     integer("value").notNull(),
  label:     text("label").notNull(),
  updatedBy: uuid("updated_by").references(() => users.id),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).notNull().defaultNow().$onUpdate(() => new Date()),
});

// ---------------------------------------------------------------------------
// 22. sponsors
// ---------------------------------------------------------------------------

export const sponsors = pgTable("sponsors", {
  id:         uuid("id").primaryKey().defaultRandom(),
  name:       text("name").notNull(),
  logoUrl:    text("logo_url"),
  linkUrl:    text("link_url").notNull(),
  placement:  sponsorPlacementEnum("placement").notNull(),
  activeFrom: date("active_from").notNull(),
  activeTo:   date("active_to"),
  createdAt:  timestamp("created_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
}, (t) => [
  index("sponsors_placement_dates_idx").on(t.placement, t.activeFrom, t.activeTo),
]);
