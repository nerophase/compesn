import { db } from "./database/db";
import { and, eq, lt } from "drizzle-orm";
import { redis } from "./database/redis";
import { createNotification } from "./notifications";
import { scrimDrafts } from "@compesn/shared/schemas/scrim-drafts";

/**
 * Scheduled job to check for expired drafts and update their status
 * This should be called periodically (e.g., every minute) by a cron job or similar
 */
export const checkAndExpireDrafts = async (): Promise<number> => {
	try {
		const now = new Date();

		// Find all drafts that are PENDING or ACTIVE and have expired
		const expiredDrafts = await db.query.scrimDrafts.findMany({
			where: and(
				eq(scrimDrafts.status, "PENDING") || eq(scrimDrafts.status, "ACTIVE"),
				lt(scrimDrafts.expiresAt, now),
			),
			with: {
				blueTeam: {
					with: {
						members: true,
					},
				},
				redTeam: {
					with: {
						members: true,
					},
				},
			},
		});

		if (expiredDrafts.length === 0) {
			return 0;
		}

		// Update all expired drafts to EXPIRED status
		const expiredDraftIds = expiredDrafts.map((draft) => draft.id);

		await db
			.update(scrimDrafts)
			.set({ status: "EXPIRED" })
			.where(
				and(
					eq(scrimDrafts.status, "PENDING") || eq(scrimDrafts.status, "ACTIVE"),
					lt(scrimDrafts.expiresAt, now),
				),
			);

		// Send expiration notifications to all team members
		const notificationPromises = expiredDrafts.flatMap((draft) => {
			const allMembers = [...draft.blueTeam.members, ...draft.redTeam.members];

			return allMembers.map((member) =>
				createNotification({
					userId: member.userId,
					type: "DRAFT_EXPIRED",
					title: "Draft Expired",
					message: "Your draft session has expired due to inactivity.",
					data: {
						draftId: draft.id,
						scrimId: draft.scrimId,
					},
				}),
			);
		});

		await Promise.all(notificationPromises);

		// Clear cache for expired drafts
		const cachePromises = expiredDraftIds.map((id) => redis?.del(`draft:${id}`));
		await Promise.all(cachePromises);

		console.log(`Expired ${expiredDrafts.length} drafts at ${now.toISOString()}`);

		return expiredDrafts.length;
	} catch (error) {
		console.error("Error checking and expiring drafts:", error);
		throw error;
	}
};
