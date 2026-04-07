import { z } from "zod";

// Stats source enum
export const StatsSourceSchema = z.enum(["riot", "scrim"]);

// Player metrics input schema
export const PlayerMetricsSchema = z.object({
	userId: z.string().uuid().optional(),
	puuid: z.string().optional(),
	source: StatsSourceSchema,
	count: z.number().min(1).max(100).optional().default(20),
	region: z.string().optional().default("na"),
});

// Individual game/match schema
export const GameStatsSchema = z.object({
	gameId: z.string(), // matchId for Riot, scrimId for scrims
	championId: z.number(),
	role: z.string().optional(),
	kills: z.number(),
	deaths: z.number(),
	assists: z.number(),
	win: z.boolean(),
	visionScore: z.number(),
	csAt10Minutes: z.number().optional(),
	totalCreepScore: z.number().optional(),
	goldEarned: z.number().optional(),
	totalDamageDealtToChampions: z.number().optional(),
	gameDuration: z.number().optional(),
	gameDate: z.date(),
	queueType: z.string(),
	kda: z.number(),
});

// Aggregated stats schema
export const AggregatedStatsSchema = z.object({
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
});

// Player metrics response schema
export const PlayerMetricsResponseSchema = z.object({
	source: StatsSourceSchema,
	aggregateStats: AggregatedStatsSchema,
	recentGames: z.array(GameStatsSchema),
	summoner: z
		.object({
			name: z.string(),
			profileIconId: z.number(),
			summonerLevel: z.number(),
			revisionDate: z.number(),
		})
		.optional(),
});
