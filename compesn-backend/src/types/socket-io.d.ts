import "socket.io";

declare module "socket.io" {
	interface SocketData {
		draftRoomId?: string;
		draftTeamId?: string;
		notificationUserId?: string;
		userId?: string;
	}
}
