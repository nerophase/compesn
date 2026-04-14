import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { timestamps } from "./timestamps";

export const verifications = pgTable("verifications", {
	id: uuid("id").defaultRandom().primaryKey(),
	identifier: text("identifier").unique().notNull(),
	value: text("value").notNull(),
	expiresAt: timestamp("expires_at").notNull(),
	...timestamps,
});
