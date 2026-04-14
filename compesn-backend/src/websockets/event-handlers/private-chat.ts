import type {
	PrivateJoinPayload,
	SerializedPrivateMessage,
} from "@compesn/shared/types/realtime/socket";
import type { PrivateChatNamespace, PrivateChatSocket } from "@/websockets/socket-types";

export const registerPrivateChatHandlers = (
	io: PrivateChatNamespace,
	socket: PrivateChatSocket,
) => {
	socket.on("private:join", ({ userId, conversations = [] }: PrivateJoinPayload) => {
		if (!userId) {
			socket.emit("private:error", "userId is required");
			return;
		}

		socket.data.userId = userId;
		socket.join(userId);

		for (const conversationId of conversations) {
			socket.join(`conversation:${conversationId}`);
		}
	});

	socket.on("private:message", (message: SerializedPrivateMessage) => {
		if (!message.conversationId) {
			socket.emit("private:error", "conversationId is required");
			return;
		}

		io.to(`conversation:${message.conversationId}`).emit("private:message", message);
	});
};
