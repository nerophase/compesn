import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { timestamps } from "./timestamps";
import { users } from "./users";

export const accounts = pgTable("accounts", {
	id: uuid("id").defaultRandom().primaryKey(),
	accountId: text("account_id").unique().notNull(),
	providerId: text("provider_id", { enum: ["discord", "riot"] }).notNull(),
	userId: uuid("user_id")
		.notNull()
		.references(() => users.id, { onDelete: "cascade" }),
	username: text("username").notNull(),
	accessToken: text("access_token"),
	refreshToken: text("refresh_token"),
	idToken: text("id_token"),
	accessTokenExpiresAt: timestamp("access_token_expires_at"),
	refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
	scope: text("scope"),
	password: text("password"),
	...timestamps,
});
