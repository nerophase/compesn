import { redis } from "./database/redis";
import axios from "axios";

// Cache keys
const CHAMPION_DATA_KEY = "riot:champions:data";
const CHAMPION_VERSION_KEY = "riot:champions:version";
const CACHE_TTL = 24 * 60 * 60; // 24 hours in seconds

// Types for champion data
export interface ChampionData {
	id: string;
	key: string; // Numeric ID as string
	name: string;
	title: string;
	image: {
		full: string;
		sprite: string;
		group: string;
		x: number;
		y: number;
		w: number;
		h: number;
	};
	tags: string[];
}

export interface ChampionsResponse {
	type: string;
	format: string;
	version: string;
	data: Record<string, ChampionData>;
}

/**
 * Get the latest DDragon version
 */
export const getLatestDDragonVersion = async (): Promise<string> => {
	try {
		const response = await axios.get("https://ddragon.leagueoflegends.com/api/versions.json");
		return response.data[0]; // Latest version is first
	} catch (error) {
		console.error("Failed to fetch DDragon versions:", error);
		// Fallback to a known stable version
		return "14.1.1";
	}
};

/**
 * Fetch champion data from DDragon API
 */
export const fetchChampionData = async (version?: string): Promise<ChampionsResponse> => {
	const ddVersion = version || (await getLatestDDragonVersion());
	const url = `https://ddragon.leagueoflegends.com/cdn/${ddVersion}/data/en_US/champion.json`;

	try {
		const response = await axios.get<ChampionsResponse>(url);
		return response.data;
	} catch (error) {
		console.error("Failed to fetch champion data:", error);
		throw new Error("Failed to fetch champion data from DDragon");
	}
};

/**
 * Get cached champion data or fetch if not available/outdated
 */
export const getCachedChampionData = async (): Promise<ChampionsResponse> => {
	try {
		// Check if we have cached data
		const cachedData = await redis?.get(CHAMPION_DATA_KEY);
		const cachedVersion = await redis?.get(CHAMPION_VERSION_KEY);

		if (cachedData && cachedVersion) {
			// Check if cached version is still current
			const latestVersion = await getLatestDDragonVersion();

			if (cachedVersion === latestVersion) {
				return JSON.parse(cachedData);
			}
		}

		// Fetch fresh data
		const championData = await fetchChampionData();

		// Cache the data
		await Promise.all([
			redis?.setex(CHAMPION_DATA_KEY, CACHE_TTL, JSON.stringify(championData)),
			redis?.setex(CHAMPION_VERSION_KEY, CACHE_TTL, championData.version),
		]);

		return championData;
	} catch (error) {
		console.error("Error getting champion data:", error);

		// Try to return cached data even if version check failed
		const cachedData = await redis?.get(CHAMPION_DATA_KEY);
		if (cachedData) {
			return JSON.parse(cachedData);
		}

		throw error;
	}
};

/**
 * Get champion data by numeric ID
 */
export const getChampionById = async (championId: number): Promise<ChampionData | null> => {
	try {
		const championData = await getCachedChampionData();

		// Find champion by numeric key
		const champion = Object.values(championData.data).find(
			(champ) => parseInt(champ.key) === championId,
		);

		return champion || null;
	} catch (error) {
		console.error(`Error getting champion by ID ${championId}:`, error);
		return null;
	}
};

/**
 * Get multiple champions by their numeric IDs
 */
export const getChampionsByIds = async (
	championIds: number[],
): Promise<Record<number, ChampionData>> => {
	try {
		const championData = await getCachedChampionData();
		const result: Record<number, ChampionData> = {};

		for (const id of championIds) {
			const champion = Object.values(championData.data).find(
				(champ) => parseInt(champ.key) === id,
			);

			if (champion) {
				result[id] = champion;
			}
		}

		return result;
	} catch (error) {
		console.error("Error getting champions by IDs:", error);
		return {};
	}
};

/**
 * Get champion image URL
 */
export const getChampionImageUrl = (championData: ChampionData, version?: string): string => {
	const ddVersion = version || "14.1.1"; // Fallback version
	return `https://ddragon.leagueoflegends.com/cdn/${ddVersion}/img/champion/${championData.image.full}`;
};

/**
 * Invalidate champion cache (useful for manual cache refresh)
 */
export const invalidateChampionCache = async (): Promise<void> => {
	await Promise.all([redis?.del(CHAMPION_DATA_KEY), redis?.del(CHAMPION_VERSION_KEY)]);
};

/**
 * Warm up the champion cache (useful for server startup)
 */
export const warmUpChampionCache = async (): Promise<void> => {
	try {
		await getCachedChampionData();
		console.log("Champion cache warmed up successfully");
	} catch (error) {
		console.error("Failed to warm up champion cache:", error);
	}
};
