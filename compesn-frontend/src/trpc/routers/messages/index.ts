import { createTRPCRouter, authenticatedProcedure } from "../../init";
import {
	ConversationByIdSchema,
	ConversationCreateSchema,
	ConversationListSchema,
	DirectConversationSchema,
	MessageListByConversationIdSchema,
	MessageMarkAsReadSchema,
	MessageSendSchema,
	TeamConversationSchema,
} from "./messages.schema";
import { db } from "../../../lib/database/db";
import { and, asc, desc, eq, inArray, isNull, ne, or } from "drizzle-orm";
import { conversationParticipants, conversations, messages, users } from "@compesn/shared/schemas";
import { TRPCError } from "@trpc/server";
import Fuse from "fuse.js";
import {
	ensureUserBelongsToTeam,
	getActiveConversationParticipation,
	getOrCreateDirectConversation,
	getOrCreateTeamConversation,
} from "@/lib/messaging";

const getUserDisplayName = (user?: {
	name: string | null;
	riotGameName: string | null;
	riotTagLine: string | null;
}) => {
	if (!user) return "Unknown user";
	if (user.riotGameName && user.riotTagLine) {
		return `${user.riotGameName}#${user.riotTagLine}`;
	}

	return user.name || "Unknown user";
};

const getConversationDisplayName = (
	conversation: {
		kind: (typeof conversations.$inferSelect)["kind"];
		name: string | null;
		primaryTeam?: { name: string | null } | null;
		secondaryTeam?: { name: string | null } | null;
		participants: Array<{
			userId: string;
			user: typeof users.$inferSelect;
		}>;
	},
	currentUserId: string,
) => {
	switch (conversation.kind) {
		case "DIRECT": {
			const peer = conversation.participants.find(
				(participant) => participant.userId !== currentUserId,
			);
			return getUserDisplayName(peer?.user);
		}
		case "TEAM_INTERNAL":
			return conversation.primaryTeam?.name
				? `${conversation.primaryTeam.name} Team Chat`
				: conversation.name || "Team Chat";
		case "TEAM_CONNECTION":
			if (conversation.primaryTeam?.name && conversation.secondaryTeam?.name) {
				return `${conversation.primaryTeam.name} / ${conversation.secondaryTeam.name}`;
			}
			return conversation.name || "Team Connection";
		case "GROUP":
		default:
			return conversation.name || "Group Chat";
	}
};

const kindMatchesFilter = (
	kind: (typeof conversations.$inferSelect)["kind"],
	filter: "direct" | "group" | "team" | null,
) => {
	if (!filter) return true;
	if (filter === "direct") return kind === "DIRECT";
	if (filter === "group") return kind === "GROUP";
	return kind === "TEAM_INTERNAL" || kind === "TEAM_CONNECTION";
};

export const messagesRouter = createTRPCRouter({
	createConversation: authenticatedProcedure
		.input(ConversationCreateSchema)
		.mutation(async ({ input, ctx }) => {
			const userId = ctx.user.id;
			const allParticipantIds = Array.from(new Set([userId, ...input.participantIds]));

			const participantUsers = await db.query.users.findMany({
				where: inArray(users.id, allParticipantIds),
			});

			if (participantUsers.length !== allParticipantIds.length) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "One or more participants do not exist",
				});
			}

			if (!input.isGroup && allParticipantIds.length === 2) {
				return getOrCreateDirectConversation(
					userId,
					allParticipantIds.find((id) => id !== userId)!,
				);
			}

			const [conversation] = await db
				.insert(conversations)
				.values({
					name: input.name,
					isGroup: input.isGroup,
					kind: "GROUP",
				})
				.returning();

			await db.insert(conversationParticipants).values(
				allParticipantIds.map((participantId) => ({
					conversationId: conversation.id,
					userId: participantId,
				})),
			);

			return conversation;
		}),

	createOrGetDirectConversation: authenticatedProcedure
		.input(DirectConversationSchema)
		.mutation(async ({ input, ctx }) => {
			const conversation = await getOrCreateDirectConversation(ctx.user.id, input.targetUserId);

			return {
				conversationId: conversation.id,
			};
		}),

	createOrGetTeamConversation: authenticatedProcedure
		.input(TeamConversationSchema)
		.mutation(async ({ input, ctx }) => {
			await ensureUserBelongsToTeam(ctx.user.id, input.teamId);
			if (input.counterpartTeamId) {
				if (input.counterpartTeamId === input.teamId) {
					throw new TRPCError({
						code: "BAD_REQUEST",
						message: "Counterpart team must be different from the selected team",
					});
				}
			}

			const conversation = await getOrCreateTeamConversation(
				input.teamId,
				input.counterpartTeamId,
			);

			return {
				conversationId: conversation.id,
			};
		}),

	listConversations: authenticatedProcedure
		.input(ConversationListSchema)
		.query(async ({ input, ctx }) => {
			const userId = ctx.user.id;

			const userConversations = await db.query.conversationParticipants.findMany({
				where: and(
					eq(conversationParticipants.userId, userId),
					isNull(conversationParticipants.leftAt),
				),
				with: {
					conversation: {
						with: {
							primaryTeam: true,
							secondaryTeam: true,
							participants: {
								where: isNull(conversationParticipants.leftAt),
								with: {
									user: true,
								},
							},
							messages: {
								orderBy: desc(messages.createdAt),
								limit: 1,
								with: {
									sender: true,
								},
							},
						},
					},
				},
				orderBy: desc(conversationParticipants.joinedAt),
			});

			const normalized = userConversations
				.map(({ conversation }) => {
					const otherParticipants = conversation.participants.filter(
						(participant) => participant.userId !== userId,
					);
					const peerUser = otherParticipants[0]?.user;

					return {
						...conversation,
						displayName: getConversationDisplayName(conversation, userId),
						kindLabel:
							conversation.kind === "DIRECT"
								? "DM"
								: conversation.kind === "GROUP"
									? "Group"
									: "Team",
						peerUserId: conversation.kind === "DIRECT" ? peerUser?.id || null : null,
						peerDisplayName:
							conversation.kind === "DIRECT"
								? getUserDisplayName(peerUser)
								: null,
						lastMessage: conversation.messages[0] ?? null,
						otherParticipants,
					};
				})
				.filter((conversation) => kindMatchesFilter(conversation.kind, input.type));

			if (!input.search?.trim()) {
				return normalized.slice(input.offset, input.offset + input.limit);
			}

			const fuse = new Fuse(normalized, {
				keys: ["displayName", "lastMessage.content"],
				threshold: 0.3,
				ignoreLocation: true,
			});

			return fuse
				.search(input.search)
				.map((result) => result.item)
				.slice(input.offset, input.offset + input.limit);
		}),

	getConversationById: authenticatedProcedure
		.input(ConversationByIdSchema)
		.query(async ({ input, ctx }) => {
			const participation = await getActiveConversationParticipation(
				input.conversationId,
				ctx.user.id,
			);

			if (!participation) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "You are not a participant in this conversation",
				});
			}

			const conversation = await db.query.conversations.findFirst({
				where: eq(conversations.id, input.conversationId),
				with: {
					primaryTeam: true,
					secondaryTeam: true,
					participants: {
						where: isNull(conversationParticipants.leftAt),
						with: {
							user: true,
						},
					},
				},
			});

			if (!conversation) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Conversation not found",
				});
			}

			return conversation;
		}),

	sendMessage: authenticatedProcedure
		.input(MessageSendSchema)
		.mutation(async ({ input, ctx }) => {
			const participation = await getActiveConversationParticipation(
				input.conversationId,
				ctx.user.id,
			);

			if (!participation) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "You are not a participant in this conversation",
				});
			}

			const [message] = await db
				.insert(messages)
				.values({
					conversationId: input.conversationId,
					senderId: ctx.user.id,
					content: input.content,
				})
				.returning();

			const sender = await db.query.users.findFirst({ where: eq(users.id, ctx.user.id) });
			if (!sender) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Sender not found",
				});
			}

			return { ...message, sender };
		}),

	listMessagesByConversationId: authenticatedProcedure
		.input(MessageListByConversationIdSchema)
		.query(async ({ input, ctx }) => {
			const participation = await getActiveConversationParticipation(
				input.conversationId,
				ctx.user.id,
			);

			if (!participation) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "You are not a participant in this conversation",
				});
			}

			return db.query.messages.findMany({
				where: eq(messages.conversationId, input.conversationId),
				with: {
					sender: true,
				},
				orderBy: asc(messages.createdAt),
				limit: input.limit,
				offset: input.offset,
			});
		}),

	markMessagesAsRead: authenticatedProcedure
		.input(MessageMarkAsReadSchema)
		.mutation(async ({ input, ctx }) => {
			await db
				.update(messages)
				.set({ isRead: true })
				.where(
					and(
						inArray(messages.id, input.messageIds),
						ne(messages.senderId, ctx.user.id),
					),
				);

			return { success: true };
		}),
});
