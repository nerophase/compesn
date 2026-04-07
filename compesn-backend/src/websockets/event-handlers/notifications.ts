import { Server, Socket } from "socket.io";
import { notificationUserChannel } from "@/utils/socket-rooms";

export const registerNotificationHandlers = (io: Server, socket: Socket) => {
	socket.on("notifications:join", (userId: string) => {
		if (socket.data.notificationUserId && socket.data.notificationUserId !== userId) {
			socket.leave(notificationUserChannel(socket.data.notificationUserId));
		}

		socket.join(notificationUserChannel(userId));
		socket.data.notificationUserId = userId;
	});

	socket.on(
		"notifications:publish",
		(payload: { userId?: string; notification?: unknown } | undefined) => {
			if (!payload?.userId || !payload.notification) return;

			io.to(notificationUserChannel(payload.userId)).emit(
				"notifications:new",
				payload.notification,
			);
		},
	);
};
