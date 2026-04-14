import { pgTable, uuid, jsonb, text, smallint } from "drizzle-orm/pg-core";
import { timestamps } from "./timestamps";
import { rooms } from "./rooms";
import { TDraftTeam } from "../types/draft-team";

export const draftsHistory = pgTable("drafts_history", {
	id: uuid("id").defaultRandom().primaryKey(),
	roomId: uuid("room_id")
		.references(() => rooms.id, { onDelete: "cascade" })
		.notNull(),
	draftIndex: smallint("draft_index").notNull(),
	blue: jsonb("red").$type<TDraftTeam>().notNull(),
	red: jsonb("red").$type<TDraftTeam>().notNull(),
	tournamentCode: text("tournament_code").default("").notNull(),
	...timestamps,
});

export type TDraftHistory = typeof draftsHistory.$inferSelect;
export type TDraftHistoryInsert = typeof draftsHistory.$inferInsert;

// QUERY BY MEMBER USER ID (JSONB)
// async () => {
// 	db.query.draftsHistory.findMany({
// 		where: sql`EXISTS (
// 			SELECT 1
// 			FROM jsonb_array_elements(${draftsHistory.members}) elem
// 			WHERE elem->>'userId' = ${"USER_ID"})`,
// 	});
// };
