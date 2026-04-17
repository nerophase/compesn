import { z } from "zod";
import { RegionsSchema } from "../teams/teams.schema";

export const PlayerLookupInputSchema = z.object({
	region: RegionsSchema.default("na"),
	gameName: z.string().trim().min(3, "Game name is required").max(16),
	tagLine: z
		.string()
		.trim()
		.min(3, "Tagline is required")
		.max(5)
		.regex(/^[a-zA-Z0-9]+$/, "Tagline must be alphanumeric"),
});

export const PlayerRecentMatchesInputSchema = z.object({
	region: RegionsSchema.default("na"),
	puuid: z.string().min(1),
	start: z.number().int().min(0).default(0),
	count: z.number().int().min(1).max(20).default(10),
});

export const RankedQueueSchema = z.object({
	queueType: z.string(),
	queueLabel: z.string(),
	tier: z.string(),
	rank: z.string(),
	leaguePoints: z.number(),
	wins: z.number(),
	losses: z.number(),
	winRate: z.number(),
	hotStreak: z.boolean(),
	veteran: z.boolean(),
	freshBlood: z.boolean(),
	inactive: z.boolean(),
});

export const ChampionMasterySummarySchema = z.object({
	championId: z.number(),
	championName: z.string(),
	championImageUrl: z.string(),
	championLevel: z.number(),
	championPoints: z.number(),
	lastPlayTime: z.date().nullable(),
	championPointsSinceLastLevel: z.number(),
	championPointsUntilNextLevel: z.number(),
	chestGranted: z.boolean(),
	tokensEarned: z.number(),
});

export const PlayerMatchSummarySchema = z.object({
	matchId: z.string(),
	queueId: z.number(),
	queueLabel: z.string(),
	gameCreation: z.date().nullable(),
	gameDuration: z.number(),
	gameVersion: z.string(),
	championId: z.number(),
	championName: z.string(),
	championImageUrl: z.string(),
	role: z.string(),
	kills: z.number(),
	deaths: z.number(),
	assists: z.number(),
	kda: z.number(),
	win: z.boolean(),
	creepScore: z.number(),
	goldEarned: z.number(),
	damageToChampions: z.number(),
	visionScore: z.number(),
});

export const RecentMatchesResponseSchema = z.object({
	matches: z.array(PlayerMatchSummarySchema),
	nextStart: z.number(),
	hasMore: z.boolean(),
});

export const PlayerLookupResponseSchema = z.object({
	account: z.object({
		puuid: z.string(),
		gameName: z.string(),
		tagLine: z.string(),
		region: RegionsSchema,
	}),
	summoner: z.object({
		id: z.string().nullable(),
		accountId: z.string().nullable(),
		profileIconId: z.number(),
		profileIconUrl: z.string(),
		summonerLevel: z.number(),
		revisionDate: z.date().nullable(),
	}),
	rankedQueues: z.array(RankedQueueSchema),
	topChampionMasteries: z.array(ChampionMasterySummarySchema),
	aggregate: z.object({
		totalRecentGames: z.number(),
		wins: z.number(),
		winRate: z.number(),
		averageKda: z.number(),
	}),
	recentMatches: RecentMatchesResponseSchema,
	ddragonVersion: z.string(),
});

export type PlayerLookupResponse = z.infer<typeof PlayerLookupResponseSchema>;
export type PlayerMatchSummary = z.infer<typeof PlayerMatchSummarySchema>;
export type ChampionMasterySummary = z.infer<typeof ChampionMasterySummarySchema>;
export type RankedQueue = z.infer<typeof RankedQueueSchema>;
