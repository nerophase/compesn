import { pgTable, uuid, timestamp, pgEnum, index, unique } from "drizzle-orm/pg-core";
import { timestamps } from "./timestamps";
import { users } from "./users";

// Friendship status enum
export const friendshipStatusEnum = pgEnum("friendship_status", [
	"PENDING", // Friend request sent, awaiting response
	"ACCEPTED", // Both users are friends
	"DECLINED", // Request was declined
	"BLOCKED", // One user blocked the other
]);

// Friendships table - relationships between users
export const friendships = pgTable(
	"friendships",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		requesterId: uuid("requester_id")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		addresseeId: uuid("addressee_id")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		status: friendshipStatusEnum("status").default("PENDING").notNull(),
		...timestamps,
	},
	(table) => [
		// Index for querying friendships by either user
		index("friendships_requester_id_idx").on(table.requesterId),
		index("friendships_addressee_id_idx").on(table.addresseeId),
		// Unique constraint to prevent duplicate friendships
		unique("friendships_unique_pair").on(table.requesterId, table.addresseeId),
	],
);

export type TFriendship = typeof friendships.$inferSelect;
export type TFriendshipInsert = typeof friendships.$inferInsert;
