import { roomService } from "@/services/room";
import { TRoomMember } from "@compesn/shared/common/types/room-member";
import { Socket } from "socket.io";

type Room = NonNullable<Awaited<ReturnType<typeof roomService.getRoomById>>>;

export const requireRoomById = async (
	socket: Socket,
	roomId: string,
	errorEvent: string = "error:room",
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
