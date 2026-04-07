import { pgTable, text, boolean, uuid, varchar } from "drizzle-orm/pg-core";
import { timestamps } from "./timestamps";

export const users = pgTable("users", {
	id: uuid("id").defaultRandom().primaryKey(),
	name: varchar("name", { length: 255 }).unique().notNull(),
	email: varchar("email", { length: 255 }).unique(),
	emailVerified: boolean("email_verified").default(false).notNull(),
	password: varchar("password", { length: 255 }).default("").notNull(),
	region: varchar("region", { length: 255 }),
	role: varchar("role", { enum: ["player", "admin"], length: 255 })
		.default("player")
		.notNull(),
	image: text("image"),
	defaultAccountId: varchar("default_account_id", { length: 255 }),
	// Riot account identifiers
	puuid: varchar("puuid", { length: 255 }).unique(),
	riotGameName: varchar("riot_game_name", { length: 255 }),
	riotTagLine: varchar("riot_tag_line", { length: 255 }),
	primaryRegion: varchar("primary_region", { length: 255 }),
	// Full-text search vector for player names (summoner name)
	searchVector: text("search_vector").$type<unknown>(),
	...timestamps,
});

export type TUser = typeof users.$inferSelect;
export type TUserInsert = typeof users.$inferInsert;
