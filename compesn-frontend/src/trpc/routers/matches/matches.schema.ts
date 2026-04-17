import { z } from "zod";

export const MatchLookupInputSchema = z.object({
	matchId: z
		.string()
		.trim()
		.min(1, "Match ID is required")
		.max(32, "Match ID is too long")
		.transform((value) => value.toUpperCase())
		.refine((value) => /^[A-Z0-9]+_\d+$/.test(value), {
			message: "Use a Riot match ID like NA1_1234567890.",
		}),
});

export const MatchObjectiveSummarySchema = z.object({
	first: z.boolean(),
	kills: z.number(),
});

export const MatchPlayerSummarySchema = z.object({
	puuid: z.string(),
	participantId: z.number(),
	displayName: z.string(),
	championId: z.number(),
	championName: z.string(),
	role: z.string(),
	side: z.enum(["blue", "red"]),
	kills: z.number(),
	deaths: z.number(),
	assists: z.number(),
	kda: z.number(),
	creepScore: z.number(),
	goldEarned: z.number(),
	damageToChampions: z.number(),
	visionScore: z.number(),
	win: z.boolean(),
});

export const MatchTeamSummarySchema = z.object({
	side: z.enum(["blue", "red"]),
	teamId: z.number(),
	win: z.boolean(),
	totalKills: z.number(),
	participantCount: z.number(),
	bans: z.array(
		z.object({
			championId: z.number(),
			pickTurn: z.number().nullable(),
		}),
	),
	objectives: z.object({
		baron: MatchObjectiveSummarySchema,
		champion: MatchObjectiveSummarySchema,
		dragon: MatchObjectiveSummarySchema,
		inhibitor: MatchObjectiveSummarySchema,
		riftHerald: MatchObjectiveSummarySchema,
		tower: MatchObjectiveSummarySchema,
		atakhan: MatchObjectiveSummarySchema.nullable(),
	}),
	players: z.array(MatchPlayerSummarySchema),
});

export const MatchLookupResponseSchema = z.object({
	matchId: z.string(),
	gameId: z.number(),
	platformId: z.string(),
	region: z.string(),
	queueId: z.number(),
	queueLabel: z.string(),
	gameMode: z.string(),
	gameType: z.string(),
	gameVersion: z.string(),
	gameCreation: z.date().nullable(),
	gameStartTimestamp: z.date().nullable(),
	gameEndTimestamp: z.date().nullable(),
	gameDuration: z.number(),
	tournamentCode: z.string().nullable(),
	winningSide: z.enum(["blue", "red"]).nullable(),
	teams: z.array(MatchTeamSummarySchema),
});

export type MatchLookupResponse = z.infer<typeof MatchLookupResponseSchema>;
export type MatchTeamSummary = z.infer<typeof MatchTeamSummarySchema>;
export type MatchPlayerSummary = z.infer<typeof MatchPlayerSummarySchema>;
