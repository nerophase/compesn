import { redis } from "@/lib/database/redis";
import { RiotApiService, RiotAccount, LeagueEntry, Summoner, MatchDetails } from "./riot-api";
import { TPlatform } from "@/constants/regions";
import { TSummonerProfile } from "@compesn/shared/common/schemas";
import { TRegion } from "@/trpc/routers/teams/teams.schema";

// Cache TTL constants (in seconds)
const CACHE_TTL = {
	ACCOUNT: 24 * 60 * 60, // 24 hours
	SUMMONER: 24 * 60 * 60, // 24 hours
	LEAGUE: 60 * 60, // 1 hour
	MATCH_LIST: 15 * 60, // 15 minutes
	MATCH_DETAIL: -1, // Indefinite (no expiration)
} as const;

// Stale threshold for SWR (in seconds)
const STALE_THRESHOLD = {
	LEAGUE: 30 * 60, // 30 minutes for ranked data
	MATCH_LIST: 5 * 60, // 5 minutes for match list
} as const;

// Cache key generators
const CACHE_KEYS = {
	account: (gameName: string, tagLine: string, region: TRegion) =>
		`riot:account:v1:${region}:${gameName.toLowerCase()}:${tagLine.toLowerCase()}`,
	summoner: (puuid: string, region: TRegion) => `riot:summoner:v4:${region}:${puuid}`,
	league: (summonerId: string, region: TRegion) => `riot:league:v4:${region}:${summonerId}`,
	matchList: (puuid: string, region: TRegion, count: number, start: number) =>
		`riot:match:v5:list:${region}:${puuid}:${start}:${count}`,
	matchDetail: (matchId: string, region: TRegion) => `riot:match:v5:detail:${region}:${matchId}`,
} as const;

interface CachedData<T> {
	data: T;
	timestamp: number;
	ttl: number;
}

export class RiotAPICacheService {
	private riotAPI: RiotApiService;

	constructor() {
		this.riotAPI = new RiotApiService();
	}

	private async getFromCache<T>(key: string): Promise<CachedData<T> | null> {
		if (!redis) return null;

		try {
			const cached = await redis.get(key);
			if (!cached) return null;

			return JSON.parse(cached) as CachedData<T>;
		} catch (error) {
			console.error(`Error reading from cache for key ${key}:`, error);
			return null;
		}
	}

	private async setCache<T>(key: string, data: T, ttl: number): Promise<void> {
		if (!redis) return;

		try {
			const cachedData: CachedData<T> = {
				data,
				timestamp: Date.now(),
				ttl,
			};

			if (ttl > 0) {
				await redis.setex(key, ttl, JSON.stringify(cachedData));
			} else {
				// Indefinite cache
				await redis.set(key, JSON.stringify(cachedData));
			}
		} catch (error) {
			console.error(`Error writing to cache for key ${key}:`, error);
		}
	}

	private isStale(cachedData: CachedData<any>, staleThreshold: number): boolean {
		const age = (Date.now() - cachedData.timestamp) / 1000;
		return age > staleThreshold;
	}

	private async refreshInBackground<T>(
		key: string,
		refreshFn: () => Promise<T>,
		ttl: number,
	): Promise<void> {
		// Run refresh in background without blocking
		setImmediate(async () => {
			try {
				const freshData = await refreshFn();
				await this.setCache(key, freshData, ttl);
			} catch (error) {
				console.error(`Background refresh failed for key ${key}:`, error);
			}
		});
	}

	/**
	 * Get account by Riot ID with caching
	 */
	async getAccountByRiotId(
		gameName: string,
		tagLine: string,
		region: TRegion = "na",
	): Promise<RiotAccount | null> {
		const key = CACHE_KEYS.account(gameName, tagLine, region);
		const cached = await this.getFromCache<RiotAccount>(key);

		if (cached) {
			return cached.data;
		}

		// Cache miss - fetch from API
		const data = await this.riotAPI.getAccountByRiotId(gameName, tagLine, region);
		await this.setCache(key, data, CACHE_TTL.ACCOUNT);
		return data;
	}

	/**
	 * Get account by PUUID with caching
	 */
	async getAccountByPuuid(puuid: string, region: TRegion = "na"): Promise<RiotAccount | null> {
		const key = `riot:account:v1:puuid:${region}:${puuid}`;
		const cached = await this.getFromCache<RiotAccount>(key);

		if (cached) {
			return cached.data;
		}

		// Cache miss - fetch from API
		const data = await this.riotAPI.getAccountByPuuid(puuid, region);
		await this.setCache(key, data, CACHE_TTL.ACCOUNT);
		return data;
	}

	/**
	 * Get summoner by PUUID with caching
	 */
	async getSummonerByPuuid(puuid: string, region: TRegion): Promise<Summoner | null> {
		const key = CACHE_KEYS.summoner(puuid, region);
		const cached = await this.getFromCache<Summoner>(key);

		if (cached) {
			return cached.data;
		}

		// Cache miss - fetch from API
		const data = await this.riotAPI.getSummonerByPuuid(puuid, region);
		await this.setCache(key, data, CACHE_TTL.SUMMONER);
		return data;
	}

	/**
	 * Get league entries with caching and SWR
	 */
	async getLeagueEntriesBySummonerId(
		summonerId: string,
		region: TRegion,
	): Promise<LeagueEntry[]> {
		const key = CACHE_KEYS.league(summonerId, region);
		const cached = await this.getFromCache<LeagueEntry[]>(key);

		if (cached) {
			// Check if data is stale and trigger background refresh
			if (this.isStale(cached, STALE_THRESHOLD.LEAGUE)) {
				this.refreshInBackground(
					key,
					() => this.riotAPI.getLeagueEntriesBySummonerId(summonerId, region),
					CACHE_TTL.LEAGUE,
				);
			}
			return cached.data;
		}

		// Cache miss - fetch from API
		const data = await this.riotAPI.getLeagueEntriesBySummonerId(summonerId, region);
		await this.setCache(key, data, CACHE_TTL.LEAGUE);
		return data;
	}

	/**
	 * Get match IDs with caching and SWR
	 */
	async getMatchIdsByPuuid(
		puuid: string,
		region: TRegion,
		count: number = 20,
		start: number = 0,
	): Promise<string[]> {
		const key = CACHE_KEYS.matchList(puuid, region, count, start);
		const cached = await this.getFromCache<string[]>(key);

		if (cached) {
			// Check if data is stale and trigger background refresh
			if (this.isStale(cached, STALE_THRESHOLD.MATCH_LIST)) {
				this.refreshInBackground(
					key,
					() => this.riotAPI.getMatchIdsByPuuid(puuid, region, count, start),
					CACHE_TTL.MATCH_LIST,
				);
			}
			return cached.data;
		}

		// Cache miss - fetch from API
		const data = await this.riotAPI.getMatchIdsByPuuid(puuid, region, count, start);
		await this.setCache(key, data, CACHE_TTL.MATCH_LIST);
		return data;
	}

	/**
	 * Get match details with indefinite caching
	 */
	async getMatchDetailsByMatchId(matchId: string, region: TRegion): Promise<MatchDetails> {
		const key = CACHE_KEYS.matchDetail(matchId, region);
		const cached = await this.getFromCache<MatchDetails>(key);

		if (cached) {
			return cached.data;
		}

		// Cache miss - fetch from API
		const data = await this.riotAPI.getMatchDetailsByMatchId(matchId, region);
		await this.setCache(key, data, CACHE_TTL.MATCH_DETAIL);
		return data;
	}

	/**
	 * Manually invalidate cache for a user's data (for user-initiated refresh)
	 */
	async invalidateUserCache(puuid: string, summonerId: string, region: TRegion): Promise<void> {
		if (!redis) return;

		try {
			const keysToDelete = [
				CACHE_KEYS.summoner(puuid, region),
				CACHE_KEYS.league(summonerId, region),
				// Match list keys are harder to invalidate without knowing all combinations
				// We could use a pattern match, but for now we'll rely on TTL
			];

			await Promise.all(keysToDelete.map((key) => redis?.del(key)));
		} catch (error) {
			console.error("Error invalidating user cache:", error);
		}
	}

	/**
	 * Get cache statistics for monitoring
	 */
	async getCacheStats(): Promise<{
		totalKeys: number;
		riotKeys: number;
		memoryUsage?: string;
	}> {
		if (!redis) {
			return { totalKeys: 0, riotKeys: 0 };
		}

		try {
			const [totalKeys, riotKeys, memoryInfo] = await Promise.all([
				redis.dbsize(),
				redis.eval(`return #redis.call('keys', 'riot:*')`, 0) as Promise<number>,
				redis.memory("STATS").catch(() => null),
			]);

			return {
				totalKeys,
				riotKeys,
				memoryUsage: memoryInfo ? `${memoryInfo} bytes` : undefined,
			};
		} catch (error) {
			console.error("Error getting cache stats:", error);
			return { totalKeys: 0, riotKeys: 0 };
		}
	}
}
