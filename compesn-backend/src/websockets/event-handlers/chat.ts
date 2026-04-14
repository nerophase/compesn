import { draftRoomChannel, draftTeamChannel, getDraftSocketContext } from "@/utils/socket-rooms";
import type { DraftChatMessage } from "@compesn/shared/types/realtime/socket";
import type { DraftServer, DraftSocket } from "@/websockets/socket-types";

export const registerChatHandlers = (io: DraftServer, socket: DraftSocket) => {
	socket.on("chat:message", ({ name, team, all, text }: DraftChatMessage) => {
		const { teamId, roomId } = getDraftSocketContext(socket);

		if (!roomId) {
			socket.emit("error:room", "User has not connected to any room.");
			return;
		}

		if (!all && !teamId) {
			socket.emit("error:room", "User has not connected to any team.");
			return;
		}

		const sender = all ? socket.to(draftRoomChannel(roomId)) : socket.to(draftTeamChannel(teamId!));
		sender.emit("chat:message", { name, team, all, text });
	});
};
