CREATE TYPE "public"."conversation_kind" AS ENUM('DIRECT', 'GROUP', 'TEAM_INTERNAL', 'TEAM_CONNECTION');--> statement-breakpoint
CREATE TYPE "public"."friendship_status" AS ENUM('PENDING', 'ACCEPTED', 'DECLINED', 'BLOCKED');--> statement-breakpoint
CREATE TYPE "public"."draft_status" AS ENUM('PENDING', 'ACTIVE', 'COMPLETED', 'EXPIRED');--> statement-breakpoint
CREATE TYPE "public"."draft_turn" AS ENUM('BLUE_BAN_1', 'RED_BAN_1', 'BLUE_BAN_2', 'RED_BAN_2', 'BLUE_BAN_3', 'RED_BAN_3', 'BLUE_PICK_1', 'RED_PICK_1', 'RED_PICK_2', 'BLUE_PICK_2', 'BLUE_PICK_3', 'RED_PICK_3', 'RED_BAN_4', 'BLUE_BAN_4', 'RED_BAN_5', 'BLUE_BAN_5', 'RED_PICK_4', 'BLUE_PICK_4', 'BLUE_PICK_5', 'RED_PICK_5');--> statement-breakpoint
CREATE TYPE "public"."rank_division" AS ENUM('I', 'II', 'III', 'IV');--> statement-breakpoint
CREATE TYPE "public"."rank_tier" AS ENUM('IRON', 'BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'EMERALD', 'DIAMOND', 'MASTER', 'GRANDMASTER', 'CHALLENGER');--> statement-breakpoint
CREATE TYPE "public"."scrim_status" AS ENUM('OPEN', 'REQUESTED', 'ACCEPTED', 'CONFIRMED', 'CANCELLED', 'COMPLETED');--> statement-breakpoint
CREATE TYPE "public"."activity_level" AS ENUM('CASUAL', 'REGULAR', 'COMPETITIVE', 'HARDCORE');--> statement-breakpoint
CREATE TYPE "public"."invite_status" AS ENUM('PENDING', 'ACCEPTED', 'DECLINED', 'EXPIRED');--> statement-breakpoint
CREATE TYPE "public"."rank" AS ENUM('IRON', 'BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'EMERALD', 'DIAMOND', 'MASTER', 'GRANDMASTER', 'CHALLENGER', 'UNRANKED');--> statement-breakpoint
CREATE TYPE "public"."region" AS ENUM('br', 'eune', 'euw', 'jp', 'lan', 'las', 'na', 'oce', 'kr', 'ru', 'tr', 'me', 'ph', 'sg', 'th', 'tw', 'vn', 'pbe');--> statement-breakpoint
CREATE TYPE "public"."team_member_role" AS ENUM('TOP', 'JUNGLE', 'MID', 'BOT', 'SUPPORT', 'SUB', 'COACH');--> statement-breakpoint
CREATE TABLE "accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" uuid NOT NULL,
	"username" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	CONSTRAINT "accounts_account_id_unique" UNIQUE("account_id")
);
--> statement-breakpoint
CREATE TABLE "conversation_participants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"conversation_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"joined_at" timestamp NOT NULL,
	"left_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "conversations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255),
	"is_group" boolean DEFAULT false NOT NULL,
	"kind" "conversation_kind" DEFAULT 'DIRECT' NOT NULL,
	"scope_key" varchar(255),
	"primary_team_id" uuid,
	"secondary_team_id" uuid,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	CONSTRAINT "conversations_scope_key_unique" UNIQUE("scope_key")
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"conversation_id" uuid NOT NULL,
	"sender_id" uuid NOT NULL,
	"content" text NOT NULL,
	"is_read" boolean DEFAULT false NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "draft_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"draft_history_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"is_guest" boolean NOT NULL,
	"team" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "drafts_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"room_id" uuid NOT NULL,
	"draft_index" smallint NOT NULL,
	"red" jsonb NOT NULL,
	"tournament_code" text DEFAULT '' NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "drafts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"room_id" uuid NOT NULL,
	"draft_index" smallint NOT NULL,
	"red" jsonb NOT NULL,
	"members" jsonb NOT NULL,
	"state" text DEFAULT 'waiting' NOT NULL,
	"turn" jsonb,
	"turn_start" integer DEFAULT 0 NOT NULL,
	"current_turn_time" integer DEFAULT 0 NOT NULL,
	"can_repeat_previous_turn" boolean DEFAULT false NOT NULL,
	"tournament_code" text DEFAULT '' NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "friendships" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"requester_id" uuid NOT NULL,
	"addressee_id" uuid NOT NULL,
	"status" "friendship_status" DEFAULT 'PENDING' NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	CONSTRAINT "friendships_unique_pair" UNIQUE("requester_id","addressee_id")
);
--> statement-breakpoint
CREATE TABLE "match_history" (
	"match_id" text PRIMARY KEY NOT NULL,
	"puuid" text NOT NULL,
	"queue_id" integer NOT NULL,
	"game_creation" timestamp with time zone NOT NULL,
	"game_duration" integer NOT NULL,
	"champion_id" integer NOT NULL,
	"kills" integer NOT NULL,
	"deaths" integer NOT NULL,
	"assists" integer NOT NULL,
	"win" boolean NOT NULL,
	"total_damage_dealt" integer,
	"total_damage_dealt_to_champions" integer,
	"vision_score" integer,
	"gold_earned" integer,
	"total_minions_killed" integer,
	"neutral_minions_killed" integer,
	"wards_placed" integer,
	"wards_killed" integer,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"read" boolean DEFAULT false NOT NULL,
	"type" text NOT NULL,
	"data" jsonb,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ranked_stats" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"puuid" text NOT NULL,
	"queue_type" text NOT NULL,
	"tier" text,
	"division" text,
	"league_points" integer DEFAULT 0 NOT NULL,
	"wins" integer DEFAULT 0 NOT NULL,
	"losses" integer DEFAULT 0 NOT NULL,
	"hot_streak" integer DEFAULT 0,
	"veteran" integer DEFAULT 0,
	"fresh_blood" integer DEFAULT 0,
	"inactive" integer DEFAULT 0,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "region_change_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"old_region" varchar(255),
	"new_region" varchar(255) NOT NULL,
	"changed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "riot_accounts" (
	"puuid" text PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"game_name" text NOT NULL,
	"tag_line" text NOT NULL,
	"primary_region" text NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	CONSTRAINT "riot_accounts_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "room_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"room_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"socket_id" text NOT NULL,
	"is_guest" boolean NOT NULL,
	"team" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rooms" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"pick_type" text NOT NULL,
	"draft_mode" text NOT NULL,
	"drafts_count" smallint DEFAULT 1 NOT NULL,
	"members" jsonb NOT NULL,
	"drafts" jsonb NOT NULL,
	"current_draft" smallint DEFAULT 0 NOT NULL,
	"disabled_turns" smallint[] DEFAULT '{}' NOT NULL,
	"disabled_champions" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"time" jsonb NOT NULL,
	"tournament_id" integer DEFAULT 0 NOT NULL,
	"tournament_codes" text[] DEFAULT '{}' NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "scrim_drafts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"scrim_id" uuid NOT NULL,
	"blue_team_id" uuid NOT NULL,
	"red_team_id" uuid NOT NULL,
	"status" "draft_status" DEFAULT 'PENDING' NOT NULL,
	"blue_picks" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"red_picks" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"blue_bans" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"red_bans" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"current_turn" "draft_turn" DEFAULT 'BLUE_BAN_1' NOT NULL,
	"turn_start_at" timestamp with time zone,
	"expires_at" timestamp with time zone NOT NULL,
	"blue_roster" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"red_roster" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	CONSTRAINT "scrim_drafts_scrim_id_unique" UNIQUE("scrim_id")
);
--> statement-breakpoint
CREATE TABLE "scrim_participants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"scrim_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"team_id" uuid NOT NULL,
	"champion_id" integer NOT NULL,
	"role" varchar(20) NOT NULL,
	"kills" integer DEFAULT 0 NOT NULL,
	"deaths" integer DEFAULT 0 NOT NULL,
	"assists" integer DEFAULT 0 NOT NULL,
	"total_creep_score" integer DEFAULT 0 NOT NULL,
	"gold_earned" integer DEFAULT 0 NOT NULL,
	"vision_score" integer DEFAULT 0 NOT NULL,
	"cs_at_10_minutes" integer DEFAULT 0 NOT NULL,
	"total_damage_dealt_to_champions" integer DEFAULT 0 NOT NULL,
	"total_damage_taken" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "scrims" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"creating_team_id" uuid NOT NULL,
	"opponent_team_id" uuid,
	"status" "scrim_status" DEFAULT 'OPEN' NOT NULL,
	"start_time" timestamp with time zone NOT NULL,
	"duration_minutes" integer DEFAULT 60 NOT NULL,
	"best_of" integer DEFAULT 1 NOT NULL,
	"winning_team_id" uuid,
	"match_duration_seconds" integer,
	"completed_at" timestamp with time zone,
	"min_rank_tier" "rank_tier",
	"min_rank_division" "rank_division",
	"max_rank_tier" "rank_tier",
	"max_rank_division" "rank_division",
	"title" varchar(255),
	"notes" text,
	"comms_link" text,
	"roles_needed" jsonb,
	"search_vector" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "summoner_profiles" (
	"puuid" text PRIMARY KEY NOT NULL,
	"summoner_id" text NOT NULL,
	"account_id" text NOT NULL,
	"profile_icon_id" integer NOT NULL,
	"summoner_level" bigint NOT NULL,
	"region" text NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "team_invites" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"team_id" uuid NOT NULL,
	"inviter_id" uuid NOT NULL,
	"invited_user_id" uuid NOT NULL,
	"role" "team_member_role" NOT NULL,
	"status" "invite_status" DEFAULT 'PENDING' NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	CONSTRAINT "team_invites_team_id_invited_user_id_unique" UNIQUE("team_id","invited_user_id")
);
--> statement-breakpoint
CREATE TABLE "team_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"team_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role" "team_member_role" NOT NULL,
	"joined_at" timestamp NOT NULL,
	CONSTRAINT "team_members_team_id_user_id_unique" UNIQUE("team_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "teams" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"tag" varchar(5) NOT NULL,
	"logo_url" text,
	"region" "region" DEFAULT 'na' NOT NULL,
	"current_rank" "rank" DEFAULT 'UNRANKED',
	"activity_level" "activity_level" DEFAULT 'REGULAR',
	"last_active_at" timestamp,
	"owner_id" uuid NOT NULL,
	"search_vector" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	CONSTRAINT "teams_name_unique" UNIQUE("name"),
	CONSTRAINT "teams_tag_unique" UNIQUE("tag")
);
--> statement-breakpoint
CREATE TABLE "users_to_teams" (
	"user_id" uuid NOT NULL,
	"team_id" uuid NOT NULL,
	"user_is_pending_confirmation" boolean NOT NULL,
	CONSTRAINT "users_to_teams_user_id_team_id_pk" PRIMARY KEY("user_id","team_id")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"email" varchar(255),
	"email_verified" boolean DEFAULT false NOT NULL,
	"password" varchar(255) DEFAULT '' NOT NULL,
	"region" varchar(255),
	"role" varchar(255) DEFAULT 'player' NOT NULL,
	"image" text,
	"default_account_id" varchar(255),
	"puuid" varchar(255),
	"riot_game_name" varchar(255),
	"riot_tag_line" varchar(255),
	"primary_region" varchar(255),
	"search_vector" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	CONSTRAINT "users_name_unique" UNIQUE("name"),
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_puuid_unique" UNIQUE("puuid")
);
--> statement-breakpoint
CREATE TABLE "verifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	CONSTRAINT "verifications_identifier_unique" UNIQUE("identifier")
);
--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversation_participants" ADD CONSTRAINT "conversation_participants_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversation_participants" ADD CONSTRAINT "conversation_participants_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_primary_team_id_teams_id_fk" FOREIGN KEY ("primary_team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_secondary_team_id_teams_id_fk" FOREIGN KEY ("secondary_team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_sender_id_users_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "draft_members" ADD CONSTRAINT "draft_members_draft_history_id_drafts_history_id_fk" FOREIGN KEY ("draft_history_id") REFERENCES "public"."drafts_history"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "draft_members" ADD CONSTRAINT "draft_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "drafts_history" ADD CONSTRAINT "drafts_history_room_id_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "drafts" ADD CONSTRAINT "drafts_room_id_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "friendships" ADD CONSTRAINT "friendships_requester_id_users_id_fk" FOREIGN KEY ("requester_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "friendships" ADD CONSTRAINT "friendships_addressee_id_users_id_fk" FOREIGN KEY ("addressee_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match_history" ADD CONSTRAINT "match_history_puuid_summoner_profiles_puuid_fk" FOREIGN KEY ("puuid") REFERENCES "public"."summoner_profiles"("puuid") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ranked_stats" ADD CONSTRAINT "ranked_stats_puuid_summoner_profiles_puuid_fk" FOREIGN KEY ("puuid") REFERENCES "public"."summoner_profiles"("puuid") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "region_change_logs" ADD CONSTRAINT "region_change_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "riot_accounts" ADD CONSTRAINT "riot_accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "room_members" ADD CONSTRAINT "room_members_room_id_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "room_members" ADD CONSTRAINT "room_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scrim_drafts" ADD CONSTRAINT "scrim_drafts_scrim_id_scrims_id_fk" FOREIGN KEY ("scrim_id") REFERENCES "public"."scrims"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scrim_drafts" ADD CONSTRAINT "scrim_drafts_blue_team_id_teams_id_fk" FOREIGN KEY ("blue_team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scrim_drafts" ADD CONSTRAINT "scrim_drafts_red_team_id_teams_id_fk" FOREIGN KEY ("red_team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scrim_participants" ADD CONSTRAINT "scrim_participants_scrim_id_scrims_id_fk" FOREIGN KEY ("scrim_id") REFERENCES "public"."scrims"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scrim_participants" ADD CONSTRAINT "scrim_participants_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scrim_participants" ADD CONSTRAINT "scrim_participants_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scrims" ADD CONSTRAINT "scrims_creating_team_id_teams_id_fk" FOREIGN KEY ("creating_team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scrims" ADD CONSTRAINT "scrims_opponent_team_id_teams_id_fk" FOREIGN KEY ("opponent_team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scrims" ADD CONSTRAINT "scrims_winning_team_id_teams_id_fk" FOREIGN KEY ("winning_team_id") REFERENCES "public"."teams"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "summoner_profiles" ADD CONSTRAINT "summoner_profiles_puuid_riot_accounts_puuid_fk" FOREIGN KEY ("puuid") REFERENCES "public"."riot_accounts"("puuid") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_invites" ADD CONSTRAINT "team_invites_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_invites" ADD CONSTRAINT "team_invites_inviter_id_users_id_fk" FOREIGN KEY ("inviter_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_invites" ADD CONSTRAINT "team_invites_invited_user_id_users_id_fk" FOREIGN KEY ("invited_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "teams" ADD CONSTRAINT "teams_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users_to_teams" ADD CONSTRAINT "users_to_teams_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users_to_teams" ADD CONSTRAINT "users_to_teams_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "room_index" ON "drafts" USING btree ("room_id");--> statement-breakpoint
CREATE INDEX "friendships_requester_id_idx" ON "friendships" USING btree ("requester_id");--> statement-breakpoint
CREATE INDEX "friendships_addressee_id_idx" ON "friendships" USING btree ("addressee_id");