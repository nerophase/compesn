import { z } from "zod";

export const ConversationKindSchema = z.enum([
	"DIRECT",
	"GROUP",
	"TEAM_INTERNAL",
	"TEAM_CONNECTION",
]);

// Conversation schemas
export const ConversationCreateSchema = z.object({
	participantIds: z.array(z.string().uuid()).min(1, "At least one participant is required"),
	name: z.string().optional(), // For group conversations
	isGroup: z.boolean().default(false),
});

export const ConversationListSchema = z.object({
	search: z.string(),
	type: z.enum(["direct", "group", "team"]).nullable(),
	limit: z.number().min(1).max(100).default(20),
	offset: z.number().min(0).default(0),
});

export const ConversationByIdSchema = z.object({
	conversationId: z.string().uuid(),
});

export const DirectConversationSchema = z.object({
	targetUserId: z.string().uuid(),
});

export const TeamConversationSchema = z.object({
	teamId: z.string().uuid(),
	counterpartTeamId: z.string().uuid().optional(),
});

// Message schemas
export const MessageSendSchema = z.object({
	conversationId: z.string().uuid(),
	senderId: z.string(),
	content: z
		.string()
		.min(1, "Message content cannot be empty")
		.max(2000, "Message content cannot exceed 2000 characters"),
});

export const MessageListByConversationIdSchema = z.object({
	conversationId: z.string().uuid(),
	limit: z.number().min(1).max(100).default(50),
	offset: z.number().min(0).default(0),
});

export const MessageMarkAsReadSchema = z.object({
	messageIds: z.array(z.string().uuid()),
});
