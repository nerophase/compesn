import { TMessage, TUser } from "@compesn/shared/common/schemas";
import { Socket, Namespace } from "socket.io";

type PrivateJoinPayload = {
	userId: string;
	conversations: string[];
	// token?: string; // optional if you later want to verify JWT
};

type PrivateMessagePayload = {
	toUserId?: string; // For 1-on-1 messages
	conversationId?: string; // For group messages
	text: string;
};

type GroupJoinPayload = {
	userId: string;
	conversationId: string;
};

type TPrivateMessage = {
	conversationId: string;
	text: string;
	sentAt: string;
};

export const registerPrivateChatHandlers = (io: Namespace, socket: Socket) => {
	// When user connects, they “register” who they are
	socket.on("private:join", ({ userId, conversations = [] }: PrivateJoinPayload) => {
		if (!userId) {
			socket.emit("private:error", "userId is required");
			console.error("userId is required");
			return;
		}

		socket.data.userId = userId;

		// Join a room named after wthe userId so others can target this user
		socket.join(userId);

		for (const conversationId of conversations) {
			socket.join(`conversation:${conversationId}`);
		}
		// socket.emit("private:joined", { userId });
	});

	// Join a conversation
	// socket.on("private:join-conversation", async ({ userId, conversationId }: GroupJoinPayload) => {
	// 	if (!userId || !conversationId) {
	// 		socket.emit("private:error", "userId and conversationId are required");
	// 		console.error("userId and conversationId are required");
	// 		return;
	// 	}

	// 	// TODO: Verify user is a participant in this conversation
	// 	// const isParticipant = await verifyConversationParticipant(userId, conversationId);
	// 	// if (!isParticipant) {
	// 	//   socket.emit("private:error", "You are not a member of this conversation");
	// 	//   return;
	// 	// }

	// 	// socket.data.userId = userId;

	// 	// Join the conversation room (all participants in this group)
	// 	socket.join(`conversation:${conversationId}`);

	// 	// socket.emit("group:joined", { userId, conversationId });

	// 	// Optionally notify others in the group
	// 	// socket
	// 	// 	.to(`conversation:${conversationId}`)
	// 	// 	.emit("group:user-joined", { userId, conversationId });
	// });

	// Sending a message (supports both DM and group chat)
	socket.on("private:message", (message: TMessage & { sender: TUser }) => {
		// const fromUserId = socket.data.userId as string | undefined;

		// if (!fromUserId) {
		// 	socket.emit("private:error", "You must join before sending messages");
		// 	return;
		// }

		// if (!message.content?.trim()) {
		// 	socket.emit("private:error", "text is required");
		// 	return;
		// }

		if (message.conversationId) {
			// if (!socket.rooms.has(`conversation:${message.conversationId}`)) {
			// 	socket.emit(
			// 		"private:error",
			// 		"You must join the conversation before sending messages",
			// 	);
			// 	return;
			// }

			// const message: TPrivateMessage = {
			// 	conversationId,
			// 	fromUserId,
			// 	text: text.trim(),
			// 	sentAt: new Date().toISOString(),
			// };

			// Broadcast to all participants in the conversation
			io.to(`conversation:${message.conversationId}`).emit("private:message", message);

			// TODO: Save message to database
			// await saveMessage(conversationId, fromUserId, text.trim());
		}
		// Direct message (existing functionality)
		// else if (toUserId) {
		// 	const message: TPrivateMessage = {
		// 		fromUserId,
		// 		toUserId,
		// 		text: text.trim(),
		// 		sentAt: new Date().toISOString(),
		// 	};

		// 	// deliver to recipient
		// 	io.to(toUserId).emit("private:message", message);
		// 	// echo back to sender so UI can show it immediately
		// 	socket.emit("private:message", message);
		// }
		else {
			socket.emit("private:error", "conversationId is required");
		}
	});

	socket.on("disconnect", () => {
		const userId = socket.data.userId as string | undefined;

		if (userId) {
			// Optional: presence/event for “user went offline”
			// io.to(userId).emit("private:user-offline", { userId });
		}
	});
};
