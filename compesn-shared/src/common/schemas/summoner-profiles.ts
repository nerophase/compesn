import { pgTable, text, integer, bigint } from "drizzle-orm/pg-core";
import { timestamps } from "./timestamps";
import { riotAccounts } from "./riot-accounts";

export const summonerProfiles = pgTable("summoner_profiles", {
	puuid: text("puuid")
		.references(() => riotAccounts.puuid)
		.primaryKey(),
	summonerId: text("summoner_id").notNull(),
	accountId: text("account_id").notNull(),
	profileIconId: integer("profile_icon_id").notNull(),
	summonerLevel: bigint("summoner_level", { mode: "number" }).notNull(),
	region: text("region").notNull(),
	...timestamps,
});

export type TSummonerProfile = typeof summonerProfiles.$inferSelect;
export type TSummonerProfileInsert = typeof summonerProfiles.$inferInsert;
