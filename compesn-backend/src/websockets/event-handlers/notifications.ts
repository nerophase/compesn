import { notificationUserChannel } from "@/utils/socket-rooms";
import type { NotificationPublishPayload } from "@compesn/shared/types/realtime/socket";
import type { DraftServer, DraftSocket } from "@/websockets/socket-types";

export const registerNotificationHandlers = (io: DraftServer, socket: DraftSocket) => {
	socket.on("notifications:join", (userId: string) => {
		if (socket.data.notificationUserId && socket.data.notificationUserId !== userId) {
			socket.leave(notificationUserChannel(socket.data.notificationUserId));
		}

		socket.join(notificationUserChannel(userId));
		socket.data.notificationUserId = userId;
	});

	socket.on(
		"notifications:publish",
		(payload: NotificationPublishPayload) => {
			if (!payload.userId || !payload.notification) return;

			io.to(notificationUserChannel(payload.userId)).emit(
				"notifications:new",
				payload.notification,
			);
		},
	);
};
