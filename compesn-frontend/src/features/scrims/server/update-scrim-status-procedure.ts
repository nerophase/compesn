import { authenticatedProcedure } from "@/trpc/init";
import { ScrimUpdateStatusSchema } from "@/trpc/routers/scrims/scrims.schema";
import { db } from "@/lib/database/db";
import { and, eq, gte, lte, or, sql } from "drizzle-orm";
import { scrims } from "@compesn/shared/schemas";
import { TRPCError } from "@trpc/server";
import { createNotification } from "@/lib/notifications";
import { redis } from "@/lib/database/redis";
import { initializeDraftForScrim } from "@/trpc/routers/drafts";
import { logError } from "@compesn/shared/logging";
import {
	canCancelConfirmedScrim,
	getNextOpponentTeamId,
	isCreatingTeamOnlyTransition,
	isValidScrimTransition,
} from "./scrim-status";

export const updateStatusProcedure = authenticatedProcedure
	.input(ScrimUpdateStatusSchema)
	.mutation(async ({ input, ctx }) => {
		const userId = ctx.session.user.id;

		const scrim = await db.query.scrims.findFirst({
			where: eq(scrims.id, input.scrimId),
			with: {
				creatingTeam: {
					with: {
						members: true,
					},
				},
				opponentTeam: {
					with: {
						members: true,
					},
				},
			},
		});

		if (!scrim) {
			throw new TRPCError({
				code: "NOT_FOUND",
				message: "Scrim not found",
			});
		}

		const isCreatingTeamMember = scrim.creatingTeam.members.some((member) => member.userId === userId);
		const isOpponentTeamMember = scrim.opponentTeam?.members.some((member) => member.userId === userId);

		if (!isCreatingTeamMember && !isOpponentTeamMember) {
			throw new TRPCError({
				code: "FORBIDDEN",
				message: "You are not authorized to update this scrim",
			});
		}

		const currentStatus = scrim.status;
		const newStatus = input.status;

		if (!isValidScrimTransition(currentStatus, newStatus)) {
			throw new TRPCError({
				code: "BAD_REQUEST",
				message: `Cannot transition from ${currentStatus} to ${newStatus}`,
			});
		}

		if (isCreatingTeamOnlyTransition(newStatus) && !isCreatingTeamMember) {
			throw new TRPCError({
				code: "FORBIDDEN",
				message:
					newStatus === "ACCEPTED"
						? "Only the creating team can accept requests"
						: "Only the creating team can deny requests",
			});
		}

		if (
			newStatus === "CANCELLED" &&
			currentStatus === "CONFIRMED" &&
			!canCancelConfirmedScrim(scrim.startTime)
		) {
			throw new TRPCError({
				code: "BAD_REQUEST",
				message: "Cannot cancel a confirmed scrim within 2 hours of start time",
			});
		}

		if (newStatus === "CONFIRMED") {
			const teamsToCheck = [scrim.creatingTeamId];
			if (scrim.opponentTeamId) {
				teamsToCheck.push(scrim.opponentTeamId);
			}

			for (const teamId of teamsToCheck) {
				const overlappingScrim = await db.query.scrims.findFirst({
					where: and(
						or(eq(scrims.creatingTeamId, teamId), eq(scrims.opponentTeamId, teamId)),
						eq(scrims.status, "CONFIRMED"),
						sql`${scrims.id} != ${input.scrimId}`,
						and(
							lte(
								scrims.startTime,
								new Date(scrim.startTime.getTime() + scrim.durationMinutes * 60000),
							),
							gte(
								sql`${scrims.startTime} + INTERVAL '1 minute' * ${scrims.durationMinutes}`,
								scrim.startTime,
							),
						),
					),
				});

				if (overlappingScrim) {
					throw new TRPCError({
						code: "CONFLICT",
						message:
							"One of the teams already has a confirmed scrim during this time period",
					});
				}
			}
		}

		const [updatedScrim] = await db
			.update(scrims)
			.set({
				status: newStatus,
				opponentTeamId: getNextOpponentTeamId(newStatus, scrim.opponentTeamId),
			})
			.where(eq(scrims.id, input.scrimId))
			.returning();

		if (newStatus === "ACCEPTED" && scrim.opponentTeam) {
			await createNotification({
				userId: scrim.opponentTeam.members[0]?.userId || "",
				type: "SCRIM_ACCEPTED",
				title: "Scrim Request Accepted",
				message: `${scrim.creatingTeam.name} has accepted your scrim request`,
				data: { scrimId: input.scrimId },
			});
		}

		if (newStatus === "CONFIRMED") {
			try {
				await initializeDraftForScrim(input.scrimId);
			} catch (error) {
				logError("frontend.scrims.initializeDraft", error, { scrimId: input.scrimId });
			}

			const notifications = [];

			if (isCreatingTeamMember && scrim.opponentTeam) {
				notifications.push(
					createNotification({
						userId: scrim.opponentTeam.members[0]?.userId || "",
						type: "SCRIM_CONFIRMED",
						title: "Scrim Confirmed",
						message: `Your scrim with ${scrim.creatingTeam.name} has been confirmed`,
						data: { scrimId: input.scrimId },
					}),
				);
			}

			if (isOpponentTeamMember) {
				notifications.push(
					createNotification({
						userId: scrim.creatingTeam.members[0]?.userId || "",
						type: "SCRIM_CONFIRMED",
						title: "Scrim Confirmed",
						message: `Your scrim with ${scrim.opponentTeam?.name} has been confirmed`,
						data: { scrimId: input.scrimId },
					}),
				);
			}

			await Promise.all(notifications);
		}

		if (redis) {
			await redis.del("scrims:list:*");
		}

		return updatedScrim;
	});
