import { io } from "@/app";
import { db } from "@/database";
import { notifications } from "@compesn/shared/common/schemas/notifications";
import { TNotificationDataMap, TNotificationType } from "@compesn/shared/common/types/notification-type";
import { notificationUserChannel } from "@/utils/socket-rooms";

export async function createNotification<T extends TNotificationType>(
	userId: string,
	type: T,
	data: TNotificationDataMap[T],
	triggerEvent: boolean = true,
) {
	const notification = await db.insert(notifications).values({ userId, type, data }).returning();

	if (triggerEvent) {
		io.to(notificationUserChannel(userId)).emit("notifications:new", notification);
	}

	return notification;
}
