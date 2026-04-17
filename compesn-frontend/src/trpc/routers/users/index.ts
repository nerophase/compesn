import { baseProcedure, createTRPCRouter, authenticatedProcedure } from "../../init";
import {
	UserByIdSchema,
	UserByAccountSchema,
	UserUpdateInfoSchema,
	UserAddDiscordSchema,
	UserAddRiotSchema,
	UserRemoveAccountSchema,
	UserUpdatePrimaryRegionSchema,
	UserRefreshRiotProfileSchema,
	UserSearchSchema,
	UserGetMatchHistorySchema,
} from "./users.schema";
import axios from "axios";
import { db } from "../../../lib/database/db";
import {
	accounts,
	users,
	regionChangeLogs,
	riotAccounts,
	summonerProfiles,
	rankedStats,
	matchHistory,
	teamMembers,
} from "@compesn/shared/schemas";
import { eq, and, or, ilike, isNotNull } from "drizzle-orm";
import { regionToPlatform } from "../../../constants/regions";
import { env } from "@/environment";
import { RiotAPICacheService } from "../../../lib/riot-api-cache";
// import { Platform, Region } from "../../../lib/riot-api";
import { redis } from "../../../lib/database/redis";
import { TRegion } from "../teams/teams.schema";

export const usersRouter = createTRPCRouter({
	getUser: authenticatedProcedure.query(async ({ ctx }) => {
		return await db.query.users.findFirst({
			where: eq(users.id, ctx.user.id),
		});
	}),

	list: baseProcedure.query(async () => {
		return await db.query.users.findMany();
	}),

	byId: baseProcedure.input(UserByIdSchema).query(async ({ input }) => {
		return await db.query.users.findFirst({
			where: eq(users.id, input.userId),
			with: {
				accounts: true,
				usersToTeams: {
					with: {
						team: true,
					},
				},
			},
		});
	}),

	byAccount: baseProcedure.input(UserByAccountSchema).query(async ({ input }) => {
		return await db.query.users.findFirst({
			with: { accounts: { where: eq(accounts.id, input.accountId) } },
		});
	}),

	teams: baseProcedure.input(UserByIdSchema).query(async ({ input }) => {
		return await db.query.teamMembers.findMany({
			where: eq(teamMembers.userId, input.userId),
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

	updateInfo: authenticatedProcedure
		.input(UserUpdateInfoSchema)
		.mutation(async ({ input, ctx }) => {
			try {
				return (
					await db
						.update(users)
						.set(input as Partial<typeof users.$inferInsert>)
						.where(eq(users.id, ctx.user.id))
						.returning()
				)[0];
			} catch (e: unknown) {
				const dbError = e as {
					cause?: { code?: string; detail?: string };
					message?: string;
				};
				if (dbError.cause?.code === "23505") {
					const fieldMatch = dbError.cause.detail?.match(/\((.*?)\)=/);
					const field = fieldMatch ? fieldMatch[1] : "field";
					throw new Error(`The ${field} is already in use.`);
				}
				throw new Error(`Unexpected error: ${dbError.message}`);
			}
		}),

	addDiscordAccount: authenticatedProcedure
		.input(UserAddDiscordSchema)
		.mutation(async ({ input, ctx }) => {
			const resp = await axios.post(
				"https://discord.com/api/v10/oauth2/token",
				{
					grant_type: "authorization_code",
					code: input.code,
					redirect_uri: input.redirectUrl,
				},
				{
					headers: {
						"Content-Type": "application/x-www-form-urlencoded",
					},
					auth: {
						username: env.NEXT_PUBLIC_AUTH_DISCORD_ID!,
						password: env.AUTH_DISCORD_SECRET!,
					},
				},
			);
			const data = (
				await axios.get("https://discord.com/api/v10/users/@me", {
					headers: {
						Authorization: `Bearer ${resp.data.access_token}`,
					},
				})
			).data;

			const userAccount = await db.query.accounts.findFirst({
				where: eq(accounts.accountId, data.id),
			});
			if (userAccount) throw new Error("EXISTING_USER_WITH_ACCOUNT");

			const date = new Date();
			date.setSeconds(date.getSeconds() + resp.data.expires_in);
			await db.insert(accounts).values({
				providerId: "discord",
				accountId: data.id,
				username: data.username,
				userId: ctx.user.id,
				accessToken: resp.data.access_token,
				refreshToken: resp.data.refresh_token,
				accessTokenExpiresAt: date,
				scope: resp.data.scope,
			});
			return true;
		}),

	addRiotAccount: authenticatedProcedure
		.input(UserAddRiotSchema)
		.mutation(async ({ input, ctx }) => {
			const resp = await axios.post(
				" https://auth.riotgames.com/token",
				{
					grant_type: "authorization_code",
					redirect_uri: input.redirectUrl,
					code: input.code,
				},
				{
					headers: {
						"Content-Type": "application/x-www-form-urlencoded",
					},
					auth: {
						username: env.NEXT_PUBLIC_AUTH_RIOT_ID!,
						password: env.AUTH_RIOT_SECRET!,
					},
				},
			);

			const data = (
				await axios.get(
					`https://${regionToPlatform["NA1"]}.api.riotgames.com/riot/account/v1/accounts/me`,
					{
						headers: {
							Authorization: `Bearer ${resp.data.access_token}`,
						},
					},
				)
			).data;
			const userName = `${data.gameName}#${data.tagLine}`;

			const userAccount = await db.query.accounts.findFirst({
				where: eq(accounts.accountId, data.puuid),
			});
			if (userAccount) throw new Error("EXISTING_USER_WITH_ACCOUNT");

			const date = new Date();
			date.setSeconds(date.getSeconds() + resp.data.expires_in);

			await db.insert(accounts).values({
				providerId: "riot",
				accountId: data.puuid,
				username: userName,
				userId: ctx.user.id,
				accessToken: resp.data.access_token,
				refreshToken: resp.data.refresh_token,
				accessTokenExpiresAt: date,
				idToken: resp.data.id_token,
				scope: resp.data.scope,
			});

			return true;
		}),

	removeAccount: authenticatedProcedure
		.input(UserRemoveAccountSchema)
		.mutation(async ({ input, ctx }) => {
			const user = await db.query.users.findFirst({
				where: eq(users.id, ctx.user.id),
				with: {
					accounts: true,
					usersToTeams: {
						with: {
							team: true,
						},
					},
				},
			});
			if (user && user.defaultAccountId === input.accountId) {
				throw new Error("CANNOT_DELETE_DEFAULT_ACCOUNT");
			}
			await db.delete(accounts).where(eq(accounts.id, input.accountId));
			return true;
		}),

	updatePrimaryRegion: authenticatedProcedure
		.input(UserUpdatePrimaryRegionSchema)
		.mutation(async ({ input, ctx }) => {
			// Get current user to check existing region
			const currentUser = await db.query.users.findFirst({
				where: eq(users.id, ctx.user.id),
			});

			if (!currentUser) {
				throw new Error("User not found");
			}

			// Update user's primary region
			const updatedUser = await db
				.update(users)
				.set({ primaryRegion: input.region })
				.where(eq(users.id, ctx.user.id))
				.returning();

			// Create audit log entry
			await db.insert(regionChangeLogs).values({
				userId: ctx.user.id,
				oldRegion: currentUser.primaryRegion,
				newRegion: input.region,
			});

			return {
				success: true,
				user: updatedUser[0],
			};
		}),

	refreshRiotProfile: authenticatedProcedure
		.input(UserRefreshRiotProfileSchema)
		.mutation(async ({ input, ctx }) => {
			const riotAPICache = new RiotAPICacheService();

			// Get user's Riot account information
			const user = await db.query.users.findFirst({
				where: eq(users.id, ctx.user.id),
				with: {
					riotAccount: true,
				},
			});

			if (!user) {
				throw new Error("User not found");
			}

			if (!user.riotAccount) {
				throw new Error("No Riot account linked to this user");
			}

			const { puuid, primaryRegion } = user.riotAccount;
			const region = primaryRegion as TRegion;

			try {
				// Start database transaction
				return await db.transaction(async (tx) => {
					// If force refresh, invalidate cache first
					if (input.forceRefresh) {
						// We'll need the summoner ID for cache invalidation
						const existingSummoner = await tx.query.summonerProfiles.findFirst({
							where: eq(summonerProfiles.puuid, puuid),
						});

						if (existingSummoner) {
							await riotAPICache.invalidateUserCache(
								puuid,
								existingSummoner.summonerId,
								region,
							);
						}
					}

					// Fetch summoner profile
					const summonerData = await riotAPICache.getSummonerByPuuid(puuid, region);
					const summonerId = summonerData?.id ?? puuid;
					const accountId = summonerData?.accountId ?? puuid;

					// Upsert summoner profile
					await tx
						.insert(summonerProfiles)
						.values({
							puuid,
							summonerId,
							accountId,
							profileIconId: summonerData!.profileIconId,
							summonerLevel: summonerData!.summonerLevel,
							region,
						})
						.onConflictDoUpdate({
							target: summonerProfiles.puuid,
							set: {
								summonerId,
								accountId,
								profileIconId: summonerData!.profileIconId,
								summonerLevel: summonerData!.summonerLevel,
								updatedAt: new Date(),
							},
						});

					// Fetch and upsert ranked stats
					const leagueEntries = await riotAPICache.getLeagueEntriesByPuuid(puuid, region);

					// Delete existing ranked stats for this user
					await tx.delete(rankedStats).where(eq(rankedStats.puuid, puuid));

					// Insert new ranked stats
					if (leagueEntries.length > 0) {
						await tx.insert(rankedStats).values(
							leagueEntries.map((entry) => ({
								puuid,
								queueType: entry.queueType,
								tier: entry.tier,
								division: entry.rank,
								leaguePoints: entry.leaguePoints,
								wins: entry.wins,
								losses: entry.losses,
								hotStreak: entry.hotStreak ? 1 : 0,
								veteran: entry.veteran ? 1 : 0,
								freshBlood: entry.freshBlood ? 1 : 0,
								inactive: entry.inactive ? 1 : 0,
							})),
						);
					}

					// Fetch recent match history
					const matchIds = await riotAPICache.getMatchIdsByPuuid(puuid, region, 20);

					let processedMatches = 0;
					const matchPromises = matchIds.map(async (matchId) => {
						try {
							// Check if match already exists
							const existingMatch = await tx.query.matchHistory.findFirst({
								where: and(
									eq(matchHistory.matchId, matchId),
									eq(matchHistory.puuid, puuid),
								),
							});

							if (existingMatch) return null;

							// Fetch match details
							const matchDetail = await riotAPICache.getMatchDetailsByMatchId(
								matchId,
								region,
							);

							// Find participant data for this user
							const participant = matchDetail.info.participants.find(
								(p) => p.puuid === puuid,
							);

							if (!participant) return null;

							return {
								matchId,
								puuid,
								queueId: matchDetail.info.queueId,
								gameCreation: new Date(matchDetail.info.gameCreation),
								gameDuration: matchDetail.info.gameDuration,
								championId: participant.championId,
								kills: participant.kills,
								deaths: participant.deaths,
								assists: participant.assists,
								win: participant.win,
								totalDamageDealt: participant.totalDamageDealt,
								totalDamageDealtToChampions:
									participant.totalDamageDealtToChampions,
								visionScore: participant.visionScore,
								goldEarned: participant.goldEarned,
								totalMinionsKilled: participant.totalMinionsKilled,
								neutralMinionsKilled: participant.neutralMinionsKilled,
								wardsPlaced: participant.wardsPlaced,
								wardsKilled: participant.wardsKilled,
							};
						} catch (error) {
							console.error(`Error processing match ${matchId}:`, error);
							return null;
						}
					});

					const matchResults = await Promise.all(matchPromises);
					const validMatches = matchResults.filter((match) => match !== null);

					if (validMatches.length > 0) {
						// await tx.insert(matchHistory).values(validMatches); // TODO: Check
						processedMatches = validMatches.length;
					}

					// Calculate response data
					const updatedRankedStats = await tx.query.rankedStats.findMany({
						where: eq(rankedStats.puuid, puuid),
					});

					const recentMatches = await tx.query.matchHistory.findMany({
						where: eq(matchHistory.puuid, puuid),
						limit: 20,
						orderBy: (matchHistory, { desc }) => [desc(matchHistory.gameCreation)],
					});

					// Calculate KDA and win rate
					const totalKills = recentMatches.reduce((sum, match) => sum + match.kills, 0);
					const totalDeaths = recentMatches.reduce((sum, match) => sum + match.deaths, 0);
					const totalAssists = recentMatches.reduce(
						(sum, match) => sum + match.assists,
						0,
					);
					const wins = recentMatches.filter((match) => match.win).length;

					return {
						success: true,
						message: `Profile refreshed successfully. Processed ${processedMatches} new matches.`,
						data: {
							summonerLevel: summonerData!.summonerLevel,
							profileIconId: summonerData!.profileIconId,
							rankedStats: updatedRankedStats.map((stat) => ({
								queueType: stat.queueType,
								tier: stat.tier,
								division: stat.division,
								leaguePoints: stat.leaguePoints,
								wins: stat.wins,
								losses: stat.losses,
							})),
							recentMatches: {
								totalMatches: recentMatches.length,
								averageKDA: {
									kills:
										recentMatches.length > 0
											? totalKills / recentMatches.length
											: 0,
									deaths:
										recentMatches.length > 0
											? totalDeaths / recentMatches.length
											: 0,
									assists:
										recentMatches.length > 0
											? totalAssists / recentMatches.length
											: 0,
								},
								winRate:
									recentMatches.length > 0
										? (wins / recentMatches.length) * 100
										: 0,
							},
						},
					};
				});
			} catch (error) {
				console.error("Error refreshing Riot profile:", error);
				throw new Error(
					`Failed to refresh Riot profile: ${
						error instanceof Error ? error.message : "Unknown error"
					}`,
				);
			}
		}),

	// Search users with linked Riot accounts
	search: authenticatedProcedure.input(UserSearchSchema).query(async ({ input }) => {
		const cacheKey = `user-search:${input.query}:${input.limit}`;

		// Try to get from Redis cache first
		if (redis) {
			try {
				const cached = await redis.get(cacheKey);
				if (cached) {
					return JSON.parse(cached);
				}
			} catch (error) {
				console.error("Redis cache error:", error);
				// Continue with database query if cache fails
			}
		}

		// Search users with linked Riot accounts
		const searchResults = await db.query.users.findMany({
			where: and(
				// Must have a linked Riot account (puuid not null)
				// isNotNull(users.puuid),
				// Search in riot game name, tag line, or username
				or(
					ilike(users.riotGameName, `%${input.query}%`),
					ilike(users.riotTagLine, `%${input.query}%`),
					ilike(users.name, `%${input.query}%`),
				),
			),
			columns: {
				id: true,
				name: true,
				riotGameName: true,
				riotTagLine: true,
				image: true,
				primaryRegion: true,
			},
			with: {
				riotAccount: {
					columns: {
						puuid: true,
					},
				},
			},
			limit: input.limit,
		});

		// Format the results
		const formattedResults = searchResults.map((user) => ({
			id: user.id,
			name: user.name,
			riotGameName: user.riotGameName,
			riotTagLine: user.riotTagLine,
			displayName:
				user.riotGameName && user.riotTagLine
					? `${user.riotGameName}#${user.riotTagLine}`
					: user.name,
			image: user.image,
			primaryRegion: user.primaryRegion,
			hasRiotAccount: !!user.riotAccount?.puuid,
		}));

		// Cache the results for 60 seconds
		if (redis) {
			try {
				await redis.setex(cacheKey, 60, JSON.stringify(formattedResults));
			} catch (error) {
				console.error("Redis cache set error:", error);
				// Continue without caching if Redis fails
			}
		}

		return formattedResults;
	}),

	// Get match history for a user with caching and aggregated stats
	getMatchHistory: baseProcedure.input(UserGetMatchHistorySchema).query(async ({ input }) => {
		const { puuid, region, count } = input;
		const riotAPICache = new RiotAPICacheService();

		// Define queue type mappings for better display
		const queueTypeMap: Record<number, string> = {
			420: "Ranked Solo/Duo",
			440: "Ranked Flex",
			400: "Normal Draft",
			430: "Normal Blind",
			450: "ARAM",
			700: "Clash",
			900: "URF",
			1020: "One for All",
			1300: "Nexus Blitz",
			1400: "Ultimate Spellbook",
		};

		try {
			// Get match IDs from Riot API with caching
			const matchIds = await riotAPICache.getMatchIdsByPuuid(puuid, region as TRegion, count);

			// Filter for relevant queue types (Ranked Solo/Duo, Flex, Normal Draft)
			const relevantQueueIds = [420, 440, 400];

			// Fetch match details for each match
			const matchPromises = matchIds.map(async (matchId) => {
				try {
					const matchDetail = await riotAPICache.getMatchDetailsByMatchId(
						matchId,
						region as TRegion,
					);

					// Skip if not a relevant queue type
					if (!relevantQueueIds.includes(matchDetail.info.queueId)) {
						return null;
					}

					// Find participant data for this user
					const participant = matchDetail.info.participants.find(
						(p) => p.puuid === puuid,
					);

					if (!participant) return null;

					// Calculate derived stats
					const totalCS =
						participant.totalMinionsKilled + participant.neutralMinionsKilled;
					const csPerMinute =
						matchDetail.info.gameDuration > 0
							? totalCS / (matchDetail.info.gameDuration / 60)
							: 0;
					const kda =
						participant.deaths > 0
							? (participant.kills + participant.assists) / participant.deaths
							: participant.kills + participant.assists;

					return {
						matchId,
						championId: participant.championId,
						queueId: matchDetail.info.queueId,
						gameCreation: new Date(matchDetail.info.gameCreation),
						gameDuration: matchDetail.info.gameDuration,
						kills: participant.kills,
						deaths: participant.deaths,
						assists: participant.assists,
						win: participant.win,
						totalMinionsKilled: participant.totalMinionsKilled,
						neutralMinionsKilled: participant.neutralMinionsKilled,
						visionScore: participant.visionScore,
						goldEarned: participant.goldEarned,
						totalDamageDealtToChampions: participant.totalDamageDealtToChampions,
						csPerMinute: Math.round(csPerMinute * 10) / 10,
						kda: Math.round(kda * 100) / 100,
						queueType: queueTypeMap[matchDetail.info.queueId] || "Unknown",
					};
				} catch (error) {
					console.error(`Error processing match ${matchId}:`, error);
					return null;
				}
			});

			const matchResults = await Promise.all(matchPromises);
			const validMatches = matchResults.filter((match) => match !== null);

			// Calculate aggregate statistics
			const totalGames = validMatches.length;
			const wins = validMatches.filter((match) => match.win).length;
			const winRate = totalGames > 0 ? (wins / totalGames) * 100 : 0;

			const totalKills = validMatches.reduce((sum, match) => sum + match.kills, 0);
			const totalDeaths = validMatches.reduce((sum, match) => sum + match.deaths, 0);
			const totalAssists = validMatches.reduce((sum, match) => sum + match.assists, 0);

			const averageKills = totalGames > 0 ? totalKills / totalGames : 0;
			const averageDeaths = totalGames > 0 ? totalDeaths / totalGames : 0;
			const averageAssists = totalGames > 0 ? totalAssists / totalGames : 0;
			const averageKDARatio =
				totalDeaths > 0
					? (totalKills + totalAssists) / totalDeaths
					: totalKills + totalAssists;

			const totalVisionScore = validMatches.reduce(
				(sum, match) => sum + match.visionScore,
				0,
			);
			const averageVisionScore = totalGames > 0 ? totalVisionScore / totalGames : 0;

			// Calculate average CS@10 (approximate from CS per minute * 10)
			const totalCSPerMinute = validMatches.reduce(
				(sum, match) => sum + match.csPerMinute,
				0,
			);
			const averageCSPerMinute = totalGames > 0 ? totalCSPerMinute / totalGames : 0;
			const averageCSAt10 = averageCSPerMinute * 10;

			return {
				matches: validMatches,
				aggregateStats: {
					totalGames,
					winRate: Math.round(winRate * 100) / 100,
					averageKDA: {
						kills: Math.round(averageKills * 100) / 100,
						deaths: Math.round(averageDeaths * 100) / 100,
						assists: Math.round(averageAssists * 100) / 100,
						ratio: Math.round(averageKDARatio * 100) / 100,
					},
					averageVisionScore: Math.round(averageVisionScore * 100) / 100,
					averageCSAt10: Math.round(averageCSAt10 * 100) / 100,
				},
			};
		} catch (error) {
			console.error("Error fetching match history:", error);
			throw new Error(
				`Failed to fetch match history: ${
					error instanceof Error ? error.message : "Unknown error"
				}`,
			);
		}
	}),
});
