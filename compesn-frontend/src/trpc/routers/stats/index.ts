import { createTRPCRouter, authenticatedProcedure } from "../../init";
import { PlayerMetricsSchema, PlayerMetricsResponseSchema } from "./stats.schema";
import { db } from "../../../lib/database/db";
import { eq } from "drizzle-orm";
import { users, scrimParticipants } from "@compesn/shared/common/schemas";
import { TRPCError } from "@trpc/server";
import { RiotAPICacheService } from "../../../lib/riot-api-cache";
import { TRegion } from "../teams/teams.schema";

export const statsRouter = createTRPCRouter({
	// Get player metrics aggregated from either Riot or scrim sources
	getPlayerMetrics: authenticatedProcedure
		.input(PlayerMetricsSchema)
		.output(PlayerMetricsResponseSchema)
		.query(async ({ input }) => {
			const { userId, puuid, source, count, region } = input;
			const riotAPICache = new RiotAPICacheService();
			let targetPuuid = puuid;
			let targetRegion = region as TRegion;
			let summonerDetails = undefined;

			// If userId is provided, look up the user in the database
			if (userId) {
				const user = await db.query.users.findFirst({
					where: eq(users.id, userId),
					with: {
						riotAccount: true,
					},
				});

				// Only throw if userId was explicitly provided but not found
				// If we have a puuid, we might not need the user (unless source is scrim)
				if (!user && !puuid) {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "User not found",
					});
				}

				if (user && source === "riot" && user.riotAccount?.puuid) {
					// Prefer user's linked account if available, or fall back to provided puuid/region
					targetPuuid = user.riotAccount.puuid;
					targetRegion = user.primaryRegion as TRegion;
				}
			}

			if (source === "riot") {
				// Handle Riot API data source
				if (!targetPuuid) {
					throw new TRPCError({
						code: "BAD_REQUEST",
						message: "No PUUID provided or found for user",
					});
				}

				try {
					// Get summoner details
					// For getSummonerByPuuid, the second argument is platform (e.g. "na"), which matches our TRegion
					const summoner = await riotAPICache.getSummonerByPuuid(
						targetPuuid,
						targetRegion,
					);

					if (summoner) {
						summonerDetails = {
							name: summoner.name || "Summoner",
							profileIconId: summoner.profileIconId,
							summonerLevel: summoner.summonerLevel,
							revisionDate: summoner.revisionDate,
						};
					}

					// Get match history from Riot API
					// getMatchIdsByPuuid takes TRegion (platform)
					const matchIds = await riotAPICache.getMatchIdsByPuuid(
						targetPuuid,
						targetRegion,
						count,
					);

					// Filter for relevant queue types (Ranked Solo/Duo, Flex, Normal Draft)
					const relevantQueueIds = [420, 440, 400];

					// Queue type mappings
					const queueTypeMap: Record<number, string> = {
						420: "Ranked Solo/Duo",
						440: "Ranked Flex",
						400: "Normal Draft",
						430: "Normal Blind",
						450: "ARAM",
					};

					// Fetch match details for each match
					const matchPromises = matchIds.map(async (matchId) => {
						try {
							const matchDetail = await riotAPICache.getMatchDetailsByMatchId(
								matchId,
								targetRegion,
							);

							// Skip if not a relevant queue type
							if (!relevantQueueIds.includes(matchDetail.info.queueId)) {
								return null;
							}

							// Find participant data for this user
							const participant = matchDetail.info.participants.find(
								(p) => p.puuid === targetPuuid,
							);

							if (!participant) return null;

							// Calculate derived stats
							const totalCS =
								participant.totalMinionsKilled + participant.neutralMinionsKilled;
							const csAt10 =
								matchDetail.info.gameDuration >= 600
									? (totalCS / (matchDetail.info.gameDuration / 60)) * 10
									: totalCS;
							const kda =
								participant.deaths > 0
									? (participant.kills + participant.assists) / participant.deaths
									: participant.kills + participant.assists;

							// Role mapping/cleanup
							let mappedRole = participant.role;
							if (participant.teamPosition) {
								mappedRole = participant.teamPosition;
							} else if (participant.lane) {
								mappedRole = participant.lane;
							}

							return {
								gameId: matchId,
								championId:
									typeof participant.championId === "string"
										? parseInt(participant.championId)
										: participant.championId,
								role: mappedRole,
								kills: participant.kills,
								deaths: participant.deaths,
								assists: participant.assists,
								win: participant.win,
								visionScore: participant.visionScore,
								csAt10Minutes: Math.round(csAt10 * 10) / 10,
								totalCreepScore: totalCS,
								goldEarned: participant.goldEarned,
								totalDamageDealtToChampions:
									participant.totalDamageDealtToChampions,
								gameDuration: matchDetail.info.gameDuration,
								gameDate: new Date(matchDetail.info.gameCreation),
								queueType: queueTypeMap[matchDetail.info.queueId] || "Unknown",
								kda: Math.round(kda * 100) / 100,
							};
						} catch (error) {
							console.error(`Error processing match ${matchId}:`, error);
							return null;
						}
					});

					const matchResults = await Promise.all(matchPromises);
					const validMatches = matchResults.filter(
						(match): match is NonNullable<typeof match> => match !== null,
					);

					// Calculate aggregate statistics
					const aggregateStats = calculateAggregateStats(validMatches);

					return {
						source: "riot" as const,
						aggregateStats,
						recentGames: validMatches,
						summoner: summonerDetails,
					};
				} catch (error) {
					console.error("Error fetching Riot match history:", error);
					throw new TRPCError({
						code: "INTERNAL_SERVER_ERROR",
						message: `Failed to fetch Riot match history: ${
							error instanceof Error ? error.message : "Unknown error"
						}`,
					});
				}
			} else {
				// Handle scrim data source
				if (!userId) {
					throw new TRPCError({
						code: "BAD_REQUEST",
						message: "User ID is required for scrim history",
					});
				}

				try {
					// Get scrim participation data
					const scrimData = await db.query.scrimParticipants.findMany({
						where: eq(scrimParticipants.userId, userId),
						with: {
							scrim: {
								with: {
									creatingTeam: true,
									opponentTeam: true,
									winningTeam: true,
								},
							},
							team: true,
						},
						orderBy: (scrimParticipants, { desc }) => [
							desc(scrimParticipants.createdAt),
						],
						limit: count,
					});

					// Filter for completed scrims only
					const completedScrims = scrimData.filter(
						(participation) => participation.scrim.status === "COMPLETED",
					);

					// Transform scrim data to match the game stats schema
					const scrimGames = completedScrims.map((participation) => {
						const kda =
							participation.deaths > 0
								? (participation.kills + participation.assists) /
									participation.deaths
								: participation.kills + participation.assists;

						return {
							gameId: participation.scrim.id,
							championId: participation.championId,
							role: participation.role,
							kills: participation.kills,
							deaths: participation.deaths,
							assists: participation.assists,
							win: participation.scrim.winningTeamId === participation.teamId,
							visionScore: participation.visionScore,
							csAt10Minutes: participation.csAt10Minutes,
							totalCreepScore: participation.totalCreepScore,
							goldEarned: participation.goldEarned,
							totalDamageDealtToChampions: participation.totalDamageDealtToChampions,
							gameDuration: participation.scrim.matchDurationSeconds || 0,
							gameDate:
								participation.scrim.completedAt || participation.scrim.createdAt,
							queueType: "Scrim",
							kda: Math.round(kda * 100) / 100,
						};
					});

					// Calculate aggregate statistics
					const aggregateStats = calculateAggregateStats(scrimGames);

					return {
						source: "scrim" as const,
						aggregateStats,
						recentGames: scrimGames,
					};
				} catch (error) {
					console.error("Error fetching scrim history:", error);
					throw new TRPCError({
						code: "INTERNAL_SERVER_ERROR",
						message: `Failed to fetch scrim history: ${
							error instanceof Error ? error.message : "Unknown error"
						}`,
					});
				}
			}
		}),
});

// Helper function to calculate aggregate statistics
function calculateAggregateStats(games: any[]): {
	totalGames: number;
	winRate: number;
	averageKDA: {
		kills: number;
		deaths: number;
		assists: number;
		ratio: number;
	};
	averageVisionScore: number;
	averageCSAt10: number;
} {
	const totalGames = games.length;

	if (totalGames === 0) {
		return {
			totalGames: 0,
			winRate: 0,
			averageKDA: {
				kills: 0,
				deaths: 0,
				assists: 0,
				ratio: 0,
			},
			averageVisionScore: 0,
			averageCSAt10: 0,
		};
	}

	const wins = games.filter((game) => game.win).length;
	const winRate = (wins / totalGames) * 100;

	const totalKills = games.reduce((sum, game) => sum + game.kills, 0);
	const totalDeaths = games.reduce((sum, game) => sum + game.deaths, 0);
	const totalAssists = games.reduce((sum, game) => sum + game.assists, 0);

	const averageKills = totalKills / totalGames;
	const averageDeaths = totalDeaths / totalGames;
	const averageAssists = totalAssists / totalGames;
	const averageKDARatio =
		totalDeaths > 0 ? (totalKills + totalAssists) / totalDeaths : totalKills + totalAssists;

	const totalVisionScore = games.reduce((sum, game) => sum + game.visionScore, 0);
	const averageVisionScore = totalVisionScore / totalGames;

	const totalCSAt10 = games.reduce((sum, game) => sum + (game.csAt10Minutes || 0), 0);
	const averageCSAt10 = totalCSAt10 / totalGames;

	return {
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
	};
}
