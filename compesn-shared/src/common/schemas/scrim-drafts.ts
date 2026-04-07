import { pgTable, uuid, jsonb, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { timestamps } from "./timestamps";
import { scrims } from "./scrims";
import { teams } from "./teams";

// Define enums for draft status and turn types
export const draftStatusEnum = pgEnum("draft_status", [
	"PENDING",
	"ACTIVE",
	"COMPLETED",
	"EXPIRED",
]);

export const draftTurnEnum = pgEnum("draft_turn", [
	"BLUE_BAN_1",
	"RED_BAN_1",
	"BLUE_BAN_2",
	"RED_BAN_2",
	"BLUE_BAN_3",
	"RED_BAN_3",
	"BLUE_PICK_1",
	"RED_PICK_1",
	"RED_PICK_2",
	"BLUE_PICK_2",
	"BLUE_PICK_3",
	"RED_PICK_3",
	"RED_BAN_4",
	"BLUE_BAN_4",
	"RED_BAN_5",
	"BLUE_BAN_5",
	"RED_PICK_4",
	"BLUE_PICK_4",
	"BLUE_PICK_5",
	"RED_PICK_5",
]);

export const scrimDrafts = pgTable("scrim_drafts", {
	id: uuid("id").defaultRandom().primaryKey(),
	scrimId: uuid("scrim_id")
		.references(() => scrims.id, { onDelete: "cascade" })
		.notNull()
		.unique(), // One draft per scrim
	blueTeamId: uuid("blue_team_id")
		.references(() => teams.id, { onDelete: "cascade" })
		.notNull(),
	redTeamId: uuid("red_team_id")
		.references(() => teams.id, { onDelete: "cascade" })
		.notNull(),
	status: draftStatusEnum("status").default("PENDING").notNull(),

	// Draft state stored as JSONB arrays of champion IDs (ordered)
	bluePicks: jsonb("blue_picks").$type<number[]>().default([]).notNull(),
	redPicks: jsonb("red_picks").$type<number[]>().default([]).notNull(),
	blueBans: jsonb("blue_bans").$type<number[]>().default([]).notNull(),
	redBans: jsonb("red_bans").$type<number[]>().default([]).notNull(),

	// Current turn tracking
	currentTurn: draftTurnEnum("current_turn").default("BLUE_BAN_1").notNull(),
	turnStartAt: timestamp("turn_start_at", { withTimezone: true }),

	// Draft expiration
	expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),

	// Blue and Red team rosters (PUUIDs)
	blueRoster: jsonb("blue_roster").$type<string[]>().default([]).notNull(),
	redRoster: jsonb("red_roster").$type<string[]>().default([]).notNull(),

	...timestamps,
});

export type TScrimDraft = typeof scrimDrafts.$inferSelect;
export type TScrimDraftInsert = typeof scrimDrafts.$inferInsert;
