import { z } from "zod";

export const NotificationsListSchema = z.object({
	skip: z.number().default(0),
	limit: z.number().default(10),
});

export const NotificationMarkAsReadSchema = z.object({
	notificationId: z.string(),
});
