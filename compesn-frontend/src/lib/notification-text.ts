import type { TNotification } from "@compesn/shared/types/notification";
import type { TNotificationType } from "@compesn/shared/types/notification-type";

export type TNotificationTeamsById = Record<
	string,
	{
		id: string;
		name: string;
		tag: string;
	}
>;

function getTeamName(teamId: string | undefined, teamsById: TNotificationTeamsById): string | null {
	if (!teamId) {
		return null;
	}

	return teamsById[teamId]?.name ?? null;
}

function assertNever(value: never): never {
	throw new Error(`Unhandled notification type: ${String(value)}`);
}

export function getNotificationLabel(type: TNotificationType): string {
	switch (type) {
		case "TEAM_INVITATION":
			return "Team Invitation";
		case "JOIN_DRAFT":
			return "Draft Invite";
		case "SCRIM_REQUEST":
			return "Scrim Request";
		case "SCRIM_ACCEPTED":
			return "Scrim Accepted";
		case "SCRIM_CONFIRMED":
			return "Scrim Confirmed";
		case "DRAFT_READY":
			return "Draft Ready";
		case "DRAFT_YOUR_TURN":
			return "Your Turn";
		case "DRAFT_COMPLETED":
			return "Draft Completed";
		case "DRAFT_EXPIRED":
			return "Draft Expired";
		default:
			return assertNever(type);
	}
}

export function generateNotificationText(
	notification: TNotification,
	teamsById: TNotificationTeamsById,
): string {
	switch (notification.type) {
		case "TEAM_INVITATION": {
			const teamName =
				notification.data?.teamName ?? getTeamName(notification.data?.teamId, teamsById);
			return teamName
				? `You received an invitation to join ${teamName}.`
				: "You received a team invitation.";
		}
		case "SCRIM_REQUEST": {
			const teamName =
				notification.data?.teamName ?? getTeamName(notification.data?.teamId, teamsById);
			return teamName
				? `${teamName} requested a scrim with your team.`
				: "You received a scrim request.";
		}
		case "JOIN_DRAFT":
			return notification.data?.teamName
				? `${notification.data.teamName} was invited to join a draft.`
				: "You were invited to join a draft.";
		case "SCRIM_ACCEPTED":
			return "Your scrim request was accepted.";
		case "SCRIM_CONFIRMED":
			return "Your scrim has been confirmed.";
		case "DRAFT_READY":
			return "Your scrim draft is ready.";
		case "DRAFT_YOUR_TURN":
			return "It is your turn in the draft.";
		case "DRAFT_COMPLETED":
			return "The draft has been completed.";
		case "DRAFT_EXPIRED":
			return "A draft has expired.";
		default:
			return assertNever(notification);
	}
}
