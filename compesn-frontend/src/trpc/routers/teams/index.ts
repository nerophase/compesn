import { createTRPCRouter, baseProcedure, authenticatedProcedure } from "../../init";
import {
	TeamByIdSchema,
	TeamCreateSchema,
	TeamUpdateSchema,
	TeamTransferOwnershipSchema,
	TeamDeleteSchema,
	TeamListSchema,
	TeamDirectorySchema,
	TeamScrimHistorySchema,
	TeamUpcomingScrimsSchema,
	TeamAvailabilitySchema,
	InvitePlayerSchema,
	RespondToInviteSchema,
	RemovePlayerSchema,
	RescindInviteSchema,
	TeamRegisterSchema,
	TeamLeaveSchema,
	TeamKickPlayerSchema,
	TeamAddPlayerSchema,
	TeamConfirmJoinSchema,
	TeamCancelInvitationSchema,
} from "./teams.schema";
import { db } from "../../../lib/database/db";
import { and, eq, asc, count, or, sql, ilike, getTableColumns } from "drizzle-orm";
import { redis } from "../../../lib/database/redis";
import {
	teams,
	teamMembers,
	users,
	usersToTeams,
	TTeamInsert,
	teamInvites,
} from "@compesn/shared/common/schemas";
import { sendEmail } from "../../../lib/resend";
import { createNotification } from "../../../lib/notifications";
import { TRPCError } from "@trpc/server";
import { syncConversationsForTeam } from "@/lib/messaging";

export const teamsRouter = createTRPCRouter({
	// ===== NEW TEAM MANAGEMENT API =====

	// Create a new team
	create: authenticatedProcedure.input(TeamCreateSchema).mutation(async ({ input, ctx }) => {
		// 0) Ensure the session user exists in our users table
		const owner = await db.query.users.findFirst({
			where: eq(users.id, ctx.user.id),
		});
		if (!owner) {
			throw new TRPCError({
				code: "UNAUTHORIZED",
				message:
					"Your account is not initialized in the database. Please sign out and sign back in, or complete onboarding.",
			});
		}

		// 1) Check if team name or tag already exists
		const existingTeam = await db.query.teams.findFirst({
			where: or(eq(teams.name, input.name), eq(teams.tag, input.tag)),
		});
		if (existingTeam) {
			throw new TRPCError({
				code: "CONFLICT",
				message: "Team name or tag already exists",
			});
		}

		// 2) Create the team
		const [team] = await db
			.insert(teams)
			.values({
				name: input.name,
				tag: input.tag,
				region: input.region,
				currentRank: input.currentRank,
				activityLevel: input.activityLevel,
				ownerId: ctx.user.id,
			})
			.returning();

		// 3) Add the creator as a team member
		await db.insert(teamMembers).values({
			teamId: team.id,
			userId: ctx.user.id,
			role: "COACH",
		});
		await syncConversationsForTeam(team.id);

		return team;
	}),

	// Update team information
	update: authenticatedProcedure.input(TeamUpdateSchema).mutation(async ({ input, ctx }) => {
		// Verify ownership
		const team = await db.query.teams.findFirst({
			where: eq(teams.id, input.teamId),
		});

		if (!team || team.ownerId !== ctx.user.id) {
			throw new TRPCError({
				code: "FORBIDDEN",
				message: "Only team owners can update team information",
			});
		}

		// Check for conflicts if updating name or tag
		if (input.name || input.tag) {
			const conflictConditions = [];
			if (input.name) conflictConditions.push(eq(teams.name, input.name));
			if (input.tag) conflictConditions.push(eq(teams.tag, input.tag));

			const existingTeam = await db.query.teams.findFirst({
				where: and(or(...conflictConditions), sql`${teams.id} != ${input.teamId}`),
			});

			if (existingTeam) {
				throw new TRPCError({
					code: "CONFLICT",
					message: "Team name or tag already exists",
				});
			}
		}

		// Update the team
		const updateData: Partial<TTeamInsert> = {};
		if (input.name) updateData.name = input.name;
		if (input.tag) updateData.tag = input.tag;
		if (input.region) updateData.region = input.region;
		if (input.activityLevel) updateData.activityLevel = input.activityLevel;
		if (input.currentRank) updateData.currentRank = input.currentRank;

		const [updatedTeam] = await db
			.update(teams)
			.set(updateData)
			.where(eq(teams.id, input.teamId))
			.returning();

		return updatedTeam;
	}),

	// Transfer team ownership
	transferOwnership: authenticatedProcedure
		.input(TeamTransferOwnershipSchema)
		.mutation(async ({ input, ctx }) => {
			// Verify current ownership
			const team = await db.query.teams.findFirst({
				where: eq(teams.id, input.teamId),
			});

			if (!team || team.ownerId !== ctx.user.id) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "Only team owners can transfer ownership",
				});
			}

			// Verify the new owner is a team member
			const newOwnerMembership = await db.query.teamMembers.findFirst({
				where: and(
					eq(teamMembers.teamId, input.teamId),
					eq(teamMembers.userId, input.newOwnerId),
				),
			});

			if (!newOwnerMembership) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "New owner must be a team member",
				});
			}

			// Transfer ownership
			const [updatedTeam] = await db
				.update(teams)
				.set({ ownerId: input.newOwnerId })
				.where(eq(teams.id, input.teamId))
				.returning();

			return updatedTeam;
		}),

	// Delete team
	delete: authenticatedProcedure.input(TeamDeleteSchema).mutation(async ({ input, ctx }) => {
		// Verify ownership
		const team = await db.query.teams.findFirst({
			where: eq(teams.id, input.teamId),
		});

		if (!team || team.ownerId !== ctx.user.id) {
			throw new TRPCError({
				code: "FORBIDDEN",
				message: "Only team owners can delete teams",
			});
		}

		// Delete the team (cascades to members and invites)
		await db.delete(teams).where(eq(teams.id, input.teamId));

		return { success: true };
	}),

	// ===== ROSTER MANAGEMENT API =====

	// Invite a player to the team
	invitePlayer: authenticatedProcedure
		.input(InvitePlayerSchema)
		.mutation(async ({ input, ctx }) => {
			// Verify ownership
			const team = await db.query.teams.findFirst({
				where: eq(teams.id, input.teamId),
			});

			if (!team || team.ownerId !== ctx.user.id) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "Only team owners can invite players",
				});
			}

			// Check if user exists and has a linked Riot account
			const targetUser = await db.query.users.findFirst({
				where: eq(users.id, input.userId),
				with: { riotAccount: true },
			});

			if (!targetUser) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "User not found",
				});
			}

			if (!targetUser.puuid) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "User must have a linked Riot account to be invited",
				});
			}

			// Check if user is already a member
			const existingMember = await db.query.teamMembers.findFirst({
				where: and(
					eq(teamMembers.teamId, input.teamId),
					eq(teamMembers.userId, input.userId),
				),
			});

			if (existingMember) {
				throw new TRPCError({
					code: "CONFLICT",
					message: "User is already a team member",
				});
			}

			// Check for an existing invite so declined/expired invites can be reopened.
			const existingInvite = await db.query.teamInvites.findFirst({
				where: and(
					eq(teamInvites.teamId, input.teamId),
					eq(teamInvites.invitedUserId, input.userId),
				),
			});

			if (existingInvite?.status === "PENDING") {
				throw new TRPCError({
					code: "CONFLICT",
					message: "User already has a pending invite",
				});
			}

			// Check roster size (max 10 including pending invites)
			const [memberCount] = await db
				.select({ count: count() })
				.from(teamMembers)
				.where(eq(teamMembers.teamId, input.teamId));

			const [pendingInviteCount] = await db
				.select({ count: count() })
				.from(teamInvites)
				.where(
					and(eq(teamInvites.teamId, input.teamId), eq(teamInvites.status, "PENDING")),
				);

			if (memberCount.count + pendingInviteCount.count >= 10) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Team roster is at maximum capacity (10 members)",
				});
			}

			// Check role constraint for main roles
			if (["TOP", "JUNGLE", "MID", "BOT", "SUPPORT"].includes(input.role)) {
				const existingRoleMember = await db.query.teamMembers.findFirst({
					where: and(
						eq(teamMembers.teamId, input.teamId),
						eq(teamMembers.role, input.role),
					),
				});

				if (existingRoleMember) {
					throw new TRPCError({
						code: "CONFLICT",
						message: `Role ${input.role} is already filled`,
					});
				}
			}

			// Create a fresh invite or reopen a previous non-pending invite.
			const [invite] = existingInvite
				? await db
						.update(teamInvites)
						.set({
							inviterId: ctx.user.id,
							role: input.role,
							status: "PENDING",
							expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
							updatedAt: new Date(),
						})
						.where(eq(teamInvites.id, existingInvite.id))
						.returning()
				: await db
						.insert(teamInvites)
						.values({
							teamId: input.teamId,
							inviterId: ctx.user.id,
							invitedUserId: input.userId,
							role: input.role,
						})
						.returning();

			// Send notification
			await createNotification(input.userId, "TEAM_INVITATION", {
				teamId: team.id,
				teamName: team.name,
				inviteId: invite.id,
			});

			// Send email if user has email
			if (targetUser.email) {
				await sendEmail(
					targetUser.email,
					`Team Invitation: ${team.name}`,
					`You've been invited to join ${team.name} [${team.tag}] as ${input.role}. Check your notifications to respond.`,
				);
			}

			await redis?.del(`team:profile:${input.teamId}`);

			return invite;
		}),

	// Respond to a team invite
	respondToInvite: authenticatedProcedure
		.input(RespondToInviteSchema)
		.mutation(async ({ input, ctx }) => {
			// Find the invite
			const invite = await db.query.teamInvites.findFirst({
				where: and(
					eq(teamInvites.id, input.inviteId),
					eq(teamInvites.invitedUserId, ctx.user.id),
					eq(teamInvites.status, "PENDING"),
				),
				with: { team: true },
			});

			if (!invite) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Invite not found or already processed",
				});
			}

			// Check if invite is expired
			if (invite.expiresAt < new Date()) {
				await db
					.update(teamInvites)
					.set({ status: "EXPIRED" })
					.where(eq(teamInvites.id, input.inviteId));

				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Invite has expired",
				});
			}

			if (input.response === "ACCEPT") {
				// Check role constraint again (in case someone else took the role)
				if (["TOP", "JUNGLE", "MID", "BOT", "SUPPORT"].includes(invite.role)) {
					const existingRoleMember = await db.query.teamMembers.findFirst({
						where: and(
							eq(teamMembers.teamId, invite.teamId),
							eq(teamMembers.role, invite.role),
						),
					});

					if (existingRoleMember) {
						throw new TRPCError({
							code: "CONFLICT",
							message: `Role ${invite.role} is no longer available`,
						});
					}
				}

				// Add user to team
				await db.insert(teamMembers).values({
					teamId: invite.teamId,
					userId: ctx.user.id,
					role: invite.role,
				});

				// Update invite status
				await db
					.update(teamInvites)
					.set({ status: "ACCEPTED" })
					.where(eq(teamInvites.id, input.inviteId));
				await redis?.del(`team:profile:${invite.teamId}`);
				await syncConversationsForTeam(invite.teamId);

				return { success: true, team: invite.team };
			} else {
				// Decline invite
				await db
					.update(teamInvites)
					.set({ status: "DECLINED" })
					.where(eq(teamInvites.id, input.inviteId));
				await redis?.del(`team:profile:${invite.teamId}`);

				return { success: true };
			}
		}),

	// Remove a player from the team
	removePlayer: authenticatedProcedure
		.input(RemovePlayerSchema)
		.mutation(async ({ input, ctx }) => {
			// Verify ownership
			const team = await db.query.teams.findFirst({
				where: eq(teams.id, input.teamId),
			});

			if (!team || team.ownerId !== ctx.user.id) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "Only team owners can remove players",
				});
			}

			// Prevent owner from removing themselves
			if (input.userId === ctx.user.id) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Team owners cannot remove themselves. Transfer ownership first.",
				});
			}

			// Remove the member
			const deletedMember = await db
				.delete(teamMembers)
				.where(
					and(eq(teamMembers.teamId, input.teamId), eq(teamMembers.userId, input.userId)),
				)
				.returning();

			if (deletedMember.length === 0) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "User is not a team member",
				});
			}

			await syncConversationsForTeam(input.teamId);

			return { success: true };
		}),

	// Rescind an invite
	rescindInvite: authenticatedProcedure
		.input(RescindInviteSchema)
		.mutation(async ({ input, ctx }) => {
			// Find the invite and verify ownership
			const invite = await db.query.teamInvites.findFirst({
				where: eq(teamInvites.id, input.inviteId),
				with: { team: true },
			});

			if (!invite) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Invite not found",
				});
			}

			if (invite.team.ownerId !== ctx.user.id) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "Only team owners can rescind invites",
				});
			}

			// Delete the invite
			await db.delete(teamInvites).where(eq(teamInvites.id, input.inviteId));
			await redis?.del(`team:profile:${invite.teamId}`);

			return { success: true };
		}),

	// ===== QUERY ENDPOINTS =====

	// Get team by ID with full details
	byId: baseProcedure.input(TeamByIdSchema).query(async ({ input }) => {
		return await db.query.teams.findFirst({
			where: eq(teams.id, input.teamId),
			with: {
				owner: true,
				members: {
					with: { user: true },
					orderBy: asc(teamMembers.joinedAt),
				},
				invites: {
					where: eq(teamInvites.status, "PENDING"),
					with: { invitedUser: true },
				},
			},
		});
	}),

	// Get user's teams
	userTeams: authenticatedProcedure.query(async ({ ctx }) => {
		if (!ctx.user.id) return [];

		return await db.query.teamMembers.findMany({
			where: eq(teamMembers.userId, ctx.user.id),
			with: {
				team: {
					with: {
						owner: true,
						members: {
							with: { user: true },
						},
					},
				},
			},
		});
	}),

	userTeamsFlat: authenticatedProcedure.query(async ({ ctx }) => {
		if (!ctx.user.id) return [];

		return await db
			.select(getTableColumns(teams))
			.from(teams)
			.innerJoin(teamMembers, eq(teams.id, teamMembers.teamId))
			.where(eq(teamMembers.userId, ctx.user.id));
	}),

	// Get user's pending invites
	userInvites: authenticatedProcedure.query(async ({ ctx }) => {
		return await db.query.teamInvites.findMany({
			where: and(
				eq(teamInvites.invitedUserId, ctx.user.id),
				eq(teamInvites.status, "PENDING"),
			),
			with: {
				team: true,
				inviter: true,
			},
		});
	}),

	// List all teams (public) - legacy
	listAll: baseProcedure.query(async () => {
		return await db.query.teams.findMany({
			with: {
				owner: true,
				members: {
					with: { user: true },
				},
			},
			orderBy: asc(teams.name),
		});
	}),

	// List teams with filtering and pagination
	listFiltered: baseProcedure.input(TeamListSchema).query(async ({ input }) => {
		// Create cache key based on input parameters
		const cacheKey = `teams:list:${JSON.stringify(input)}`;

		// Try to get from cache first
		const cached = await redis?.get(cacheKey);
		if (cached) {
			return JSON.parse(cached);
		}

		// Build where conditions
		const conditions = [];

		// Search filter
		if (input.search) {
			conditions.push(
				or(ilike(teams.name, `%${input.search}%`), ilike(teams.tag, `%${input.search}%`)),
			);
		}

		// Region filter (if teams have region field)
		// if (input.region) {
		//     conditions.push(eq(teams.region, input.region));
		// }

		const result = await db.query.teams.findMany({
			where: conditions.length > 0 ? and(...conditions) : undefined,
			with: {
				owner: true,
				members: {
					with: { user: true },
					orderBy: asc(teamMembers.joinedAt),
				},
			},
			orderBy: asc(teams.name),
			limit: input.limit,
			offset: input.offset,
		});

		// Cache the result for 5 minutes
		await redis?.setex(cacheKey, 300, JSON.stringify(result));

		return result;
	}),

	// ===== NEW TEAMS DIRECTORY API =====

	// Enhanced teams directory with advanced filtering and pagination
	list: baseProcedure.input(TeamDirectorySchema).query(async ({ input, ctx }) => {
		const userId = ctx.session?.user?.id;

		// Create cache key based on input parameters
		const cacheKey = `teams:directory:${JSON.stringify(input)}`;

		// Only cache anonymous directory views. Logged-in results are user-specific.
		if (!userId) {
			const cached = await redis?.get(cacheKey);
			if (cached) {
				return JSON.parse(cached) as typeof result;
			}
		}

		// Build where conditions
		const conditions = [];

		// Name search filter
		if (input.name) {
			conditions.push(ilike(teams.name, `%${input.name}%`));
		}

		// Rank filters (assuming teams have a currentRank field)
		if (input.ranks && input.ranks.length > 0) {
			conditions.push(or(...input.ranks.map((rank) => eq(teams.currentRank, rank))));
		}

		// Region filters (assuming teams have a region field)
		if (input.regions && input.regions.length > 0) {
			conditions.push(or(...input.regions.map((region) => eq(teams.region, region))));
		}

		// Activity level filters (assuming teams have an activityLevel field)
		if (input.activityLevels && input.activityLevels.length > 0) {
			conditions.push(
				or(...input.activityLevels.map((level) => eq(teams.activityLevel, level))),
			);
		}

		// Member count filter
		if (input.memberCount) {
			const memberCountSubquery = db
				.select({ count: count() })
				.from(teamMembers)
				.where(eq(teamMembers.teamId, teams.id));

			if (input.memberCount === "full") {
				conditions.push(eq(memberCountSubquery, 5));
			} else if (input.memberCount === "recruiting") {
				conditions.push(
					and(sql`${memberCountSubquery} >= 1`, sql`${memberCountSubquery} <= 4`),
				);
			} else if (input.memberCount === "new") {
				conditions.push(eq(memberCountSubquery, 1));
			}
		}

		// Build order by clause
		let orderBy;
		switch (input.sortBy) {
			case "name_asc":
				orderBy = asc(teams.name);
				break;
			case "name_desc":
				orderBy = sql`${teams.name} DESC`;
				break;
			case "rank_desc":
				orderBy = sql`${teams.currentRank} DESC`;
				break;
			case "rank_asc":
				orderBy = asc(teams.currentRank);
				break;
			case "activity":
				orderBy = sql`${teams.lastActiveAt} DESC NULLS LAST`;
				break;
			case "members":
				orderBy = sql`(SELECT COUNT(*) FROM ${teamMembers} WHERE ${teamMembers.teamId} = ${teams.id}) DESC`;
				break;
			default:
				orderBy = sql`${teams.lastActiveAt} DESC NULLS LAST`;
		}

		// If user is logged in, prioritize their teams first, then pending invites.
		if (userId) {
			const isMemberSubquery = sql<boolean>`
				EXISTS (
					SELECT 1 FROM ${teamMembers}
					WHERE ${teamMembers.teamId} = ${teams.id}
					AND ${teamMembers.userId} = ${userId}
				)`;

			const isInvitedSubquery = sql<boolean>`
				EXISTS (
					SELECT 1 FROM ${teamInvites}
					WHERE ${teamInvites.teamId} = ${teams.id}
					AND ${teamInvites.invitedUserId} = ${userId}
					AND ${teamInvites.status} = 'PENDING'
				)`;

			orderBy = sql`${isMemberSubquery} DESC, ${isInvitedSubquery} DESC, ${orderBy}`;
		}

		// Calculate offset
		const offset = (input.page - 1) * input.limit;

		// Get total count for pagination
		const [totalCount] = await db
			.select({ count: count() })
			.from(teams)
			.where(conditions.length > 0 ? and(...conditions) : undefined);

		// Get teams with member count
		const teamsQuery = db
			.select({
				...getTableColumns(teams),
				memberCount: sql<number>`COALESCE(${count(teamMembers.id)}, 0)`,
				isMember: userId
					? sql<boolean>`
						EXISTS (
							SELECT 1 FROM ${teamMembers}
							WHERE ${teamMembers.teamId} = ${teams.id}
							AND ${teamMembers.userId} = ${userId}
							)`
					: sql<boolean>`false`,
				isInvited: userId
					? sql<boolean>`
						EXISTS (
							SELECT 1 FROM ${teamInvites}
							WHERE ${teamInvites.teamId} = ${teams.id}
							AND ${teamInvites.invitedUserId} = ${userId}
							AND ${teamInvites.status} = 'PENDING'
							)`
					: sql<boolean>`false`,
			})
			.from(teams)
			.leftJoin(teamMembers, eq(teamMembers.teamId, teams.id))
			.where(conditions.length > 0 ? and(...conditions) : undefined)
			.groupBy(teams.id) // In PostgreSQL, grouping by primary key allows selecting other columns
			.orderBy(orderBy)
			.limit(input.limit)
			.offset(offset);

		const teamsResult = await teamsQuery;

		const result = {
			teams: teamsResult,
			total: totalCount.count,
			totalPages: Math.ceil(totalCount.count / input.limit),
			currentPage: input.page,
			hasNextPage: input.page < Math.ceil(totalCount.count / input.limit),
			hasPreviousPage: input.page > 1,
		};

		if (!userId) {
			await redis?.setex(cacheKey, 300, JSON.stringify(result));
		}

		return result;
	}),

	// Get team by ID with enhanced details for profile page
	getById: baseProcedure.input(TeamByIdSchema).query(async ({ input }) => {
		const cacheKey = `team:profile:${input.teamId}`;

		// Try cache first (2 minutes TTL for profile data)
		const cached = await redis?.get(cacheKey);
		if (cached) {
			return JSON.parse(cached) as Awaited<ReturnType<typeof buildTeamResponse>>;
		}

		const team = await db.query.teams.findFirst({
			where: eq(teams.id, input.teamId),
			with: {
				owner: true,
				members: {
					with: { user: true },
					orderBy: asc(teamMembers.joinedAt),
				},
			},
		});

		if (!team) {
			throw new TRPCError({
				code: "NOT_FOUND",
				message: "Team not found",
			});
		}

		const teamInvitesResp = await db.query.teamInvites.findMany({
			where: and(eq(teamInvites.teamId, input.teamId), eq(teamInvites.status, "PENDING")),
			with: {
				invitedUser: true,
			},
		});

		const buildTeamResponse = async (teamData: typeof team) => {
			// Calculate memberCount from members relation
			const memberCount = teamData.members?.length || 0;

			// Add computed stats (these would come from actual scrim data in a real implementation)
			return {
				...teamData,
				memberCount,
				stats: {
					winRate: 65, // Mock data - would be calculated from actual scrims
					totalScrims: 24,
					avgDuration: 28,
					recentForm: "W-W-L-W-W", // Last 5 games
				},
				invites: teamInvitesResp,
			};
		};

		const teamWithStats = await buildTeamResponse(team);

		// Cache for 2 minutes
		await redis?.setex(cacheKey, 120, JSON.stringify(teamWithStats));

		return teamWithStats;
	}),

	// Get team scrim history
	getScrimHistory: baseProcedure.input(TeamScrimHistorySchema).query(async ({ input }) => {
		// Mock data for now - in a real implementation, this would query a scrims table
		const mockScrims = [
			{
				id: "1",
				opponent: { name: "Team Alpha", tag: "ALPHA" },
				result: "WIN",
				score: "2-1",
				playedAt: new Date(Date.now() - 86400000), // 1 day ago
				durationMinutes: 32,
				gameMode: "Best of 3",
			},
			{
				id: "2",
				opponent: { name: "Team Beta", tag: "BETA" },
				result: "LOSS",
				score: "1-2",
				playedAt: new Date(Date.now() - 172800000), // 2 days ago
				durationMinutes: 28,
				gameMode: "Best of 3",
			},
			// Add more mock data as needed
		];

		const offset = (input.page - 1) * input.limit;
		const paginatedScrims = mockScrims.slice(offset, offset + input.limit);

		return {
			scrims: paginatedScrims,
			total: mockScrims.length,
			totalPages: Math.ceil(mockScrims.length / input.limit),
			currentPage: input.page,
		};
	}),

	// Get team upcoming scrims
	getUpcomingScrims: baseProcedure.input(TeamUpcomingScrimsSchema).query(async ({ input }) => {
		// Mock data for now
		const mockUpcomingScrims = [
			{
				id: "1",
				opponent: { name: "Team Gamma", tag: "GAMMA" },
				scheduledTime: new Date(Date.now() + 86400000), // Tomorrow
				durationMinutes: 30,
				status: "CONFIRMED",
			},
			{
				id: "2",
				opponent: { name: "Team Delta", tag: "DELTA" },
				scheduledTime: new Date(Date.now() + 259200000), // 3 days from now
				durationMinutes: 45,
				status: "PENDING",
			},
		];

		return mockUpcomingScrims;
	}),

	// Get team availability
	getAvailability: baseProcedure.input(TeamAvailabilitySchema).query(async ({ input }) => {
		// Mock data for now
		const mockAvailability = {
			preferredTimes: [
				{ day: "Monday", timeRange: "7:00 PM - 10:00 PM" },
				{ day: "Wednesday", timeRange: "7:00 PM - 10:00 PM" },
				{ day: "Friday", timeRange: "8:00 PM - 11:00 PM" },
				{ day: "Saturday", timeRange: "2:00 PM - 6:00 PM" },
			],
			timezone: "America/New_York",
			notes: "We prefer evening scrims during weekdays and are flexible on weekends. Please give at least 24 hours notice for scheduling.",
		};

		return mockAvailability;
	}),

	// ===== LEGACY ENDPOINTS (for backward compatibility) =====

	registerTeam: authenticatedProcedure
		.input(TeamRegisterSchema)
		.mutation(async ({ input, ctx }) => {
			const team = (
				await db
					.insert(teams)
					.values({
						name: input.teamName,
						tag: input.teamName.substring(0, 5).toUpperCase(),
						ownerId: ctx.user.id,
					} as TTeamInsert)
					.returning()
			)[0];
			await db.insert(usersToTeams).values({
				userId: ctx.user.id,
				teamId: team.id,
				userIsPendingConfirmation: false,
			});
			return team;
		}),

	leaveTeam: authenticatedProcedure.input(TeamLeaveSchema).mutation(async ({ input, ctx }) => {
		await db
			.delete(usersToTeams)
			.where(
				and(eq(usersToTeams.teamId, input.teamId), eq(usersToTeams.userId, ctx.user.id)),
			);
		const usersTeam = await db.query.usersToTeams.findMany({
			where: eq(usersToTeams.teamId, input.teamId),
		});

		if (usersTeam.length === 0) {
			await db.delete(teams).where(eq(teams.id, input.teamId));
		}

		await syncConversationsForTeam(input.teamId);

		return true;
	}),

	kickPlayer: authenticatedProcedure
		.input(TeamKickPlayerSchema)
		.mutation(async ({ input, ctx }) => {
			const team = await db.query.teams.findFirst({
				where: eq(teams.id, input.teamId),
				with: { usersToTeams: { with: { user: true } } },
			});
			if (ctx.user.id !== input.playerId) {
				await db
					.delete(usersToTeams)
					.where(
						and(
							eq(usersToTeams.userId, input.playerId),
							eq(usersToTeams.teamId, input.teamId),
						),
					);
			}
			await syncConversationsForTeam(input.teamId);
			return team;
		}),

	addPlayer: authenticatedProcedure
		.input(TeamAddPlayerSchema)
		.mutation(async ({ input, ctx }) => {
			const player = await db.query.users.findFirst({
				where: eq(users.name, input.playerName),
			});
			const team = await db.query.teams.findFirst({
				where: eq(teams.id, input.teamId),
				with: { usersToTeams: { with: { user: true } } },
			});
			if (!team) throw new Error(`There is no team with id: ${input.teamId}`);
			if (!player) throw new Error("There is no player with that name.");

			await db.insert(usersToTeams).values({
				teamId: input.teamId,
				userId: player.id,
				userIsPendingConfirmation: true,
			});

			if (player.email) {
				await sendEmail(
					player.email,
					`Join Team ${team?.name}`,
					`Please confirm joining ${team?.name}: ${input.confirmUrl}`,
				);
			}
			await createNotification(player.id, "TEAM_INVITATION", {
				teamId: team?.id,
				teamName: team?.name || "",
			});
			return { team };
		}),

	confirmJoin: authenticatedProcedure
		.input(TeamConfirmJoinSchema)
		.mutation(async ({ input, ctx }) => {
			await db
				.update(usersToTeams)
				.set({ userIsPendingConfirmation: false })
				.where(
					and(
						eq(usersToTeams.userId, ctx.user.id),
						eq(usersToTeams.teamId, input.teamId),
					),
				);
			return true;
		}),

	cancelInvitation: authenticatedProcedure
		.input(TeamCancelInvitationSchema)
		.mutation(async ({ input, ctx }) => {
			await db
				.delete(usersToTeams)
				.where(
					and(
						eq(usersToTeams.userId, input.playerId),
						eq(usersToTeams.teamId, input.teamId),
					),
				);
			return true;
		}),
});
