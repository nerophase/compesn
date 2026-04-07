import type { SearchQueryInput, SearchResponse } from "@/trpc/routers/search/search.schema";

export interface SearchTelemetryData {
	timestamp: string;
	searchTerm: string;
	typeFilter?: string;
	limit: number;
	offset: number;
	resultsCount: number;
	totalResults: number;
	executionTimeMs: number;
	cacheHit: boolean;
	userId?: string;
	sessionId?: string;
}

export class SearchTelemetryService {
	/**
	 * Log a search query with performance metrics
	 */
	static logSearchQuery(
		input: SearchQueryInput,
		response: SearchResponse,
		executionTimeMs: number,
		cacheHit: boolean,
		userId?: string,
		sessionId?: string,
	): void {
		const telemetryData: SearchTelemetryData = {
			timestamp: new Date().toISOString(),
			searchTerm: input.term,
			typeFilter: input.type,
			limit: input.limit,
			offset: input.offset,
			resultsCount: response.results.length,
			totalResults: response.total,
			executionTimeMs,
			cacheHit,
			userId,
			sessionId,
		};

		// Log as structured JSON for log collectors to parse
		console.log(
			JSON.stringify({
				event: "search_query",
				level: "info",
				...telemetryData,
			}),
		);

		// Additional performance logging for slow queries
		if (executionTimeMs > 1000) {
			console.warn(
				JSON.stringify({
					event: "slow_search_query",
					level: "warn",
					message: `Search query took ${executionTimeMs}ms`,
					...telemetryData,
				}),
			);
		}
	}

	/**
	 * Log search errors
	 */
	static logSearchError(
		input: SearchQueryInput,
		error: Error,
		executionTimeMs: number,
		userId?: string,
		sessionId?: string,
	): void {
		console.error(
			JSON.stringify({
				event: "search_error",
				level: "error",
				timestamp: new Date().toISOString(),
				searchTerm: input.term,
				typeFilter: input.type,
				limit: input.limit,
				offset: input.offset,
				executionTimeMs,
				errorMessage: error.message,
				errorStack: error.stack,
				userId,
				sessionId,
			}),
		);
	}

	/**
	 * Log cache performance metrics
	 */
	static logCacheMetrics(
		operation: "hit" | "miss" | "set" | "error",
		cacheKey: string,
		executionTimeMs?: number,
		error?: Error,
	): void {
		const baseData = {
			event: "search_cache_operation",
			level: operation === "error" ? "error" : "info",
			timestamp: new Date().toISOString(),
			operation,
			cacheKey,
			executionTimeMs,
		};

		if (error) {
			console.error(
				JSON.stringify({
					...baseData,
					errorMessage: error.message,
					errorStack: error.stack,
				}),
			);
		} else {
			console.log(JSON.stringify(baseData));
		}
	}

	/**
	 * Log aggregated search statistics (called periodically)
	 */
	static logSearchStatistics(stats: {
		totalSearches: number;
		cacheHitRate: number;
		averageResponseTime: number;
		slowQueriesCount: number;
		errorRate: number;
		topSearchTerms: Array<{ term: string; count: number }>;
		timeWindow: string;
	}): void {
		console.log(
			JSON.stringify({
				event: "search_statistics",
				level: "info",
				timestamp: new Date().toISOString(),
				...stats,
			}),
		);
	}
}

/**
 * Performance measurement utility
 */
export class PerformanceTimer {
	private startTime: number;

	constructor() {
		this.startTime = Date.now();
	}

	/**
	 * Get elapsed time in milliseconds
	 */
	getElapsedMs(): number {
		return Date.now() - this.startTime;
	}

	/**
	 * Reset the timer
	 */
	reset(): void {
		this.startTime = Date.now();
	}
}

/**
 * Search analytics aggregator (in-memory for simplicity)
 * In production, this would likely be replaced with a proper analytics service
 */
export class SearchAnalytics {
	private static searches: SearchTelemetryData[] = [];
	private static readonly MAX_STORED_SEARCHES = 10000;

	/**
	 * Record a search for analytics
	 */
	static recordSearch(data: SearchTelemetryData): void {
		this.searches.push(data);

		// Keep only recent searches to prevent memory issues
		if (this.searches.length > this.MAX_STORED_SEARCHES) {
			this.searches = this.searches.slice(-this.MAX_STORED_SEARCHES);
		}
	}

	/**
	 * Get search statistics for a time window
	 */
	static getStatistics(windowMinutes: number = 60): {
		totalSearches: number;
		cacheHitRate: number;
		averageResponseTime: number;
		slowQueriesCount: number;
		errorRate: number;
		topSearchTerms: Array<{ term: string; count: number }>;
	} {
		const cutoffTime = new Date(Date.now() - windowMinutes * 60 * 1000);
		const recentSearches = this.searches.filter(
			(search) => new Date(search.timestamp) > cutoffTime,
		);

		if (recentSearches.length === 0) {
			return {
				totalSearches: 0,
				cacheHitRate: 0,
				averageResponseTime: 0,
				slowQueriesCount: 0,
				errorRate: 0,
				topSearchTerms: [],
			};
		}

		const totalSearches = recentSearches.length;
		const cacheHits = recentSearches.filter((s) => s.cacheHit).length;
		const cacheHitRate = (cacheHits / totalSearches) * 100;

		const totalResponseTime = recentSearches.reduce((sum, s) => sum + s.executionTimeMs, 0);
		const averageResponseTime = totalResponseTime / totalSearches;

		const slowQueriesCount = recentSearches.filter((s) => s.executionTimeMs > 1000).length;

		// Count search terms
		const termCounts = new Map<string, number>();
		recentSearches.forEach((search) => {
			const term = search.searchTerm.toLowerCase();
			termCounts.set(term, (termCounts.get(term) || 0) + 1);
		});

		const topSearchTerms = Array.from(termCounts.entries())
			.map(([term, count]) => ({ term, count }))
			.sort((a, b) => b.count - a.count)
			.slice(0, 10);

		return {
			totalSearches,
			cacheHitRate,
			averageResponseTime,
			slowQueriesCount,
			errorRate: 0, // Would need error tracking to calculate this
			topSearchTerms,
		};
	}

	/**
	 * Clear stored analytics data
	 */
	static clear(): void {
		this.searches = [];
	}
}
