import { boolean, pgTable, text, uuid } from "drizzle-orm/pg-core";
import { users } from "./users";
import { rooms } from "./rooms";
import { ETeamColor } from "../types/team-color";

export const roomDraftMembers = pgTable("room_members", {
	id: uuid("id").defaultRandom().primaryKey(),
	roomId: uuid("room_id")
		.references(() => rooms.id)
		.notNull(),
	userId: uuid("user_id")
		.references(() => users.id)
		.notNull(),
	name: text("name").notNull(),
	socketId: text("socket_id").notNull(),
	isGuest: boolean("is_guest").notNull(),
	team: text("team", {
		enum: ETeamColor.options,
	}).notNull(),
});

export type TRoomDraftMember = typeof roomDraftMembers.$inferSelect;
export type TRoomDraftMemberInsert = typeof roomDraftMembers.$inferInsert;
