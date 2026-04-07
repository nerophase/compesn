import { z } from "zod";

export const ENotificationType = z.enum([
	"TEAM_INVITATION",
	"JOIN_DRAFT",
	"SCRIM_REQUEST",
	"SCRIM_ACCEPTED",
	"SCRIM_CONFIRMED",
	"DRAFT_READY",
	"DRAFT_YOUR_TURN",
	"DRAFT_COMPLETED",
	"DRAFT_EXPIRED",
]);

export type TNotificationType = z.infer<typeof ENotificationType>;

export type TJoinRoomNotificationData = {
	roomId: string;
	teamName: string;
};

export type TTeamInvitationNotificationData = {
	teamId: string;
	teamName: string;
	inviteId?: string;
};

export type TScrimNotificationData = {
	scrimId: string;
	teamId?: string;
	teamName?: string;
};

export type TDraftNotificationData = {
	draftId: string;
	scrimId: string;
	teamName?: string;
};

export type TNotificationDataMap = {
	"JOIN_DRAFT": TJoinRoomNotificationData;
	"TEAM_INVITATION": TTeamInvitationNotificationData;
	"SCRIM_REQUEST": TScrimNotificationData;
	"SCRIM_ACCEPTED": TScrimNotificationData;
	"SCRIM_CONFIRMED": TScrimNotificationData;
	"DRAFT_READY": TDraftNotificationData;
	"DRAFT_YOUR_TURN": TDraftNotificationData;
	"DRAFT_COMPLETED": TDraftNotificationData;
	"DRAFT_EXPIRED": TDraftNotificationData;
};
