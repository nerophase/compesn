import { boolean, jsonb, pgTable, text, uuid } from "drizzle-orm/pg-core";
import { users } from "./users";
import { timestamps } from "./timestamps";
import { relations } from "drizzle-orm";
import {
	ENotificationType,
	TNotificationDataMap,
	TNotificationType,
} from "../types/notification-type";

export const notifications = pgTable("notifications", {
	id: uuid("id").defaultRandom().primaryKey(),
	userId: uuid("user_id")
		.notNull()
		.references(() => users.id, { onDelete: "cascade" }),
	read: boolean("read").default(false).notNull(),
	type: text("type", {
		enum: ENotificationType.options,
	}).notNull(),
	data: jsonb("data").$type<TNotificationDataMap[TNotificationType]>(),
	...timestamps,
});

export type TNotification = typeof notifications.$inferSelect;

export const notificationsRelations = relations(notifications, ({ one }) => ({
	user: one(users, {
		fields: [notifications.userId],
		references: [users.id],
	}),
}));
