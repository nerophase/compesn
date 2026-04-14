import { createTRPCRouter, authenticatedProcedure, baseProcedure } from "@/trpc/init";
import {
	ScrimCreateSchema,
	ScrimByIdSchema,
	ScrimRequestSchema,
	ScrimCancelSchema,
	ScrimCancelRequestSchema,
	ScrimListByTeamIdSchema,
	ScrimCompleteSchema,
	ScrimListByUserIdSchema,
	ScrimListingsSchema,
	ScrimQueueSchema,
	RegionSchema,
	getRankTierValue,
	getRankDivisionValue,
} from "@/trpc/routers/scrims/scrims.schema";
import { db } from "@/lib/database/db";
import { and, eq, gte, lte, or, sql, desc, asc, inArray, exists, ilike, count } from "drizzle-orm";
import {
	scrims,
	scrimParticipants,
	teams,
	teamMembers,
	TScrimInsert,
	TScrimParticipantInsert,
	TScrim,
} from "@compesn/shared/schemas";
import { TRPCError } from "@trpc/server";
import { logError } from "@compesn/shared/logging";
import { createNotification } from "@/lib/notifications";
import { redis as redis } from "@/lib/database/redis";
import { initializeDraftForScrim } from "@/trpc/routers/drafts";
import { assertValidRankRange } from "./scrim-utils";
import {
	canCancelConfirmedScrim,
	getNextOpponentTeamId,
	isCreatingTeamOnlyTransition,
	isValidScrimTransition,
} from "./scrim-status";
import { updateStatusProcedure } from "./update-scrim-status-procedure";
import { listScrimsProcedure } from "./list-scrims-procedure";
import { z } from "zod";

export const scrimsRouter = createTRPCRouter({
	// Create a new scrim
	create: authenticatedProcedure.input(ScrimCreateSchema).mutation(async ({ input, ctx }) => {
		try {
			const userId = ctx.session.user.id;

			// Check if user is part of a team
			const userTeam = await db.query.teamMembers.findFirst({
				where: eq(teamMembers.userId, userId),
				with: {
					team: true,
				},
			});

			if (!userTeam) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "You must be part of a team to create scrims",
				});
			}

			assertValidRankRange(input);

			// Check for double-booking
			const overlappingScrim = await db.query.scrims.findFirst({
				where: and(
					or(
						eq(scrims.creatingTeamId, userTeam.teamId),
						eq(scrims.opponentTeamId, userTeam.teamId),
					),
					eq(scrims.status, "CONFIRMED"),
					// Check for time overlap
					and(
						lte(
							scrims.startTime,
							new Date(input.startTime.getTime() + input.durationMinutes * 60000),
						),
						gte(
							sql`${scrims.startTime} + INTERVAL '1 minute' * ${scrims.durationMinutes}`,
							input.startTime.toISOString(),
						),
					),
				),
			});

			if (overlappingScrim) {
				throw new TRPCError({
					code: "CONFLICT",
					message: "Your team already has a confirmed scrim during this time period",
				});
			}

			// Create the scrim
			const newScrim: TScrimInsert = {
				creatingTeamId: userTeam.teamId,
				startTime: input.startTime,
				durationMinutes: input.durationMinutes,
				bestOf: input.bestOf,
				minRankTier: input.minRankTier,
				minRankDivision: input.minRankDivision,
				maxRankTier: input.maxRankTier,
				maxRankDivision: input.maxRankDivision,
				notes: input.notes,
				commsLink: input.commsLink,
				rolesNeeded: input.rolesNeeded,
			};

			const [createdScrim] = await db.insert(scrims).values(newScrim).returning();

			// Clear the scrims list cache
			if (redis) {
				await redis.del("scrims:list:*");
			}

			return createdScrim;
		} catch (error) {
			logError("frontend.scrims.create", error, { userId: ctx.session.user.id });
			throw new TRPCError({
				code: "INTERNAL_SERVER_ERROR",
				message: "Failed to create scrim",
			});
		}
	}),

	// List scrims with filtering
	list: listScrimsProcedure,

	// Get scrim by ID
	getById: baseProcedure.input(ScrimByIdSchema).query(async ({ input }) => {
		const scrim = await db.query.scrims.findFirst({
			where: eq(scrims.id, input.scrimId),
			with: {
				creatingTeam: {
					with: {
						members: {
							with: {
								user: true,
							},
						},
					},
				},
				opponentTeam: {
					with: {
						members: {
							with: {
								user: true,
							},
						},
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

		return scrim;
	}),

	// Request to join an open scrim
	request: authenticatedProcedure.input(ScrimRequestSchema).mutation(async ({ input, ctx }) => {
		try {
			const userId = ctx.session.user.id;

			// Check if user is part of the selected team
			const userTeam = await db.query.teamMembers.findFirst({
				where: and(eq(teamMembers.userId, userId), eq(teamMembers.teamId, input.teamId)),
				with: {
					team: true,
				},
			});

			if (!userTeam) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "You must be a member of the selected team to request scrims",
				});
			}

			// Get the scrim
			const scrim = await db.query.scrims.findFirst({
				where: eq(scrims.id, input.scrimId),
				with: {
					creatingTeam: true,
				},
			});

			if (!scrim) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Scrim not found",
				});
			}

			// Check if scrim is open
			if (scrim.status !== "OPEN") {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "This scrim is no longer open for requests",
				});
			}

			// Check if it's not the same team
			if (scrim.creatingTeamId === userTeam.teamId) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "You cannot request your own scrim",
				});
			}

			// Check for double-booking
			const overlappingScrim = await db.query.scrims.findFirst({
				where: and(
					or(
						eq(scrims.creatingTeamId, userTeam.teamId),
						eq(scrims.opponentTeamId, userTeam.teamId),
					),
					eq(scrims.status, "CONFIRMED"),
					// Check for time overlap
					and(
						lte(
							scrims.startTime,
							new Date(scrim.startTime.getTime() + scrim.durationMinutes * 60000),
						),
						gte(
							sql`${scrims.startTime} + INTERVAL '1 minute' * ${scrims.durationMinutes}`,
							scrim.startTime.toISOString(),
						),
					),
				),
			});

			if (overlappingScrim) {
				throw new TRPCError({
					code: "CONFLICT",
					message: "Your team already has a confirmed scrim during this time period",
				});
			}

			// Update scrim status and set opponent team
			const [updatedScrim] = await db
				.update(scrims)
				.set({
					status: "REQUESTED",
					opponentTeamId: userTeam.teamId,
				})
				.where(eq(scrims.id, input.scrimId))
				.returning();

			// Create notification for the creating team
			await createNotification({
				userId: scrim.creatingTeam.ownerId,
				type: "SCRIM_REQUEST",
				title: "New Scrim Request",
				message: `${userTeam.team.name} has requested to scrim with your team`,
				data: { scrimId: input.scrimId, teamId: userTeam.team.id },
			});

			// Clear cache
			if (redis) {
				await redis.del("scrims:list:*");
			}

			return updatedScrim;
		} catch (error) {
			logError("frontend.scrims.request", error, { userId: ctx.session.user.id });
			throw new TRPCError({
				code: "INTERNAL_SERVER_ERROR",
				message: "Failed to request scrim",
			});
		}
	}),

	// Cancel a pending scrim request (by requesting team)
	cancelRequest: authenticatedProcedure
		.input(ScrimCancelRequestSchema)
		.mutation(async ({ input, ctx }) => {
			const userId = ctx.session.user.id;

			const scrim = await db.query.scrims.findFirst({
				where: eq(scrims.id, input.scrimId),
				with: {
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

			if (scrim.status !== "REQUESTED" || !scrim.opponentTeamId) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Only pending scrim requests can be cancelled",
				});
			}

			const isRequestingTeamMember =
				scrim.opponentTeam?.members.some((member) => member.userId === userId) ?? false;

			if (!isRequestingTeamMember) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "Only the requesting team can cancel this request",
				});
			}

			const [updatedScrim] = await db
				.update(scrims)
				.set({
					status: "OPEN",
					opponentTeamId: null,
				})
				.where(eq(scrims.id, input.scrimId))
				.returning();

			if (redis) {
				await redis.del("scrims:list:*");
			}

			return updatedScrim;
		}),

	// Update scrim status (accept, confirm, cancel)
	updateStatus: updateStatusProcedure,

	// Cancel a scrim with reason
	cancel: authenticatedProcedure
		.input(ScrimCancelSchema)
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

			const isCreatingTeamMember = scrim.creatingTeam.members.some(
				(member) => member.userId === userId,
			);
			const isOpponentTeamMember =
				scrim.opponentTeam?.members.some((member) => member.userId === userId) ?? false;

			if (!isCreatingTeamMember && !isOpponentTeamMember) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "You are not authorized to cancel this scrim",
				});
			}

			if (!isValidScrimTransition(scrim.status, "CANCELLED")) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: `Cannot transition from ${scrim.status} to CANCELLED`,
				});
			}

			if (
				scrim.status === "CONFIRMED" &&
				!canCancelConfirmedScrim(scrim.startTime)
			) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Cannot cancel a confirmed scrim within 2 hours of start time",
				});
			}

			const [updatedScrim] = await db
				.update(scrims)
				.set({
					status: "CANCELLED",
					opponentTeamId: getNextOpponentTeamId("CANCELLED", scrim.opponentTeamId),
				})
				.where(eq(scrims.id, input.scrimId))
				.returning();

			if (redis) {
				await redis.del("scrims:list:*");
			}

			return updatedScrim;
		}),

	// Get scrims by team ID
	listByTeamId: authenticatedProcedure.input(ScrimListByTeamIdSchema).query(async ({ input }) => {
		// Create cache key based on input parameters
		const cacheKey = `scrims:team:${input.teamId}:${JSON.stringify({
			limit: input.limit,
			offset: input.offset,
		})}`;

		// Try to get from cache first
		const cached = redis ? await redis.get(cacheKey) : null;
		if (cached) {
			return JSON.parse(cached) as TScrim[];
		}

		const result = await db.query.scrims.findMany({
			where: or(
				eq(scrims.creatingTeamId, input.teamId),
				eq(scrims.opponentTeamId, input.teamId),
			),
			with: {
				creatingTeam: {
					with: {
						members: {
							with: {
								user: true,
							},
						},
					},
				},
				opponentTeam: {
					with: {
						members: {
							with: {
								user: true,
							},
						},
					},
				},
			},
			orderBy: [desc(scrims.startTime)],
			limit: input.limit,
			offset: input.offset,
		});

		// Cache the result for 2 minutes
		if (redis) {
			await redis.setex(cacheKey, 120, JSON.stringify(result));
		}

		return result;
	}),

	// Complete a scrim with match results
	complete: authenticatedProcedure.input(ScrimCompleteSchema).mutation(async ({ input, ctx }) => {
		const userId = ctx.session.user.id;

		return await db.transaction(async (tx) => {
			// Get the scrim with team information
			const scrim = await tx.query.scrims.findFirst({
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

			// Check if scrim is in CONFIRMED status
			if (scrim.status !== "CONFIRMED") {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Only confirmed scrims can be completed",
				});
			}

			// Check if user is part of either team
			const isCreatingTeamMember = scrim.creatingTeam.members.some(
				(m) => m.userId === userId,
			);
			const isOpponentTeamMember = scrim.opponentTeam?.members.some(
				(m) => m.userId === userId,
			);

			if (!isCreatingTeamMember && !isOpponentTeamMember) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "You are not authorized to complete this scrim",
				});
			}

			// Validate that winning team is one of the participating teams
			if (
				input.winningTeamId !== scrim.creatingTeamId &&
				input.winningTeamId !== scrim.opponentTeamId
			) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Winning team must be one of the participating teams",
				});
			}

			// Validate participants belong to the correct teams
			const validTeamIds = [scrim.creatingTeamId, scrim.opponentTeamId].filter(Boolean);
			for (const participant of input.participants) {
				if (!validTeamIds.includes(participant.teamId)) {
					throw new TRPCError({
						code: "BAD_REQUEST",
						message: "All participants must belong to one of the participating teams",
					});
				}
			}

			// Update scrim with completion data
			const [updatedScrim] = await tx
				.update(scrims)
				.set({
					status: "COMPLETED",
					winningTeamId: input.winningTeamId,
					matchDurationSeconds: input.matchDurationSeconds,
					completedAt: new Date(),
				})
				.where(eq(scrims.id, input.scrimId))
				.returning();

			// Insert participant data
			const participantInserts: TScrimParticipantInsert[] = input.participants.map((p) => ({
				scrimId: input.scrimId,
				userId: p.userId,
				teamId: p.teamId,
				championId: p.championId,
				role: p.role,
				kills: p.kills,
				deaths: p.deaths,
				assists: p.assists,
				totalCreepScore: p.totalCreepScore,
				goldEarned: p.goldEarned,
				visionScore: p.visionScore,
				csAt10Minutes: p.csAt10Minutes,
				totalDamageDealtToChampions: p.totalDamageDealtToChampions,
				totalDamageTaken: p.totalDamageTaken,
			}));

			await tx.insert(scrimParticipants).values(participantInserts);

			// Clear cache
			if (redis) {
				await redis.del("scrims:list:*");
				await redis.del(`scrims:team:*`);
				await redis.del(`scrims:user:*`);
			}

			return updatedScrim;
		});
	}),

	// Get scrims by user ID (for personal stats)
	listByUserId: authenticatedProcedure.input(ScrimListByUserIdSchema).query(async ({ input }) => {
		// Create cache key based on input parameters
		const cacheKey = `scrims:user:${input.userId}:${JSON.stringify({
			limit: input.limit,
			offset: input.offset,
		})}`;

		// Try to get from cache first
		const cached = redis ? await redis.get(cacheKey) : null;
		if (cached) {
			return JSON.parse(cached);
		}

		// Get scrims where user participated
		const result = await db.query.scrimParticipants.findMany({
			where: eq(scrimParticipants.userId, input.userId),
			with: {
				scrim: {
					with: {
						creatingTeam: true,
						opponentTeam: true,
						winningTeam: true,
					},
				},
				team: true,
				user: true,
			},
			orderBy: [desc(scrimParticipants.createdAt)],
			limit: input.limit,
			offset: input.offset,
		});

		// Transform the data to include scrim details and user's performance
		const transformedResult = result.map((participation) => ({
			scrimId: participation.scrim.id,
			scrim: participation.scrim,
			userPerformance: {
				championId: participation.championId,
				role: participation.role,
				kills: participation.kills,
				deaths: participation.deaths,
				assists: participation.assists,
				totalCreepScore: participation.totalCreepScore,
				goldEarned: participation.goldEarned,
				visionScore: participation.visionScore,
				csAt10Minutes: participation.csAt10Minutes,
				totalDamageDealtToChampions: participation.totalDamageDealtToChampions,
				totalDamageTaken: participation.totalDamageTaken,
				kda:
					participation.deaths > 0
						? (participation.kills + participation.assists) / participation.deaths
						: participation.kills + participation.assists,
			},
			team: participation.team,
			won: participation.scrim.winningTeamId === participation.teamId,
		}));

		// Cache the result for 2 minutes
		if (redis) {
			await redis.setex(cacheKey, 120, JSON.stringify(transformedResult));
		}

		return transformedResult;
	}),

	// ===== NEW SCRIMS HUB AND QUEUE API =====

	// Get scrim listings for Scrims Hub page
	getScrimListings: authenticatedProcedure.input(ScrimListingsSchema).query(async ({ input }) => {
		// Create cache key based on input parameters
		const cacheKey = `scrims:listings:${JSON.stringify(input)}`;

		// Try to get from cache first (2 minutes TTL)
		const cached = redis ? await redis.get(cacheKey) : null;
		if (cached) {
			return JSON.parse(cached) as typeof result;
		}

		// Build where conditions
		const conditions = [];

		// Date range filters
		if (input.startDate) {
			conditions.push(gte(scrims.startTime, input.startDate));
		}
		if (input.endDate) {
			conditions.push(lte(scrims.startTime, input.endDate));
		}

		// Rank filters
		if (input.minRankTier) {
			const minTierValue = getRankTierValue(input.minRankTier);
			conditions.push(
				or(
					sql`${scrims.minRankTier} IS NULL`,
					sql`${getRankTierValue}(${scrims.minRankTier}) <= ${minTierValue}`,
				),
			);
		}
		if (input.maxRankTier) {
			const maxTierValue = getRankTierValue(input.maxRankTier);
			conditions.push(
				or(
					sql`${scrims.maxRankTier} IS NULL`,
					sql`${getRankTierValue}(${scrims.maxRankTier}) >= ${maxTierValue}`,
				),
			);
		}

		// Region filters (assuming teams have region field)
		if (input.regions && input.regions.length > 0) {
			conditions.push(
				sql`EXISTS (
                        SELECT 1 FROM ${teams} 
                        WHERE ${teams.id} = ${scrims.creatingTeamId} 
                        AND ${teams.region} = ANY(${input.regions})
                    )`,
			);
		}

		// Status filter
		if (input.status && input.status.length > 0) {
			conditions.push(inArray(scrims.status, input.status));
		}

		// Only show future scrims
		conditions.push(gte(scrims.startTime, new Date()));

		const result = await db.query.scrims.findMany({
			where: conditions.length > 0 ? and(...conditions) : undefined,
			with: {
				creatingTeam: {
					with: {
						members: {
							with: {
								user: true,
							},
						},
					},
				},
			},
			orderBy: [asc(scrims.startTime)],
			limit: input.limit,
			offset: input.offset,
		});

		// Cache the result for 2 minutes
		if (redis) {
			await redis.setex(cacheKey, 120, JSON.stringify(result));
		}

		return result;
	}),

	// Get live scrim queue for teams actively looking for scrims
	getQueue: authenticatedProcedure.input(ScrimQueueSchema).query(async ({ input }) => {
		type QueueRegion = z.infer<typeof RegionSchema>;

		// Create cache key based on input parameters
		const cacheKey = `scrims:queue:${JSON.stringify(input)}`;

		// Try to get from cache first (30 seconds TTL for live data)
		const cached = redis ? await redis.get(cacheKey) : null;
		if (cached) {
			return JSON.parse(cached);
		}

		// Mock data for now - in a real implementation, this would be teams actively looking for scrims
		// This could be based on recent scrim creation, "looking for scrim" status, etc.
		const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

		// Get teams that have created scrims in the last hour with status "OPEN"
		const recentOpenScrims = await db.query.scrims.findMany({
			where: and(eq(scrims.status, "OPEN"), gte(scrims.createdAt, oneHourAgo)),
			with: {
				creatingTeam: {
					with: {
						members: {
							with: {
								user: true,
							},
						},
					},
				},
			},
			orderBy: [desc(scrims.createdAt)],
			limit: input.limit,
		});

		// Transform to queue format
		const queueTeams: Array<{
			id: string;
			name: string;
			tag: string;
			currentRank: string;
			region: QueueRegion;
			memberCount: number;
			lookingSince: Date;
			preferredGameModes: string[];
			scrimId: string;
		}> = recentOpenScrims.map((scrim) => ({
			id: scrim.creatingTeam.id,
			name: scrim.creatingTeam.name,
			tag: scrim.creatingTeam.tag,
			currentRank: "UNRANKED", // Default rank since team doesn't have currentRank field
			region: (scrim.creatingTeam.region || "na") as QueueRegion,
			memberCount: scrim.creatingTeam.members?.length || 0,
			lookingSince: scrim.createdAt,
			preferredGameModes: scrim.bestOf ? [`Best of ${scrim.bestOf}`] : ["Custom"],
			scrimId: scrim.id, // Include scrim ID for quick matching
		}));

		// Apply filters
		let filteredTeams = queueTeams;

		if (input.minRankTier || input.maxRankTier) {
			filteredTeams = filteredTeams.filter((team) => {
				const teamRankValue = getRankTierValue(team.currentRank);

				if (input.minRankTier) {
					const minValue = getRankTierValue(input.minRankTier);
					if (teamRankValue < minValue) return false;
				}

				if (input.maxRankTier) {
					const maxValue = getRankTierValue(input.maxRankTier);
					if (teamRankValue > maxValue) return false;
				}

				return true;
			});
		}

		if (input.regions && input.regions.length > 0) {
			const regions = input.regions;
			filteredTeams = filteredTeams.filter((team) => regions.includes(team.region));
		}

		// Cache the result for 30 seconds
		if (redis) {
			await redis.setex(cacheKey, 30, JSON.stringify(filteredTeams));
		}

		return filteredTeams;
	}),
});
