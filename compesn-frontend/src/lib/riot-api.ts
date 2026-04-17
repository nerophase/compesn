import "server-only";
import { env } from "@/environment";
import axios, { AxiosError, AxiosInstance } from "axios";
import { TRegion } from "@/trpc/routers/teams/teams.schema";
import type { Match } from "@compesn/shared/types/riot-api";

// Riot API regional routing
export const RIOT_ACCOUNT_REGIONS = {
	americas: "https://americas.api.riotgames.com",
	asia: "https://asia.api.riotgames.com",
	europe: "https://europe.api.riotgames.com",
	sea: "https://sea.api.riotgames.com",
} as const;

// Platform routing for summoner/league data
export const RIOT_PLATFORM_REGIONS: Record<string, string> = {
	na: "https://na1.api.riotgames.com",
	euw: "https://euw1.api.riotgames.com",
	eune: "https://eun1.api.riotgames.com",
	kr: "https://kr.api.riotgames.com",
	br: "https://br1.api.riotgames.com",
	jp: "https://jp1.api.riotgames.com",
	lan: "https://la1.api.riotgames.com",
	las: "https://la2.api.riotgames.com",
	oce: "https://oc1.api.riotgames.com",
	tr: "https://tr1.api.riotgames.com",
	ru: "https://ru.api.riotgames.com",
	me: "https://me1.api.riotgames.com",
	pbe: "https://pbe1.api.riotgames.com",
	ph: "https://ph2.api.riotgames.com",
	sg: "https://sg2.api.riotgames.com",
	th: "https://th2.api.riotgames.com",
	tw: "https://tw2.api.riotgames.com",
	vn: "https://vn2.api.riotgames.com",
};

// Map platform to account region for match history
export const PLATFORM_TO_REGION: Record<string, keyof typeof RIOT_ACCOUNT_REGIONS> = {
	na: "americas",
	br: "americas",
	lan: "americas",
	las: "americas",
	oce: "americas",
	pbe: "americas",
	jp: "asia",
	kr: "asia",
	ph: "sea",
	sg: "sea",
	th: "sea",
	tw: "sea",
	vn: "sea",
	euw: "europe",
	eune: "europe",
	tr: "europe",
	ru: "europe",
	me: "europe",
};

export interface RiotAccount {
	puuid: string;
	gameName: string;
	tagLine: string;
}

export interface Summoner {
	id?: string;
	accountId?: string;
	puuid: string;
	name?: string;
	profileIconId: number;
	revisionDate: number;
	summonerLevel: number;
}

export interface LeagueEntry {
	leagueId: string;
	queueType: string;
	tier: string;
	rank: string;
	summonerId: string;
	leaguePoints: number;
	wins: number;
	losses: number;
	veteran: boolean;
	inactive: boolean;
	freshBlood: boolean;
	hotStreak: boolean;
}

export interface ChampionMastery {
	puuid: string;
	championId: number;
	championLevel: number;
	championPoints: number;
	lastPlayTime: number;
	championPointsSinceLastLevel: number;
	championPointsUntilNextLevel: number;
	chestGranted: boolean;
	tokensEarned: number;
}

export type MatchDetails = Match;

type RiotRequestParams = Record<string, number>;

const getAxiosErrorMessage = (error: unknown) =>
	error instanceof AxiosError ? error.message : "Unknown Riot API error";

const isAxiosNotFoundError = (error: unknown) =>
	error instanceof AxiosError && error.response?.status === 404;

export class RiotApiService {
	private apiKey: string;
	private accountClient: AxiosInstance;

	constructor() {
		this.apiKey = env.RIOT_API_KEY;
		this.accountClient = axios.create({
			headers: {
				"X-Riot-Token": this.apiKey,
			},
		});
	}

	/**
	 * Get Riot account by PUUID
	 */
	async getAccountByPuuid(puuid: string, region: string = "na"): Promise<RiotAccount | null> {
		try {
			const baseUrl = this.getAccountRegionUrl(region);
			const response = await this.accountClient.get<RiotAccount>(
				`${baseUrl}/riot/account/v1/accounts/by-puuid/${puuid}`,
			);
			return response.data;
		} catch (error: unknown) {
			if (isAxiosNotFoundError(error)) {
				return null;
			}
			console.error("Error fetching Riot account by PUUID:", getAxiosErrorMessage(error));
			throw error;
		}
	}

	async getLeagueEntriesBySummonerId(
		summonerId: string,
		platform: string,
	): Promise<LeagueEntry[]> {
		try {
			const baseUrl = this.getPlatformUrl(platform);
			const response = await this.accountClient.get<LeagueEntry[]>(
				`${baseUrl}/lol/league/v4/entries/by-summoner/${summonerId}`,
			);
			return response.data;
		} catch (error: unknown) {
			console.error("Error fetching ranked stats:", getAxiosErrorMessage(error));
			return [];
		}
	}

	async getLeagueEntriesByPuuid(puuid: string, platform: string): Promise<LeagueEntry[]> {
		try {
			const baseUrl = this.getPlatformUrl(platform);
			const response = await this.accountClient.get<LeagueEntry[]>(
				`${baseUrl}/lol/league/v4/entries/by-puuid/${puuid}`,
			);
			return response.data;
		} catch (error: unknown) {
			console.error("Error fetching ranked stats by PUUID:", getAxiosErrorMessage(error));
			return [];
		}
	}

	async getMatchIdsByPuuid(
		puuid: string,
		region: TRegion,
		count: number,
		start: number,
	): Promise<string[]> {
		try {
			const baseUrl = this.getAccountRegionUrl(region);
			const params: RiotRequestParams = { count, start };

			const response = await this.accountClient.get<string[]>(
				`${baseUrl}/lol/match/v5/matches/by-puuid/${puuid}/ids`,
				{ params },
			);
			return response.data;
		} catch (error: unknown) {
			console.error("Error fetching match IDs:", getAxiosErrorMessage(error));
			return [];
		}
	}

	async getMatchDetailsByMatchId(matchId: string, region: TRegion): Promise<MatchDetails> {
		try {
			const baseUrl = this.getAccountRegionUrl(region);
			const response = await this.accountClient.get<MatchDetails>(
				`${baseUrl}/lol/match/v5/matches/${matchId}`,
			);
			return response.data;
		} catch (error: unknown) {
			if (isAxiosNotFoundError(error)) {
				throw new Error("Match not found");
			}
			console.error("Error fetching match details:", getAxiosErrorMessage(error));
			throw error;
		}
	}

	private getAccountRegionUrl(region: string): string {
		const accountRegion = PLATFORM_TO_REGION[region.toLowerCase()] || "americas";
		return RIOT_ACCOUNT_REGIONS[accountRegion];
	}

	private getPlatformUrl(region: string): string {
		return RIOT_PLATFORM_REGIONS[region.toLowerCase()] || RIOT_PLATFORM_REGIONS.na;
	}

	/**
	 * Get Riot account by Riot ID (gameName#tagLine)
	 */
	async getAccountByRiotId(
		gameName: string,
		tagLine: string,
		region: string = "na",
	): Promise<RiotAccount | null> {
		try {
			const baseUrl = this.getAccountRegionUrl(region);
			const response = await this.accountClient.get<RiotAccount>(
				`${baseUrl}/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(
					gameName,
				)}/${encodeURIComponent(tagLine)}`,
			);
			return response.data;
		} catch (error: unknown) {
			if (isAxiosNotFoundError(error)) {
				return null;
			}
			console.error("Error fetching Riot account:", getAxiosErrorMessage(error));
			throw error;
		}
	}

	/**
	 * Get summoner by PUUID
	 */
	async getSummonerByPuuid(puuid: string, region: string = "na"): Promise<Summoner | null> {
		try {
			const baseUrl = this.getPlatformUrl(region);
			const response = await this.accountClient.get<Summoner>(
				`${baseUrl}/lol/summoner/v4/summoners/by-puuid/${puuid}`,
			);
			return response.data;
		} catch (error: unknown) {
			if (isAxiosNotFoundError(error)) {
				return null;
			}
			console.error("Error fetching summoner:", getAxiosErrorMessage(error));
			throw error;
		}
	}

	/**
	 * Get ranked stats for a summoner
	 */
	async getRankedStats(summonerId: string, region: string = "na"): Promise<LeagueEntry[]> {
		try {
			const baseUrl = this.getPlatformUrl(region);
			const response = await this.accountClient.get<LeagueEntry[]>(
				`${baseUrl}/lol/league/v4/entries/by-summoner/${summonerId}`,
			);
			return response.data;
		} catch (error: unknown) {
			console.error("Error fetching ranked stats:", getAxiosErrorMessage(error));
			return [];
		}
	}

	async getChampionMasteriesByPuuid(
		puuid: string,
		region: string = "na",
	): Promise<ChampionMastery[]> {
		try {
			const baseUrl = this.getPlatformUrl(region);
			const response = await this.accountClient.get<ChampionMastery[]>(
				`${baseUrl}/lol/champion-mastery/v4/champion-masteries/by-puuid/${puuid}`,
			);
			return response.data;
		} catch (error: unknown) {
			console.error("Error fetching champion masteries:", getAxiosErrorMessage(error));
			throw error;
		}
	}

	/**
	 * Get match IDs for a player
	 */
	async getMatchIds(
		puuid: string,
		region: string = "na",
		count: number = 10,
		queueId?: number,
	): Promise<string[]> {
		try {
			const baseUrl = this.getAccountRegionUrl(region);
			const params: RiotRequestParams = { count };
			if (queueId) params.queue = queueId;

			const response = await this.accountClient.get<string[]>(
				`${baseUrl}/lol/match/v5/matches/by-puuid/${puuid}/ids`,
				{ params },
			);
			return response.data;
		} catch (error: unknown) {
			console.error("Error fetching match IDs:", getAxiosErrorMessage(error));
			return [];
		}
	}

	/**
	 * Get match details by match ID
	 */
	async getMatchDetails(matchId: string, region: string = "na"): Promise<MatchDetails | null> {
		try {
			const baseUrl = this.getAccountRegionUrl(region);
			const response = await this.accountClient.get<MatchDetails>(
				`${baseUrl}/lol/match/v5/matches/${matchId}`,
			);
			return response.data;
		} catch (error: unknown) {
			if (isAxiosNotFoundError(error)) {
				return null;
			}
			console.error("Error fetching match details:", getAxiosErrorMessage(error));
			throw error;
		}
	}

	/**
	 * Convenience method to get full player profile by Riot ID
	 */
	async getPlayerProfile(gameName: string, tagLine: string, region: string = "na") {
		// Get account
		const account = await this.getAccountByRiotId(gameName, tagLine, region);
		if (!account) {
			return null;
		}

		// Get summoner
		const summoner = await this.getSummonerByPuuid(account.puuid, region);
		if (!summoner) {
			return { account, summoner: null, rankedStats: [] };
		}

		// Get ranked stats
		const rankedStats = await this.getLeagueEntriesByPuuid(account.puuid, region);

		// Get solo queue rank
		const soloQueue = rankedStats.find((entry) => entry.queueType === "RANKED_SOLO_5x5");
		const flexQueue = rankedStats.find((entry) => entry.queueType === "RANKED_FLEX_SR");

		return {
			account,
			summoner,
			rankedStats,
			soloQueue,
			flexQueue,
			displayRank: soloQueue
				? `${soloQueue.tier} ${soloQueue.rank}`
				: flexQueue
					? `${flexQueue.tier} ${flexQueue.rank} (Flex)`
					: "UNRANKED",
		};
	}
}

// Singleton instance
export const riotApi = new RiotApiService();
