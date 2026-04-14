import { pgTable, text, uuid } from "drizzle-orm/pg-core";
import { timestamps } from "./timestamps";
import { users } from "./users";

export const riotAccounts = pgTable("riot_accounts", {
	puuid: text("puuid").primaryKey(),
	userId: uuid("user_id")
		.references(() => users.id)
		.notNull()
		.unique(),
	gameName: text("game_name").notNull(),
	tagLine: text("tag_line").notNull(),
	primaryRegion: text("primary_region").notNull(),
	...timestamps,
});

export type TRiotAccount = typeof riotAccounts.$inferSelect;
export type TRiotAccountInsert = typeof riotAccounts.$inferInsert;
