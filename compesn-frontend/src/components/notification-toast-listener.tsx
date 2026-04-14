"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import type { TNotification } from "@compesn/shared/types/notification";
import type { SerializedNotification } from "@compesn/shared/types/realtime/socket";
import { getNotificationLabel, generateNotificationText } from "@/lib/notification-text";
import { socket } from "@/lib/sockets";
import { useTRPC } from "@/trpc/client";

export function NotificationToastListener() {
	const session = useSession();
	const trpc = useTRPC();
	const queryClient = useQueryClient();

	useEffect(() => {
		if (session.status !== "authenticated" || !session.data.user.id) {
			return;
		}

		const userId = session.data.user.id;

		const joinNotificationsRoom = () => {
			socket.emit("notifications:join", userId);
		};

		const handleNewNotification = (notification: SerializedNotification) => {
			const normalizedNotification = {
				...notification,
				createdAt:
					typeof notification.createdAt === "string"
						? new Date(notification.createdAt)
						: notification.createdAt,
				updatedAt:
					typeof notification.updatedAt === "string"
						? new Date(notification.updatedAt)
						: notification.updatedAt,
			} as TNotification;

			if (normalizedNotification.type === "TEAM_INVITATION") {
				void queryClient.invalidateQueries(trpc.teams.userInvites.queryOptions());
				void queryClient.invalidateQueries(trpc.teams.userTeams.queryOptions());
				void queryClient.invalidateQueries(trpc.teams.userTeamsFlat.queryOptions());
			}

			toast.info(getNotificationLabel(normalizedNotification.type), {
				description: generateNotificationText(normalizedNotification, {}),
			});
		};

		if (!socket.connected) {
			socket.connect();
		}

		joinNotificationsRoom();
		socket.on("connect", joinNotificationsRoom);
		socket.on("notifications:new", handleNewNotification);

		return () => {
			socket.off("connect", joinNotificationsRoom);
			socket.off("notifications:new", handleNewNotification);
		};
	}, [queryClient, session.data?.user.id, session.status, trpc]);

	return null;
}
