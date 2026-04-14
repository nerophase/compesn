import { io } from "@/app";
import { db } from "@/database";
import { notifications } from "@compesn/shared/schemas/notifications";
import { TNotificationDataMap, TNotificationType } from "@compesn/shared/types/notification-type";
import { notificationUserChannel } from "@/utils/socket-rooms";

export async function createNotification<T extends TNotificationType>(
	userId: string,
	type: T,
	data: TNotificationDataMap[T],
	triggerEvent: boolean = true,
) {
	const notification = await db.insert(notifications).values({ userId, type, data }).returning();
	const notificationPayload = notification[0];

	if (triggerEvent && notificationPayload) {
		io.to(notificationUserChannel(userId)).emit("notifications:new", notificationPayload);
	}

	return notification;
}
