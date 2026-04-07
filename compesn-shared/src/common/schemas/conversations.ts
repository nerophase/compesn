import {
	boolean,
	pgEnum,
	pgTable,
	text,
	timestamp,
	uuid,
	varchar,
} from "drizzle-orm/pg-core";
import { timestamps } from "./timestamps";
import { teams } from "./teams";
import { users } from "./users";

export const conversationKindEnum = pgEnum("conversation_kind", [
	"DIRECT",
	"GROUP",
	"TEAM_INTERNAL",
	"TEAM_CONNECTION",
]);

export const conversations = pgTable("conversations", {
	id: uuid("id").defaultRandom().primaryKey(),
	name: varchar("name", { length: 255 }), // Optional name for group conversations
	isGroup: boolean("is_group").default(false).notNull(),
	kind: conversationKindEnum("kind").default("DIRECT").notNull(),
	scopeKey: varchar("scope_key", { length: 255 }).unique(),
	primaryTeamId: uuid("primary_team_id").references(() => teams.id, {
		onDelete: "cascade",
	}),
	secondaryTeamId: uuid("secondary_team_id").references(() => teams.id, {
		onDelete: "cascade",
	}),
	...timestamps,
});

export const conversationParticipants = pgTable("conversation_participants", {
	id: uuid("id").defaultRandom().primaryKey(),
	conversationId: uuid("conversation_id")
		.notNull()
		.references(() => conversations.id, { onDelete: "cascade" }),
	userId: uuid("user_id")
		.notNull()
		.references(() => users.id, { onDelete: "cascade" }),
	joinedAt: timestamp("joined_at")
		.notNull()
		.$defaultFn(() => new Date()),
	leftAt: timestamp("left_at", { mode: "date" }).$type<Date | null>(), // null if still in conversation
});

export const messages = pgTable("messages", {
	id: uuid("id").defaultRandom().primaryKey(),
	conversationId: uuid("conversation_id")
		.notNull()
		.references(() => conversations.id, { onDelete: "cascade" }),
	senderId: uuid("sender_id")
		.notNull()
		.references(() => users.id, { onDelete: "cascade" }),
	content: text("content").notNull(),
	isRead: boolean("is_read").default(false).notNull(),
	...timestamps,
});

export type TConversation = typeof conversations.$inferSelect;
export type TConversationInsert = typeof conversations.$inferInsert;

export type TConversationParticipant = typeof conversationParticipants.$inferSelect;
export type TConversationParticipantInsert = typeof conversationParticipants.$inferInsert;

export type TMessage = typeof messages.$inferSelect;
export type TMessageInsert = typeof messages.$inferInsert;
