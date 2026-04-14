import { TPickType, TMapType, TSpectatorType } from "./tournament";

export type TTournamentCodeParameters = {
	allowedSummonerIds?: string[];
	metadata?: string;
	teamSize: number; // 1 - 5
	pickType: TPickType;
	mapType: TMapType;
	spectatorType: TSpectatorType;
};
