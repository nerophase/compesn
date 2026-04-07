import {
	pgTable,
	uuid,
	jsonb,
	text,
	integer,
	boolean,
	smallint,
	uniqueIndex,
} from "drizzle-orm/pg-core";
import { timestamps } from "./timestamps";
import { rooms } from "./rooms";
import { TRoomDraftMember } from "./room-members";
import { EState } from "../types/state";
import { TTurn } from "../types/turn";
import { TDraftTeam } from "../types/draft-team";

export const drafts = pgTable(
	"drafts",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		roomId: uuid("room_id")
			.references(() => rooms.id, { onDelete: "cascade" })
			.notNull(),
		draftIndex: smallint("draft_index").notNull(),
		blue: jsonb("red").$type<TDraftTeam>().notNull(),
		red: jsonb("red").$type<TDraftTeam>().notNull(),
		members: jsonb("members")
			.$type<TRoomDraftMember[]>()
			.$defaultFn(() => [])
			.notNull(),
		state: text("state", {
			enum: EState.options,
		})
			.default("waiting")
			.notNull(),
		turn: jsonb("turn").$type<TTurn>(),
		turnStart: integer("turn_start").default(0).notNull(),
		currentTurnTime: integer("current_turn_time").default(0).notNull(),
		canRepeatPreviousTurn: boolean("can_repeat_previous_turn").default(false).notNull(),
		tournamentCode: text("tournament_code").default("").notNull(),
		...timestamps,
	},
	(table) => [uniqueIndex("room_index").on(table.roomId)],
);

export type TDraftSelect = typeof drafts.$inferSelect;
export type TDraftInsert = typeof drafts.$inferInsert;
