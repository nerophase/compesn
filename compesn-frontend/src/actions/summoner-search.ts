"use server";

import { RiotAPICacheService } from "@/lib/riot-api-cache";

interface SearchSummonerResult {
	puuid: string | null;
	error?: string;
}

export async function searchSummoner(query: string): Promise<SearchSummonerResult> {
	// Pattern for Riot ID: Name#Tag
	// Allow for spaces around #
	const riotIdPattern = /^(.+)#(\w+)$/;
	const match = query.trim().match(riotIdPattern);

	if (!match) {
		return { puuid: null };
	}

	const [, gameName, tagLine] = match;

	try {
		const riotAPICache = new RiotAPICacheService();
		const account = await riotAPICache.getAccountByRiotId(gameName.trim(), tagLine.trim());

		if (account) {
			return { puuid: account.puuid };
		}

		return { puuid: null, error: "Summoner not found" };
	} catch (error) {
		console.error("Error searching summoner:", error);
		return { puuid: null, error: "Failed to search summoner" };
	}
}
