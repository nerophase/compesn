import { TMessage, TUser } from "@compesn/shared/common/schemas";
import { Namespace, Socket } from "socket.io";

type PrivateJoinPayload = {
	userId: string;
	conversations: string[];
};

export const registerPrivateChatHandlers = (io: Namespace, socket: Socket) => {
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

	socket.on("private:message", (message: TMessage & { sender: TUser }) => {
		if (!message.conversationId) {
			socket.emit("private:error", "conversationId is required");
			return;
		}

		io.to(`conversation:${message.conversationId}`).emit("private:message", message);
	});
};
