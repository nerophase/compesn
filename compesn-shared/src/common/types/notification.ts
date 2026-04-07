import {
	TNotificationDataMap,
	TNotificationType,
} from "./notification-type";

type TNotificationBase = {
	id: string;
	createdAt: Date;
	updatedAt: Date;
	userId: string;
	read: boolean;
};

export type TNotification = {
	[K in TNotificationType]: TNotificationBase & {
		type: K;
		data: TNotificationDataMap[K] | null;
	};
}[TNotificationType];
