import { z } from "zod";

// Send friend request
export const FriendRequestSchema = z.object({
	addresseeId: z.string().uuid(),
});

// Respond to friend request
export const FriendResponseSchema = z.object({
	friendshipId: z.string().uuid(),
	response: z.enum(["ACCEPT", "DECLINE"]),
});

// Remove friend or cancel request
export const FriendRemoveSchema = z.object({
	friendshipId: z.string().uuid(),
});

// Block user
export const FriendBlockSchema = z.object({
	userId: z.string().uuid(),
});

export const FriendRelationshipSchema = z.object({
	userId: z.string().uuid(),
});

// List friends with filters
export const FriendListSchema = z.object({
	status: z.enum(["PENDING", "ACCEPTED", "ALL"]).default("ACCEPTED"),
	limit: z.number().min(1).max(100).default(50),
	offset: z.number().min(0).default(0),
});
