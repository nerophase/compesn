import { z } from "zod";

export const UserByIdSchema = z.object({ userId: z.string() });
export const UserByAccountSchema = z.object({ accountId: z.string() });
export const UserUpdateInfoSchema = z.object({
	name: z.string().optional(),
	email: z.string().email().optional(),
	region: z.string().optional(),
});

export const UserAddDiscordSchema = z.object({
	code: z.string(),
	redirectUrl: z.string().url(),
});

export const UserAddRiotSchema = z.object({
	code: z.string(),
	redirectUrl: z.string().url(),
});

export const UserRemoveAccountSchema = z.object({ accountId: z.string() });

export const UserUpdatePrimaryRegionSchema = z.object({
	region: z.string(),
});

export const UserRefreshRiotProfileSchema = z.object({
	forceRefresh: z.boolean().optional().default(false),
});

export const UserRefreshRiotProfileResponseSchema = z.object({
	success: z.boolean(),
	message: z.string(),
	data: z.object({
		summonerLevel: z.number(),
		profileIconId: z.number(),
		rankedStats: z.array(
			z.object({
				queueType: z.string(),
				tier: z.string().nullable(),
				division: z.string().nullable(),
				leaguePoints: z.number(),
				wins: z.number(),
				losses: z.number(),
			}),
		),
		recentMatches: z.object({
			totalMatches: z.number(),
			averageKDA: z.object({
				kills: z.number(),
				deaths: z.number(),
				assists: z.number(),
			}),
			winRate: z.number(),
		}),
	}),
});

export const UserSearchSchema = z.object({
	query: z.string().min(1, "Search query must not be empty").max(50, "Search query too long"),
	limit: z.number().min(1).max(20).optional().default(10),
});

export const UserGetMatchHistorySchema = z.object({
	puuid: z.string(),
	region: z.string(),
	count: z.number().min(1).max(100).optional().default(20),
});

export const MatchHistoryResponseSchema = z.object({
	matches: z.array(
		z.object({
			matchId: z.string(),
			championId: z.number(),
			queueId: z.number(),
			gameCreation: z.date(),
			gameDuration: z.number(),
			kills: z.number(),
			deaths: z.number(),
			assists: z.number(),
			win: z.boolean(),
			totalMinionsKilled: z.number(),
			neutralMinionsKilled: z.number(),
			visionScore: z.number(),
			goldEarned: z.number(),
			totalDamageDealtToChampions: z.number(),
			csPerMinute: z.number(),
			kda: z.number(),
			queueType: z.string(),
		}),
	),
	aggregateStats: z.object({
		totalGames: z.number(),
		winRate: z.number(),
		averageKDA: z.object({
			kills: z.number(),
			deaths: z.number(),
			assists: z.number(),
			ratio: z.number(),
		}),
		averageVisionScore: z.number(),
		averageCSAt10: z.number(),
	}),
});
