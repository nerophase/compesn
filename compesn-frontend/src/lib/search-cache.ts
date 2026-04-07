import { redis } from "@/lib/database/redis";
import { env } from "@/environment";
import type { SearchQueryInput, SearchResponse } from "@/trpc/routers/search/search.schema";
import { SearchTelemetryService, PerformanceTimer } from "./search-telemetry";

export class SearchCacheService {
	private static readonly CACHE_PREFIX = "search";
	private static readonly DEFAULT_TTL = 300; // 5 minutes in seconds

	/**
	 * Generate a cache key for search queries
	 */
	private static generateCacheKey(input: SearchQueryInput): string {
		const { term, type, limit, offset } = input;
		const normalizedTerm = term.toLowerCase().trim();
		const typeFilter = type || "all";

		return `${this.CACHE_PREFIX}:${normalizedTerm}:${typeFilter}:${limit}:${offset}`;
	}

	/**
	 * Get cached search results
	 */
	static async get(input: SearchQueryInput): Promise<SearchResponse | null> {
		if (!redis || !env.ENABLE_CACHE) {
			return null;
		}

		const timer = new PerformanceTimer();
		const cacheKey = this.generateCacheKey(input);

		try {
			const cached = await redis.get(cacheKey);
			const executionTimeMs = timer.getElapsedMs();

			if (!cached) {
				SearchTelemetryService.logCacheMetrics("miss", cacheKey, executionTimeMs);
				return null;
			}

			const parsed = JSON.parse(cached);

			// Convert date strings back to Date objects
			parsed.results.forEach((result: any) => {
				if (result.type === "team" && result.createdAt) {
					result.createdAt = new Date(result.createdAt);
				}
				if (result.type === "scrim" && result.startTime) {
					result.startTime = new Date(result.startTime);
				}
			});

			SearchTelemetryService.logCacheMetrics("hit", cacheKey, executionTimeMs);
			return parsed as SearchResponse;
		} catch (error) {
			const executionTimeMs = timer.getElapsedMs();
			SearchTelemetryService.logCacheMetrics(
				"error",
				cacheKey,
				executionTimeMs,
				error as Error,
			);
			console.error("Error retrieving search cache:", error);
			return null;
		}
	}

	/**
	 * Cache search results
	 */
	static async set(input: SearchQueryInput, response: SearchResponse): Promise<void> {
		if (!redis || !env.ENABLE_CACHE) {
			return;
		}

		const timer = new PerformanceTimer();
		const cacheKey = this.generateCacheKey(input);

		try {
			const serialized = JSON.stringify(response);
			await redis.setex(cacheKey, this.DEFAULT_TTL, serialized);

			const executionTimeMs = timer.getElapsedMs();
			SearchTelemetryService.logCacheMetrics("set", cacheKey, executionTimeMs);
		} catch (error) {
			const executionTimeMs = timer.getElapsedMs();
			SearchTelemetryService.logCacheMetrics(
				"error",
				cacheKey,
				executionTimeMs,
				error as Error,
			);
			console.error("Error setting search cache:", error);
			// Don't throw - caching failures shouldn't break the search
		}
	}

	/**
	 * Invalidate search cache (useful for manual cache clearing)
	 */
	static async invalidate(pattern?: string): Promise<void> {
		if (!redis || !env.ENABLE_CACHE) {
			return;
		}

		try {
			const searchPattern = pattern || `${this.CACHE_PREFIX}:*`;
			const keys = await redis.keys(searchPattern);

			if (keys.length > 0) {
				await redis.del(...keys);
			}
		} catch (error) {
			console.error("Error invalidating search cache:", error);
		}
	}

	/**
	 * Get cache statistics
	 */
	static async getStats(): Promise<{
		totalKeys: number;
		memoryUsage: string;
	}> {
		if (!redis || !env.ENABLE_CACHE) {
			return { totalKeys: 0, memoryUsage: "0B" };
		}

		try {
			const keys = await redis.keys(`${this.CACHE_PREFIX}:*`);
			const info = await redis.info("memory");
			const memoryMatch = info.match(/used_memory_human:(.+)/);
			const memoryUsage = memoryMatch ? memoryMatch[1].trim() : "Unknown";

			return {
				totalKeys: keys.length,
				memoryUsage,
			};
		} catch (error) {
			console.error("Error getting cache stats:", error);
			return { totalKeys: 0, memoryUsage: "Error" };
		}
	}
}
