import { createTRPCRouter, authenticatedProcedure } from "../../init";
import {
	DraftByIdSchema,
	DraftMakeActionSchema,
	DraftInitializeSchema,
	getNextTurn,
	getTeamFromTurn,
	getActionFromTurn,
} from "./drafts.schema";
import { db } from "../../../lib/database/db";
import { eq } from "drizzle-orm";

import { TRPCError } from "@trpc/server";
import { redis } from "../../../lib/database/redis";
import { createNotification } from "../../../lib/notifications";
import { scrims } from "@compesn/shared/common/schemas/scrims";
import { scrimDrafts, TScrimDraftInsert } from "@compesn/shared/common/schemas/scrim-drafts";
import { teamMembers } from "@compesn/shared/common/schemas/teams";

// Internal service function to initialize draft for scrim
export const initializeDraftForScrim = async (scrimId: string) => {
	// Get the scrim with team information
	const scrim = await db.query.scrims.findFirst({
		where: eq(scrims.id, scrimId),
		with: {
			creatingTeam: {
				with: {
					members: {
						with: {
							user: {
								with: {
									riotAccount: true,
								},
							},
						},
					},
				},
			},
			opponentTeam: {
				with: {
					members: {
						with: {
							user: {
								with: {
									riotAccount: true,
								},
							},
						},
					},
				},
			},
		},
	});

	if (!scrim || !scrim.opponentTeam) {
		throw new Error("Scrim not found or missing opponent team");
	}

	// Check if draft already exists
	const existingDraft = await db.query.scrimDrafts.findFirst({
		where: eq(scrimDrafts.scrimId, scrimId),
	});

	if (existingDraft) {
		return existingDraft;
	}

	// Determine which team is blue and which is red (creating team is blue by default)
	const blueTeamId = scrim.creatingTeamId;
	const redTeamId = scrim.opponentTeam.id;

	// Extract PUUIDs from team rosters
	const blueRoster = scrim.creatingTeam.members
		.filter((member) => member.user.riotAccount?.puuid)
		.map((member) => member.user.riotAccount!.puuid);

	const redRoster = scrim.opponentTeam.members
		.filter((member) => member.user.riotAccount?.puuid)
		.map((member) => member.user.riotAccount!.puuid);

	// Create draft with 15-minute expiration
	const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

	const newDraft: TScrimDraftInsert = {
		scrimId,
		blueTeamId,
		redTeamId,
		status: "PENDING",
		bluePicks: [],
		redPicks: [],
		blueBans: [],
		redBans: [],
		currentTurn: "BLUE_BAN_1",
		turnStartAt: null, // Will be set when draft becomes active
		expiresAt,
		blueRoster,
		redRoster,
	};

	const [createdDraft] = await db.insert(scrimDrafts).values(newDraft).returning();

	// Clear any cached draft data
	await redis?.del(`draft:${createdDraft.id}`);

	// Send notifications to all team members that the draft is ready
	const allMembers = [...scrim.creatingTeam.members, ...scrim.opponentTeam.members];

	const notificationPromises = allMembers.map((member) =>
		createNotification({
			userId: member.userId,
			type: "DRAFT_READY",
			title: "Draft Ready",
			message: `The draft for your scrim is ready to begin!`,
			data: {
				draftId: createdDraft.id,
				scrimId,
			},
		}),
	);

	await Promise.all(notificationPromises);

	return createdDraft;
};

export const draftsRouter = createTRPCRouter({
	// Get draft by ID with full team information
	getById: authenticatedProcedure.input(DraftByIdSchema).query(async ({ input, ctx }) => {
		const userId = ctx.session.user.id;

		// Try to get from cache first
		const cacheKey = `draft:${input.draftId}`;
		const cached = await redis?.get(cacheKey);
		if (cached) {
			const draft = JSON.parse(cached);
			// Verify user has access to this draft
			const userTeam = await db.query.teamMembers.findFirst({
				where: eq(teamMembers.userId, userId),
			});

			if (
				!userTeam ||
				(userTeam.teamId !== draft.blueTeamId && userTeam.teamId !== draft.redTeamId)
			) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "You are not authorized to view this draft",
				});
			}

			return draft;
		}

		const draft = await db.query.scrimDrafts.findFirst({
			where: eq(scrimDrafts.id, input.draftId),
			with: {
				scrim: true,
				blueTeam: {
					with: {
						members: {
							with: {
								user: {
									with: {
										riotAccount: true,
									},
								},
							},
						},
					},
				},
				redTeam: {
					with: {
						members: {
							with: {
								user: {
									with: {
										riotAccount: true,
									},
								},
							},
						},
					},
				},
			},
		});

		if (!draft) {
			throw new TRPCError({
				code: "NOT_FOUND",
				message: "Draft not found",
			});
		}

		// Check if user is part of either team
		const userTeam = await db.query.teamMembers.findFirst({
			where: eq(teamMembers.userId, userId),
		});

		if (
			!userTeam ||
			(userTeam.teamId !== draft.blueTeamId && userTeam.teamId !== draft.redTeamId)
		) {
			throw new TRPCError({
				code: "FORBIDDEN",
				message: "You are not authorized to view this draft",
			});
		}

		// Cache the result for 30 seconds
		await redis?.setex(cacheKey, 30, JSON.stringify(draft));

		return draft;
	}),

	// Make a draft action (pick or ban)
	makeAction: authenticatedProcedure
		.input(DraftMakeActionSchema)
		.mutation(async ({ input, ctx }) => {
			const userId = ctx.session.user.id;

			return await db.transaction(async (tx) => {
				// Get the draft
				const draft = await tx.query.scrimDrafts.findFirst({
					where: eq(scrimDrafts.id, input.draftId),
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

				if (!draft) {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "Draft not found",
					});
				}

				// Check if draft is active
				if (draft.status !== "ACTIVE" && draft.status !== "PENDING") {
					throw new TRPCError({
						code: "BAD_REQUEST",
						message: "Draft is not active",
					});
				}

				// Check if draft has expired
				if (new Date() > draft.expiresAt) {
					// Update draft status to expired
					await tx
						.update(scrimDrafts)
						.set({ status: "EXPIRED" })
						.where(eq(scrimDrafts.id, input.draftId));

					throw new TRPCError({
						code: "BAD_REQUEST",
						message: "Draft has expired",
					});
				}

				// Determine which team the user belongs to
				const isBlueTeamMember = draft.blueTeam.members.some((m) => m.userId === userId);
				const isRedTeamMember = draft.redTeam.members.some((m) => m.userId === userId);

				if (!isBlueTeamMember && !isRedTeamMember) {
					throw new TRPCError({
						code: "FORBIDDEN",
						message: "You are not authorized to make actions in this draft",
					});
				}

				const userTeam = isBlueTeamMember ? "BLUE" : "RED";

				// Check if it's the user's team's turn
				const currentTeam = getTeamFromTurn(draft.currentTurn);
				if (userTeam !== currentTeam) {
					throw new TRPCError({
						code: "BAD_REQUEST",
						message: "It's not your team's turn",
					});
				}

				// Check if the action type matches the current turn
				const expectedAction = getActionFromTurn(draft.currentTurn);
				if (input.actionType !== expectedAction) {
					throw new TRPCError({
						code: "BAD_REQUEST",
						message: `Expected ${expectedAction} but received ${input.actionType}`,
					});
				}

				// Check if champion is already picked or banned
				const allPicks = [...draft.bluePicks, ...draft.redPicks];
				const allBans = [...draft.blueBans, ...draft.redBans];

				if (allPicks.includes(input.championId) || allBans.includes(input.championId)) {
					throw new TRPCError({
						code: "BAD_REQUEST",
						message: "Champion is already picked or banned",
					});
				}

				// Update the appropriate array based on team and action
				const updatedBluePicks = [...draft.bluePicks];
				const updatedRedPicks = [...draft.redPicks];
				const updatedBlueBans = [...draft.blueBans];
				const updatedRedBans = [...draft.redBans];

				if (input.actionType === "PICK") {
					if (userTeam === "BLUE") {
						updatedBluePicks.push(input.championId);
					} else {
						updatedRedPicks.push(input.championId);
					}
				} else {
					if (userTeam === "BLUE") {
						updatedBlueBans.push(input.championId);
					} else {
						updatedRedBans.push(input.championId);
					}
				}

				// Get the next turn
				const nextTurn = getNextTurn(draft.currentTurn) as typeof draft.currentTurn | null;
				const isComplete = nextTurn === null;

				// Update the draft
				const [updatedDraft] = await tx
					.update(scrimDrafts)
					.set({
						bluePicks: updatedBluePicks,
						redPicks: updatedRedPicks,
						blueBans: updatedBlueBans,
						redBans: updatedRedBans,
						currentTurn: nextTurn ?? draft.currentTurn,
						turnStartAt: isComplete ? null : new Date(),
						status: isComplete
							? "COMPLETED"
							: draft.status === "PENDING"
								? "ACTIVE"
								: draft.status,
					})
					.where(eq(scrimDrafts.id, input.draftId))
					.returning();

				// Clear cache
				await redis?.del(`draft:${input.draftId}`);

				// Broadcast the updated draft state to all clients in the draft room
				const draftRoom = `draft:${input.draftId}`;

				// TODO: Add back
				// io.to(draftRoom).emit("draft:update", {
				//     draftId: input.draftId,
				//     action: {
				//         type: input.actionType,
				//         championId: input.championId,
				//         team: userTeam,
				//     },
				//     state: {
				//         bluePicks: updatedBluePicks,
				//         redPicks: updatedRedPicks,
				//         blueBans: updatedBlueBans,
				//         redBans: updatedRedBans,
				//         currentTurn: nextTurn || draft.currentTurn,
				//         status: isComplete ? "COMPLETED" : (draft.status === "PENDING" ? "ACTIVE" : draft.status),
				//         turnStartAt: isComplete ? null : new Date(),
				//     },
				// });

				// If draft is complete, broadcast completion event and send notifications
				if (isComplete) {
					// TODO: Add back
					// io.to(draftRoom).emit("draft:completed", {
					//     draftId: input.draftId,
					//     finalState: {
					//         bluePicks: updatedBluePicks,
					//         redPicks: updatedRedPicks,
					//         blueBans: updatedBlueBans,
					//         redBans: updatedRedBans,
					//     },
					// });

					// Send completion notifications to all team members
					const allMembers = [...draft.blueTeam.members, ...draft.redTeam.members];

					const completionNotifications = allMembers.map((member) =>
						createNotification({
							userId: member.userId,
							type: "DRAFT_COMPLETED",
							title: "Draft Completed",
							message: "The champion select phase has been completed!",
							data: {
								draftId: input.draftId,
								scrimId: draft.scrimId,
							},
						}),
					);

					await Promise.all(completionNotifications);
				} else if (nextTurn) {
					// Send notification to the team whose turn it is next
					const nextTeam = getTeamFromTurn(nextTurn);
					const nextTeamMembers =
						nextTeam === "BLUE" ? draft.blueTeam.members : draft.redTeam.members;
					const nextAction = getActionFromTurn(nextTurn);

					const turnNotifications = nextTeamMembers.map((member) =>
						createNotification({
							userId: member.userId,
							type: "DRAFT_YOUR_TURN",
							title: "Your Turn",
							message: `It's your team's turn to ${nextAction.toLowerCase()} a champion!`,
							data: {
								draftId: input.draftId,
								scrimId: draft.scrimId,
							},
						}),
					);

					await Promise.all(turnNotifications);
				}

				return updatedDraft;
			});
		}),

	// Initialize draft for a scrim (internal use)
	initialize: authenticatedProcedure
		.input(DraftInitializeSchema)
		.mutation(async ({ input, ctx }) => {
			const userId = ctx.session.user.id;

			// Check if user is part of either team in the scrim
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

			if (scrim.status !== "CONFIRMED") {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Scrim must be confirmed to initialize draft",
				});
			}

			const isCreatingTeamMember = scrim.creatingTeam.members.some(
				(m) => m.userId === userId,
			);
			const isOpponentTeamMember = scrim.opponentTeam?.members.some(
				(m) => m.userId === userId,
			);

			if (!isCreatingTeamMember && !isOpponentTeamMember) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "You are not authorized to initialize this draft",
				});
			}

			return await initializeDraftForScrim(input.scrimId);
		}),

	// Join a draft room for real-time updates (Socket.IO room management)
	joinRoom: authenticatedProcedure.input(DraftByIdSchema).mutation(async ({ input, ctx }) => {
		const userId = ctx.session.user.id;

		// Verify user has access to this draft
		const draft = await db.query.scrimDrafts.findFirst({
			where: eq(scrimDrafts.id, input.draftId),
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

		if (!draft) {
			throw new TRPCError({
				code: "NOT_FOUND",
				message: "Draft not found",
			});
		}

		// Check if user is part of either team
		const isBlueTeamMember = draft.blueTeam.members.some((m) => m.userId === userId);
		const isRedTeamMember = draft.redTeam.members.some((m) => m.userId === userId);

		if (!isBlueTeamMember && !isRedTeamMember) {
			throw new TRPCError({
				code: "FORBIDDEN",
				message: "You are not authorized to join this draft room",
			});
		}

		// In a real Socket.IO implementation, this would join the user to the room
		// For now, we'll just return success
		return { success: true, draftId: input.draftId };
	}),
});
