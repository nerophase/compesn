import { pgTable, uuid, jsonb, text, smallint, integer } from "drizzle-orm/pg-core";
import { timestamps } from "./timestamps";
import { EPickType } from "../types/tournament";
import { TRoomTime } from "../types/room-time";
import { TRoomMember } from "../types/room-member";
import { EDraftMode } from "../types/draft-mode";
import { ChampionSchema } from "../types/champion";
import { TDraft } from "../types/draft";

export const rooms = pgTable("rooms", {
	id: uuid("id").defaultRandom().primaryKey(),
	pickType: text("pick_type", {
		enum: EPickType.options,
	})
		.$defaultFn(() => "DRAFT_MODE")
		.notNull(),
	draftMode: text("draft_mode", {
		enum: EDraftMode.options,
	})
		.$default(() => "standard")
		.notNull(),
	draftsCount: smallint("drafts_count").default(1).notNull(),
	members: jsonb("members")
		.$type<TRoomMember[]>()
		.$defaultFn(() => [])
		.notNull(),
	drafts: jsonb("drafts")
		.$type<TDraft[]>()
		.$defaultFn(() => [])
		.notNull(),
	currentDraft: smallint("current_draft").default(0).notNull(),
	disabledTurns: smallint("disabled_turns").array().default([]).notNull(),
	disabledChampions: jsonb("disabled_champions")
		.$type<(typeof ChampionSchema._type)[]>()
		.default([])
		.notNull(),
	time: jsonb("time")
		.$type<TRoomTime>()
		.$defaultFn(() => ({ pick: 30, ban: 30 }))
		.notNull(),
	tournamentId: integer("tournament_id").default(0).notNull(),
	tournamentCodes: text("tournament_codes").array().default([]).notNull(),
	...timestamps,
});

export type TRoom = typeof rooms.$inferSelect;
export type TRoomInsert = typeof rooms.$inferInsert;
