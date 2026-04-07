import { TTeamColor } from "@compesn/shared/common/types/team-color";
import { Socket } from "socket.io";
import { roomService } from "@/services/room";
import { getTeam } from "@/utils";
import { getDraftSocketContext } from "@/utils/socket-rooms";

type Room = NonNullable<Awaited<ReturnType<typeof roomService.getRoomById>>>;
type RoomContext = {
	roomId: string;
	teamId: string | undefined;
	room: Room;
	currentDraft: Room["drafts"][number];
};

type DraftTeamContext = {
	roomId: string;
	teamId: string | undefined;
	room: Room;
	currentDraft: Room["drafts"][number];
	team: TTeamColor;
};

export const requireRoomContext = async (
	socket: Socket,
	errorEvent: string = "error:room",
	errorMessage: string = "User has not connected to any room.",
): Promise<RoomContext | null> => {
	const { roomId } = getDraftSocketContext(socket);
	const room = await roomService.getRoomById(roomId);

	if (!room) {
		socket.emit(errorEvent, errorMessage);
		return null;
	}

	const currentDraft = room.drafts[room.currentDraft];

	if (!currentDraft) {
		socket.emit(errorEvent, errorMessage);
		return null;
	}

	return {
		roomId,
		teamId: socket.data.draftTeamId as string | undefined,
		room,
		currentDraft,
	};
};

export const requireDraftTeamContext = async (
	socket: Socket,
	errorEvent: string = "error:room",
): Promise<DraftTeamContext | null> => {
	const context = await requireRoomContext(socket, errorEvent);

	if (!context?.currentDraft) {
		socket.emit(errorEvent, "User has not connected to any room.");
		return null;
	}

	const team = getTeam(context.teamId, context.currentDraft);

	if (!team) {
		socket.emit(errorEvent, "User has not connected to any draft team.");
		return null;
	}

	return {
		...context,
		team,
	};
};

export const isCurrentTeamTurn = (
	team: TTeamColor,
	currentDraft: DraftTeamContext["currentDraft"],
	turnNumber: number,
) =>
	team === currentDraft.turn?.team &&
	turnNumber === currentDraft.turn.number &&
	currentDraft.state === "ongoing";
