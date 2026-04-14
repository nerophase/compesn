import { pgTable, text, integer, uuid } from "drizzle-orm/pg-core";
import { timestamps } from "./timestamps";
import { summonerProfiles } from "./summoner-profiles";

export const rankedStats = pgTable("ranked_stats", {
	id: uuid("id").defaultRandom().primaryKey(),
	puuid: text("puuid")
		.references(() => summonerProfiles.puuid)
		.notNull(),
	queueType: text("queue_type").notNull(), // RANKED_SOLO_5x5, RANKED_FLEX_SR, etc.
	tier: text("tier"), // IRON, BRONZE, SILVER, GOLD, PLATINUM, EMERALD, DIAMOND, MASTER, GRANDMASTER, CHALLENGER
	division: text("division"), // I, II, III, IV
	leaguePoints: integer("league_points").default(0).notNull(),
	wins: integer("wins").default(0).notNull(),
	losses: integer("losses").default(0).notNull(),
	hotStreak: integer("hot_streak").default(0), // boolean as integer
	veteran: integer("veteran").default(0), // boolean as integer
	freshBlood: integer("fresh_blood").default(0), // boolean as integer
	inactive: integer("inactive").default(0), // boolean as integer
	...timestamps,
});

export type TRankedStats = typeof rankedStats.$inferSelect;
export type TRankedStatsInsert = typeof rankedStats.$inferInsert;
