import { Socket } from "socket.io";

export const draftRoomChannel = (roomId: string) => `draft:room:${roomId}`;
export const draftTeamChannel = (teamId: string) => `draft:team:${teamId}`;
export const notificationUserChannel = (userId: string) => `notifications:user:${userId}`;

export const getDraftSocketContext = (socket: Socket) => ({
	roomId: socket.data.draftRoomId,
	teamId: socket.data.draftTeamId,
});
