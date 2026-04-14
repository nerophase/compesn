import { pgTable, uuid, varchar, timestamp } from "drizzle-orm/pg-core";
import { users } from "./users";

export const regionChangeLogs = pgTable("region_change_logs", {
	id: uuid("id").defaultRandom().primaryKey(),
	userId: uuid("user_id")
		.notNull()
		.references(() => users.id, { onDelete: "cascade" }),
	oldRegion: varchar("old_region", { length: 255 }),
	newRegion: varchar("new_region", { length: 255 }).notNull(),
	changedAt: timestamp("changed_at", { withTimezone: true }).defaultNow().notNull(),
});

export type TRegionChangeLog = typeof regionChangeLogs.$inferSelect;
export type TRegionChangeLogInsert = typeof regionChangeLogs.$inferInsert;
