import { TNotificationDataMap, TNotificationType } from "@compesn/shared/common/types/notification-type";
import { env } from "@/environment";
import { db } from "@/lib/database/db";
import { notifications } from "@compesn/shared/common/schemas";
import { io as createSocket, Socket } from "socket.io-client";

let notificationSocket: Socket | null = null;

function getNotificationSocket() {
	if (typeof window !== "undefined") return null;

	if (!notificationSocket) {
		notificationSocket = createSocket(env.NEXT_PUBLIC_SERVER_URL, {
			autoConnect: true,
			transports: ["websocket"],
		});
	}

	if (!notificationSocket.connected) {
		notificationSocket.connect();
	}

	return notificationSocket;
}

// Legacy function signature for backward compatibility
export async function createNotification<T extends TNotificationType>(
	userId: string,
	type: T,
	data: TNotificationDataMap[T],
	triggerEvent?: boolean,
): Promise<any>;

// New function signature with title and message
export async function createNotification<T extends TNotificationType>(params: {
	userId: string;
	type: T;
	title: string;
	message: string;
	data: TNotificationDataMap[T];
	triggerEvent?: boolean;
}): Promise<any>;

// Implementation
export async function createNotification<T extends TNotificationType>(
	userIdOrParams:
		| string
		| {
				userId: string;
				type: T;
				title: string;
				message: string;
				data: TNotificationDataMap[T];
				triggerEvent?: boolean;
		  },
	type?: T,
	dataOrTriggerEvent?: TNotificationDataMap[T] | boolean,
	triggerEvent: boolean = true,
) {
	let userId: string;
	let notificationType: T;
	let notificationData: TNotificationDataMap[T];
	let shouldTriggerEvent: boolean;

	if (typeof userIdOrParams === "string") {
		// Legacy signature
		userId = userIdOrParams;
		notificationType = type!;
		notificationData = dataOrTriggerEvent as TNotificationDataMap[T];
		shouldTriggerEvent = triggerEvent;
	} else {
		// New signature
		userId = userIdOrParams.userId;
		notificationType = userIdOrParams.type;
		notificationData = userIdOrParams.data;
		shouldTriggerEvent = userIdOrParams.triggerEvent ?? true;
	}

	const notification = await db
		.insert(notifications)
		.values({
			userId,
			type: notificationType,
			data: notificationData,
		})
		.returning();

	if (shouldTriggerEvent) {
		const notificationPayload = notification[0];

		if (notificationPayload) {
			getNotificationSocket()?.emit("notifications:publish", {
				userId,
				notification: notificationPayload,
			});
		}
	}

	return notification;
}
