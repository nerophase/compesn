import { roomService } from "@/services/room";
import { TRoomMember } from "@compesn/shared/types/room-member";
import type { DraftSocket } from "@/websockets/socket-types";

type Room = NonNullable<Awaited<ReturnType<typeof roomService.getRoomById>>>;
type DraftErrorEvent = "error:room" | "error:joining-room" | "error:not-connected";

export const requireRoomById = async (
	socket: DraftSocket,
	roomId: string,
	errorEvent: DraftErrorEvent = "error:room",
	errorMessage: string = "Wrong room id.",
): Promise<Room | null> => {
	const room = await roomService.getRoomById(roomId);

	if (!room) {
		socket.emit(errorEvent, errorMessage);
		return null;
	}

	return room;
};

export const findRoomMemberBySocketId = (room: Room, socketId: string): TRoomMember | undefined =>
	room.members.find((roomMember: TRoomMember) => roomMember.socketId === socketId);
