import { createTRPCRouter, authenticatedProcedure } from "../../init";
import {
	FriendRequestSchema,
	FriendResponseSchema,
	FriendRemoveSchema,
	FriendBlockSchema,
	FriendListSchema,
	FriendRelationshipSchema,
} from "./friends.schema";
import { db } from "../../../lib/database/db";
import { and, eq, or, desc, ne } from "drizzle-orm";
import { friendships, users } from "@compesn/shared/schemas";
import { TRPCError } from "@trpc/server";

export const friendsRouter = createTRPCRouter({
	// List friends and friend requests
	list: authenticatedProcedure.input(FriendListSchema).query(async ({ input, ctx }) => {
		const userId = ctx.user.id;

		// Build query based on status filter
		let results: (typeof friendships.$inferSelect)[];

		if (input.status === "PENDING") {
			// For pending, only show incoming requests
			results = await db
				.select()
				.from(friendships)
				.where(and(eq(friendships.addresseeId, userId), eq(friendships.status, "PENDING")))
				.orderBy(desc(friendships.createdAt))
				.limit(input.limit)
				.offset(input.offset);
		} else if (input.status === "ACCEPTED") {
			// Show accepted friendships
			results = await db
				.select()
				.from(friendships)
				.where(
					and(
						or(
							eq(friendships.requesterId, userId),
							eq(friendships.addresseeId, userId),
						),
						eq(friendships.status, "ACCEPTED"),
					),
				)
				.orderBy(desc(friendships.createdAt))
				.limit(input.limit)
				.offset(input.offset);
		} else {
			// ALL - show everything except blocked
			results = await db
				.select()
				.from(friendships)
				.where(
					and(
						or(
							eq(friendships.requesterId, userId),
							eq(friendships.addresseeId, userId),
						),
						ne(friendships.status, "BLOCKED"),
					),
				)
				.orderBy(desc(friendships.createdAt))
				.limit(input.limit)
				.offset(input.offset);
		}

		// Get user details for each friendship
		const enrichedResults = await Promise.all(
			results.map(async (friendship) => {
				const isRequester = friendship.requesterId === userId;
				const otherUserId = isRequester ? friendship.addresseeId : friendship.requesterId;

				const otherUser = await db.query.users.findFirst({
					where: eq(users.id, otherUserId),
				});

				return {
					id: friendship.id,
					status: friendship.status,
					createdAt: friendship.createdAt,
					updatedAt: friendship.updatedAt,
					isRequester,
					otherUser: otherUser
						? {
								id: otherUser.id,
								name: otherUser.name,
								image: otherUser.image,
								riotGameName: otherUser.riotGameName,
								riotTagLine: otherUser.riotTagLine,
							}
						: null,
				};
			}),
		);

		return enrichedResults;
	}),

	// Get pending friend request count
	pendingCount: authenticatedProcedure.query(async ({ ctx }) => {
		const userId = ctx.user.id;

		const pending = await db
			.select()
			.from(friendships)
			.where(and(eq(friendships.addresseeId, userId), eq(friendships.status, "PENDING")));

		return pending.length;
	}),

	getRelationship: authenticatedProcedure
		.input(FriendRelationshipSchema)
		.query(async ({ input, ctx }) => {
			if (input.userId === ctx.user.id) {
				return {
					status: "SELF" as const,
					friendshipId: null,
				};
			}

			const existing = await db.query.friendships.findFirst({
				where: or(
					and(
						eq(friendships.requesterId, ctx.user.id),
						eq(friendships.addresseeId, input.userId),
					),
					and(
						eq(friendships.requesterId, input.userId),
						eq(friendships.addresseeId, ctx.user.id),
					),
				),
			});

			if (!existing) {
				return {
					status: "NONE" as const,
					friendshipId: null,
				};
			}

			if (existing.status === "ACCEPTED") {
				return {
					status: "ACCEPTED" as const,
					friendshipId: existing.id,
				};
			}

			if (existing.status === "BLOCKED") {
				return {
					status: "BLOCKED" as const,
					friendshipId: existing.id,
				};
			}

			if (existing.status === "PENDING") {
				return {
					status:
						existing.requesterId === ctx.user.id
							? ("OUTGOING_PENDING" as const)
							: ("INCOMING_PENDING" as const),
					friendshipId: existing.id,
				};
			}

			return {
				status: "NONE" as const,
				friendshipId: existing.id,
			};
		}),

	// Send friend request
	sendRequest: authenticatedProcedure
		.input(FriendRequestSchema)
		.mutation(async ({ input, ctx }) => {
			const userId = ctx.user.id;

			// Can't friend yourself
			if (input.addresseeId === userId) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "You cannot send a friend request to yourself",
				});
			}

			// Check if recipient exists
			const addressee = await db.query.users.findFirst({
				where: eq(users.id, input.addresseeId),
			});

			if (!addressee) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "User not found",
				});
			}

			// Check for existing friendship (in either direction)
			const existing = await db
				.select()
				.from(friendships)
				.where(
					or(
						and(
							eq(friendships.requesterId, userId),
							eq(friendships.addresseeId, input.addresseeId),
						),
						and(
							eq(friendships.requesterId, input.addresseeId),
							eq(friendships.addresseeId, userId),
						),
					),
				);

			if (existing.length > 0) {
				const existingFriendship = existing[0];
				if (existingFriendship.status === "ACCEPTED") {
					throw new TRPCError({
						code: "CONFLICT",
						message: "You are already friends with this user",
					});
				}
				if (existingFriendship.status === "PENDING") {
					// If they sent us a request, auto-accept
					if (existingFriendship.requesterId === input.addresseeId) {
						const [updated] = await db
							.update(friendships)
							.set({ status: "ACCEPTED", updatedAt: new Date() })
							.where(eq(friendships.id, existingFriendship.id))
							.returning();
						return { ...updated, autoAccepted: true };
					}
					throw new TRPCError({
						code: "CONFLICT",
						message: "Friend request already pending",
					});
				}
				if (existingFriendship.status === "BLOCKED") {
					throw new TRPCError({
						code: "FORBIDDEN",
						message: "Cannot send friend request to this user",
					});
				}
			}

			// Create friend request
			const [friendship] = await db
				.insert(friendships)
				.values({
					requesterId: userId,
					addresseeId: input.addresseeId,
					status: "PENDING",
				})
				.returning();

			return friendship;
		}),

	// Respond to friend request
	respondToRequest: authenticatedProcedure
		.input(FriendResponseSchema)
		.mutation(async ({ input, ctx }) => {
			const userId = ctx.user.id;

			// Find the friendship
			const existing = await db
				.select()
				.from(friendships)
				.where(
					and(
						eq(friendships.id, input.friendshipId),
						eq(friendships.addresseeId, userId),
						eq(friendships.status, "PENDING"),
					),
				);

			if (existing.length === 0) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Friend request not found or already responded",
				});
			}

			const newStatus = input.response === "ACCEPT" ? "ACCEPTED" : "DECLINED";

			const [updated] = await db
				.update(friendships)
				.set({ status: newStatus, updatedAt: new Date() })
				.where(eq(friendships.id, input.friendshipId))
				.returning();

			return updated;
		}),

	// Remove friend or cancel request
	remove: authenticatedProcedure.input(FriendRemoveSchema).mutation(async ({ input, ctx }) => {
		const userId = ctx.user.id;

		// Find the friendship - user must be either requester or addressee
		const existing = await db
			.select()
			.from(friendships)
			.where(
				and(
					eq(friendships.id, input.friendshipId),
					or(eq(friendships.requesterId, userId), eq(friendships.addresseeId, userId)),
				),
			);

		if (existing.length === 0) {
			throw new TRPCError({
				code: "NOT_FOUND",
				message: "Friendship not found",
			});
		}

		await db.delete(friendships).where(eq(friendships.id, input.friendshipId));

		return { success: true };
	}),

	// Block a user
	block: authenticatedProcedure.input(FriendBlockSchema).mutation(async ({ input, ctx }) => {
		const userId = ctx.user.id;

		// Can't block yourself
		if (input.userId === userId) {
			throw new TRPCError({
				code: "BAD_REQUEST",
				message: "You cannot block yourself",
			});
		}

		// Check for existing friendship
		const existing = await db
			.select()
			.from(friendships)
			.where(
				or(
					and(
						eq(friendships.requesterId, userId),
						eq(friendships.addresseeId, input.userId),
					),
					and(
						eq(friendships.requesterId, input.userId),
						eq(friendships.addresseeId, userId),
					),
				),
			);

		if (existing.length > 0) {
			// Update to blocked
			const [updated] = await db
				.update(friendships)
				.set({
					status: "BLOCKED",
					requesterId: userId,
					addresseeId: input.userId,
					updatedAt: new Date(),
				})
				.where(eq(friendships.id, existing[0].id))
				.returning();

			return updated;
		}

		// Create new blocked relationship
		const [friendship] = await db
			.insert(friendships)
			.values({
				requesterId: userId,
				addresseeId: input.userId,
				status: "BLOCKED",
			})
			.returning();

		return friendship;
	}),
});
