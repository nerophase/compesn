import { db } from "@/lib/database/db";
import {
	conversations,
	conversationParticipants,
	teamMembers,
	teams,
	users,
} from "@compesn/shared/schemas";
import { and, eq, inArray, isNull, or } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

type ConversationKind = (typeof conversations.$inferSelect)["kind"];

const sortIds = (ids: string[]) => [...ids].sort((a, b) => a.localeCompare(b));

export const buildDirectScopeKey = (userAId: string, userBId: string) => {
	const [firstId, secondId] = sortIds([userAId, userBId]);
	return `dm:${firstId}:${secondId}`;
};

export const buildInternalTeamScopeKey = (teamId: string) => `team:${teamId}`;

export const buildTeamConnectionScopeKey = (teamAId: string, teamBId: string) => {
	const [firstId, secondId] = sortIds([teamAId, teamBId]);
	return `team-link:${firstId}:${secondId}`;
};

export const normalizeTeamPair = (teamId: string, counterpartTeamId?: string) => {
	if (!counterpartTeamId) {
		return {
			primaryTeamId: teamId,
			secondaryTeamId: null,
		};
	}

	const [primaryTeamId, secondaryTeamId] = sortIds([teamId, counterpartTeamId]);
	return {
		primaryTeamId,
		secondaryTeamId,
	};
};

const findConversationByScopeKey = async (scopeKey: string) => {
	return db.query.conversations.findFirst({
		where: eq(conversations.scopeKey, scopeKey),
	});
};

const createConversationWithParticipants = async ({
	name,
	isGroup,
	kind,
	scopeKey,
	primaryTeamId,
	secondaryTeamId,
	participantIds,
}: {
	name: string | null;
	isGroup: boolean;
	kind: ConversationKind;
	scopeKey: string;
	primaryTeamId?: string | null;
	secondaryTeamId?: string | null;
	participantIds: string[];
}) => {
	const [conversation] = await db
		.insert(conversations)
		.values({
			name,
			isGroup,
			kind,
			scopeKey,
			primaryTeamId: primaryTeamId ?? null,
			secondaryTeamId: secondaryTeamId ?? null,
		})
		.returning();

	if (participantIds.length > 0) {
		await db.insert(conversationParticipants).values(
			participantIds.map((userId) => ({
				conversationId: conversation.id,
				userId,
			})),
		);
	}

	return conversation;
};

export const reconcileConversationParticipants = async (
	conversationId: string,
	desiredParticipantIds: string[],
) => {
	const uniqueDesiredParticipantIds = Array.from(new Set(desiredParticipantIds));
	const existingParticipants = await db.query.conversationParticipants.findMany({
		where: eq(conversationParticipants.conversationId, conversationId),
	});

	const participantsByUserId = new Map(existingParticipants.map((item) => [item.userId, item]));
	const now = new Date();

	for (const userId of uniqueDesiredParticipantIds) {
		const existing = participantsByUserId.get(userId);
		if (!existing) {
			await db.insert(conversationParticipants).values({
				conversationId,
				userId,
			});
			continue;
		}

		if (existing.leftAt) {
			await db
				.update(conversationParticipants)
				.set({ leftAt: null })
				.where(eq(conversationParticipants.id, existing.id));
		}
	}

	for (const existing of existingParticipants) {
		if (!existing.leftAt && !uniqueDesiredParticipantIds.includes(existing.userId)) {
			await db
				.update(conversationParticipants)
				.set({ leftAt: now })
				.where(eq(conversationParticipants.id, existing.id));
		}
	}
};

const getActiveTeamMemberIds = async (teamId: string) => {
	const members = await db.query.teamMembers.findMany({
		where: eq(teamMembers.teamId, teamId),
	});

	return members.map((member) => member.userId);
};

const getTeamConversationParticipantIds = async (
	primaryTeamId: string,
	secondaryTeamId?: string | null,
) => {
	const memberIds = await getActiveTeamMemberIds(primaryTeamId);
	if (!secondaryTeamId) {
		return memberIds;
	}

	const counterpartIds = await getActiveTeamMemberIds(secondaryTeamId);
	return Array.from(new Set([...memberIds, ...counterpartIds]));
};

export const syncTeamConversationParticipants = async (conversationId: string) => {
	const conversation = await db.query.conversations.findFirst({
		where: eq(conversations.id, conversationId),
	});

	if (!conversation) {
		return;
	}

	if (
		conversation.kind !== "TEAM_INTERNAL" &&
		conversation.kind !== "TEAM_CONNECTION"
	) {
		return;
	}

	if (!conversation.primaryTeamId) {
		return;
	}

	const desiredParticipantIds = await getTeamConversationParticipantIds(
		conversation.primaryTeamId,
		conversation.secondaryTeamId,
	);

	await reconcileConversationParticipants(conversation.id, desiredParticipantIds);
};

export const syncConversationsForTeam = async (teamId: string) => {
	const linkedConversations = await db.query.conversations.findMany({
		where: or(
			eq(conversations.primaryTeamId, teamId),
			eq(conversations.secondaryTeamId, teamId),
		),
	});

	for (const conversation of linkedConversations) {
		await syncTeamConversationParticipants(conversation.id);
	}
};

export const getOrCreateDirectConversation = async (
	currentUserId: string,
	targetUserId: string,
) => {
	const scopeKey = buildDirectScopeKey(currentUserId, targetUserId);
	let conversation = await findConversationByScopeKey(scopeKey);

	if (!conversation) {
		const participantUsers = await db.query.users.findMany({
			where: inArray(users.id, [currentUserId, targetUserId]),
		});

		if (participantUsers.length !== 2) {
			throw new TRPCError({
				code: "BAD_REQUEST",
				message: "One or more participants do not exist",
			});
		}

		conversation = await createConversationWithParticipants({
			name: null,
			isGroup: false,
			kind: "DIRECT",
			scopeKey,
			participantIds: [currentUserId, targetUserId],
		});
	} else {
		await reconcileConversationParticipants(conversation.id, [currentUserId, targetUserId]);
	}

	return conversation;
};

export const getOrCreateTeamConversation = async (
	teamId: string,
	counterpartTeamId?: string,
) => {
	const { primaryTeamId, secondaryTeamId } = normalizeTeamPair(teamId, counterpartTeamId);
	const scopeKey = counterpartTeamId
		? buildTeamConnectionScopeKey(teamId, counterpartTeamId)
		: buildInternalTeamScopeKey(teamId);

	let conversation = await findConversationByScopeKey(scopeKey);

	if (!conversation) {
		const scopedTeams = await db.query.teams.findMany({
			where: secondaryTeamId
				? inArray(teams.id, [primaryTeamId, secondaryTeamId])
				: eq(teams.id, primaryTeamId),
		});

		const requiredTeamCount = secondaryTeamId ? 2 : 1;
		if (scopedTeams.length !== requiredTeamCount) {
			throw new TRPCError({
				code: "NOT_FOUND",
				message: "One or more teams were not found",
			});
		}

		const teamNameById = new Map(scopedTeams.map((team) => [team.id, team.name]));
		const participantIds = await getTeamConversationParticipantIds(
			primaryTeamId,
			secondaryTeamId,
		);

		const name = secondaryTeamId
			? `${teamNameById.get(primaryTeamId)} / ${teamNameById.get(secondaryTeamId)}`
			: `${teamNameById.get(primaryTeamId)} Team Chat`;

		conversation = await createConversationWithParticipants({
			name,
			isGroup: true,
			kind: secondaryTeamId ? "TEAM_CONNECTION" : "TEAM_INTERNAL",
			scopeKey,
			primaryTeamId,
			secondaryTeamId,
			participantIds,
		});
	} else {
		await syncTeamConversationParticipants(conversation.id);
	}

	return conversation;
};

export const ensureUserBelongsToTeam = async (userId: string, teamId: string) => {
	const membership = await db.query.teamMembers.findFirst({
		where: and(eq(teamMembers.userId, userId), eq(teamMembers.teamId, teamId)),
	});

	if (!membership) {
		throw new TRPCError({
			code: "FORBIDDEN",
			message: "You must be a member of the selected team",
		});
	}

	return membership;
};

export const getActiveConversationParticipation = async (
	conversationId: string,
	userId: string,
) => {
	return db.query.conversationParticipants.findFirst({
		where: and(
			eq(conversationParticipants.conversationId, conversationId),
			eq(conversationParticipants.userId, userId),
			isNull(conversationParticipants.leftAt),
		),
	});
};
