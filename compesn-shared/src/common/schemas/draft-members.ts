import { boolean, pgTable, text, uuid } from "drizzle-orm/pg-core";
import { users } from "./users";
import { draftsHistory } from "./drafts-history";
import { ETeamColor } from "../types/team-color";

export const draftMembers = pgTable("draft_members", {
	id: uuid("id").defaultRandom().primaryKey(),
	draftHistoryId: uuid("draft_history_id")
		.references(() => draftsHistory.id)
		.notNull(),
	userId: uuid("user_id")
		.references(() => users.id)
		.notNull(),
	name: text("name").notNull(),
	isGuest: boolean("is_guest").notNull(),
	team: text("team", {
		enum: ETeamColor.options, // zod4 fix: as [z.infer<typeof ETeamColor>]
	}).notNull(),
});

export type TDraftMember = typeof draftMembers.$inferSelect;
export type TDraftMemberInsert = typeof draftMembers.$inferInsert;
