import { pgTable, text, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { timestamps } from "./timestamps";
import { summonerProfiles } from "./summoner-profiles";

export const matchHistory = pgTable("match_history", {
	matchId: text("match_id").primaryKey(),
	puuid: text("puuid")
		.references(() => summonerProfiles.puuid)
		.notNull(),
	queueId: integer("queue_id").notNull(),
	gameCreation: timestamp("game_creation", { withTimezone: true }).notNull(),
	gameDuration: integer("game_duration").notNull(), // in seconds
	championId: integer("champion_id").notNull(),
	kills: integer("kills").notNull(),
	deaths: integer("deaths").notNull(),
	assists: integer("assists").notNull(),
	win: boolean("win").notNull(),
	// Additional useful stats
	totalDamageDealt: integer("total_damage_dealt"),
	totalDamageDealtToChampions: integer("total_damage_dealt_to_champions"),
	visionScore: integer("vision_score"),
	goldEarned: integer("gold_earned"),
	totalMinionsKilled: integer("total_minions_killed"),
	neutralMinionsKilled: integer("neutral_minions_killed"),
	wardsPlaced: integer("wards_placed"),
	wardsKilled: integer("wards_killed"),
	...timestamps,
});

export type TMatchHistory = typeof matchHistory.$inferSelect;
export type TMatchHistoryInsert = typeof matchHistory.$inferInsert;
