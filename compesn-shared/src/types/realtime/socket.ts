import type { TMessage as DbMessage } from "../../schemas/conversations";
import type { TUser } from "../../schemas/users";
import type { TNotification } from "../notification";
import type { TChampion } from "../champion";
import type { TDraft } from "../draft";
import type { TTeamColor } from "../team-color";
import type { TRoomMember } from "../room-member";
import type { TRoom } from "../../schemas/rooms";

type RealtimeDate = string | Date;

export type DraftChatMessage = {
	id?: string;
	name: string;
	team: TTeamColor | undefined;
	all: boolean;
	text: string;
};

export type DraftUpdatePayload = {
	draft: TDraft;
	draftIdx: number;
};

export type RoomJoinPayload = {
	roomId: string;
};

export type RoomJoinTeamPayload = {
	roomId: string;
	teamId: string;
	userId: string;
	name: string;
	isGuest: boolean;
	autoJoin?: boolean;
};

export type RoomUserJoinedTeamPayload = {
	room: TRoom;
	roomMember: TRoomMember;
	userId: string | null;
};

export type DraftCountdownPayload = {
	countdown: number;
};

export type DraftSetReadyPayload = {
	ready: boolean;
};

export type DraftSelectChampionPayload = {
	selectedChampion: string;
	turnNumber: number;
};

export type DraftTurnNumberPayload = {
	turnNumber: number;
};

export type DraftNextDraftArgs = [swapSides: boolean, currentDraft: number];
export type DraftNextDraftPayload = [room: TRoom, swapTeams: boolean];

export type SerializedPrivateMessage = Omit<DbMessage, "createdAt" | "updatedAt"> & {
	createdAt: RealtimeDate;
	updatedAt: RealtimeDate;
	sender: TUser;
};

export type PrivateJoinPayload = {
	userId: string;
	conversations?: string[];
};

export type SerializedNotification = Omit<TNotification, "createdAt" | "updatedAt"> & {
	createdAt: RealtimeDate;
	updatedAt: RealtimeDate;
};

export type NotificationPublishPayload = {
	userId: string;
	notification: SerializedNotification;
};

export interface DraftClientToServerEvents {
	"room:join-room": (payload: RoomJoinPayload) => void;
	"room:join-team": (payload: RoomJoinTeamPayload) => void;
	"chat:message": (payload: DraftChatMessage) => void;
	"draft:set-ready": (payload: DraftSetReadyPayload) => void;
	"draft:select-champion": (payload: DraftSelectChampionPayload) => void;
	"draft:lock-champion": (payload: DraftTurnNumberPayload) => void;
	"draft:no-ban": (payload: DraftTurnNumberPayload) => void;
	"draft:reset-turn": () => void;
	"draft:reset-draft": () => void;
	"draft:terminate-draft": () => void;
	"draft:request-repeat-previous-turn": (team: TTeamColor) => void;
	"draft:repeat-previous-turn": (turnNumber: number) => void;
	"draft:decline-repeat-previous-turn": (turnNumber: number) => void;
	"draft:team-wins": (team: TTeamColor) => void;
	"draft:next-draft": (...args: DraftNextDraftArgs) => void;
}

export interface DraftServerToClientEvents {
	"room:user-joined-team": (payload: RoomUserJoinedTeamPayload) => void;
	"room:update-members": (members: TRoomMember[]) => void;
	"chat:message": (payload: DraftChatMessage) => void;
	"draft:countdown": (payload: DraftCountdownPayload) => void;
	"draft:updated-status": () => void;
	"draft:update": (payload: DraftUpdatePayload) => void;
	"draft:time-over": (team: TTeamColor | undefined) => void;
	"draft:reset-turn": () => void;
	"draft:reset-draft": () => void;
	"draft:terminate-draft": (hasNextDraft: boolean) => void;
	"draft:requested-repeat-previous-turn": (team: TTeamColor | undefined) => void;
	"draft:repeat-previous-turn": () => void;
	"draft:decline-repeat-previous-turn": () => void;
	"draft:next-draft": (...args: DraftNextDraftPayload) => void;
	"error:joining-room": (message: string) => void;
	"error:room": (message: string) => void;
	"error:not-connected": (message: string) => void;
	"error:locking-champion": (message: string) => void;
	"error:selecting-champion": (message: string) => void;
}

export interface PrivateChatClientToServerEvents {
	"private:join": (payload: PrivateJoinPayload) => void;
	"private:message": (message: SerializedPrivateMessage) => void;
}

export interface PrivateChatServerToClientEvents {
	"private:message": (message: SerializedPrivateMessage) => void;
	"private:error": (message: string) => void;
}

export interface NotificationClientToServerEvents {
	"notifications:join": (userId: string) => void;
	"notifications:publish": (payload: NotificationPublishPayload) => void;
}

export interface NotificationServerToClientEvents {
	"notifications:new": (notification: SerializedNotification) => void;
}

export type CompesnSocketData = {
	draftRoomId?: string;
	draftTeamId?: string;
	notificationUserId?: string;
	userId?: string;
};
