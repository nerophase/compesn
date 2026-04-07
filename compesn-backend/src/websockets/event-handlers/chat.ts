import { Server, Socket } from "socket.io";
import { draftRoomChannel, draftTeamChannel, getDraftSocketContext } from "@/utils/socket-rooms";

export const registerChatHandlers = (io: Server, socket: Socket) => {
	socket.on("chat:message", ({ name, team, all, text }: any) => {
		const { teamId, roomId } = getDraftSocketContext(socket);

		if (!roomId) {
			socket.emit("errorRoom", "User has not connected to any room.");
			return;
		}

		if (!all && !teamId) {
			socket.emit("errorRoom", "User has not connected to any team.");
			return;
		}

		const sender = all ? socket.to(draftRoomChannel(roomId)) : socket.to(draftTeamChannel(teamId!));
		sender.emit("chat:message", { name, team, all, text });
	});
};
