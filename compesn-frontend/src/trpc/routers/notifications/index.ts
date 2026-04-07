import { createTRPCRouter, authenticatedProcedure } from "../../init";
import { NotificationsListSchema, NotificationMarkAsReadSchema } from "./notifications.schema";
import { db } from "../../../lib/database/db";
import { and, count, desc, eq, inArray } from "drizzle-orm";
import { notifications } from "@compesn/shared/common/schemas/notifications";
import { teams } from "@compesn/shared/common/schemas/teams";
import type { TNotification } from "@compesn/shared/common/types/notification";

function getTeamIdFromNotification(notification: TNotification): string | null {
	const data = notification.data;

	if (!data || typeof data !== "object") {
		return null;
	}

	return "teamId" in data && typeof data.teamId === "string" ? data.teamId : null;
}

export const notificationsRouter = createTRPCRouter({
	list: authenticatedProcedure.input(NotificationsListSchema).query(async ({ input, ctx }) => {
		const [notificationsList, total] = await Promise.all([
			db.query.notifications.findMany({
				where: eq(notifications.userId, ctx.user.id),
				offset: input.skip,
				limit: input.limit,
				orderBy: desc(notifications.createdAt),
			}),
			db
				.select({ count: count() })
				.from(notifications)
				.where(eq(notifications.userId, ctx.user.id))
				.then((rows) => rows[0]?.count ?? 0),
		]);

		const typedNotifications = notificationsList as TNotification[];
		const totalCount = Number(total);
		const currentAmount = input.skip + typedNotifications.length;
		const teamIds = Array.from(
			new Set(
				typedNotifications
					.map((notification) => getTeamIdFromNotification(notification))
					.filter((teamId): teamId is string => Boolean(teamId)),
			),
		);

		const teamsList =
			teamIds.length === 0
				? []
				: await db
						.select({ id: teams.id, name: teams.name, tag: teams.tag })
						.from(teams)
						.where(inArray(teams.id, teamIds));

		const teamsById = Object.fromEntries(teamsList.map((team) => [team.id, team]));

		return {
			notificationsList: typedNotifications,
			total: totalCount,
			currentAmount,
			hasMore: currentAmount < totalCount,
			teamsById,
		};
	}),

	markAsRead: authenticatedProcedure
		.input(NotificationMarkAsReadSchema)
		.mutation(async ({ input, ctx }) => {
			await db
				.update(notifications)
				.set({ read: true })
				.where(
					and(
						eq(notifications.id, input.notificationId),
						eq(notifications.userId, ctx.user.id),
					),
				);
			return true;
		}),
});
