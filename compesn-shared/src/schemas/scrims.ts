import {
	pgTable,
	uuid,
	varchar,
	timestamp,
	integer,
	text,
	jsonb,
	pgEnum,
} from "drizzle-orm/pg-core";
import { timestamps } from "./timestamps";
import { teams } from "./teams";
import { users } from "./users";

// Define enums for scrim status and rank tiers
export const scrimStatusEnum = pgEnum("scrim_status", [
	"OPEN",
	"REQUESTED",
	"ACCEPTED",
	"CONFIRMED",
	"CANCELLED",
	"COMPLETED",
]);

export const rankTierEnum = pgEnum("rank_tier", [
	"IRON",
	"BRONZE",
	"SILVER",
	"GOLD",
	"PLATINUM",
	"EMERALD",
	"DIAMOND",
	"MASTER",
	"GRANDMASTER",
	"CHALLENGER",
]);

export const rankDivisionEnum = pgEnum("rank_division", ["I", "II", "III", "IV"]);

export const scrims = pgTable("scrims", {
	id: uuid("id").defaultRandom().primaryKey(),
	creatingTeamId: uuid("creating_team_id")
		.notNull()
		.references(() => teams.id, { onDelete: "cascade" }),
	opponentTeamId: uuid("opponent_team_id").references(() => teams.id, {
		onDelete: "cascade",
	}),
	status: scrimStatusEnum("status").default("OPEN").notNull(),
	startTime: timestamp("start_time", { withTimezone: true }).notNull(),
	durationMinutes: integer("duration_minutes").default(60).notNull(),
	bestOf: integer("best_of").default(1).notNull(),

	// Match result fields (populated when status is COMPLETED)
	winningTeamId: uuid("winning_team_id").references(() => teams.id, {
		onDelete: "set null",
	}),
	matchDurationSeconds: integer("match_duration_seconds"), // Actual match duration
	completedAt: timestamp("completed_at", { withTimezone: true }), // When the match was completed

	// Rank filtering criteria
	minRankTier: rankTierEnum("min_rank_tier"),
	minRankDivision: rankDivisionEnum("min_rank_division"),
	maxRankTier: rankTierEnum("max_rank_tier"),
	maxRankDivision: rankDivisionEnum("max_rank_division"),

	// Additional details
	title: varchar("title", { length: 255 }), // Scrim title for better searchability
	notes: text("notes"),
	commsLink: text("comms_link"), // Discord/TeamSpeak link
	rolesNeeded: jsonb("roles_needed").$type<string[]>(), // Array of role strings like ['TOP', 'JUNGLE']

	// Full-text search vector for scrim title and notes
	searchVector: text("search_vector").$type<unknown>(),

	...timestamps,
});

export type TScrim = typeof scrims.$inferSelect;
export type TScrimInsert = typeof scrims.$inferInsert;

// New table for storing individual player performance in scrims
export const scrimParticipants = pgTable("scrim_participants", {
	id: uuid("id").defaultRandom().primaryKey(),
	scrimId: uuid("scrim_id")
		.notNull()
		.references(() => scrims.id, { onDelete: "cascade" }),
	userId: uuid("user_id")
		.notNull()
		.references(() => users.id, { onDelete: "cascade" }),
	teamId: uuid("team_id")
		.notNull()
		.references(() => teams.id, { onDelete: "cascade" }),

	// Champion and role information
	championId: integer("champion_id").notNull(), // League champion ID
	role: varchar("role", { length: 20 }).notNull(), // TOP, JUNGLE, MID, BOT, SUPPORT

	// Performance statistics
	kills: integer("kills").default(0).notNull(),
	deaths: integer("deaths").default(0).notNull(),
	assists: integer("assists").default(0).notNull(),
	totalCreepScore: integer("total_creep_score").default(0).notNull(),
	goldEarned: integer("gold_earned").default(0).notNull(),
	visionScore: integer("vision_score").default(0).notNull(),
	csAt10Minutes: integer("cs_at_10_minutes").default(0).notNull(),
	totalDamageDealtToChampions: integer("total_damage_dealt_to_champions").default(0).notNull(),
	totalDamageTaken: integer("total_damage_taken").default(0).notNull(),

	...timestamps,
});

export type TScrimParticipant = typeof scrimParticipants.$inferSelect;
export type TScrimParticipantInsert = typeof scrimParticipants.$inferInsert;
