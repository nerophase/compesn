import { z } from "zod";

export const EPickType = z.enum(["BLIND_PICK", "DRAFT_MODE", "ALL_RANDOM", "TOURNAMENT_DRAFT"]);

export const EMapType = z.enum(["SUMMONERS_RIFT", "TWISTED_TREELINE", "HOWLING_ABYSS"]);

export const ESpectatorType = z.enum(["NONE", "LOBBYONLY", "ALL"]);

export type TPickType = z.infer<typeof EPickType>;
export type TMapType = z.infer<typeof EMapType>;
export type TSpectatorType = z.infer<typeof ESpectatorType>;

export type TTournamentCodeParameters = {
	allowedSummonerIds?: string[];
	metadata?: string;
	teamSize: number; // 1 - 5
	pickType: TPickType;
	mapType: TMapType;
	spectatorType: TSpectatorType;
};
