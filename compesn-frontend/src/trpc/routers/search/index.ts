import { createTRPCRouter, authenticatedProcedure } from "../../init";
import { searchQuerySchema, searchResponseSchema, type SearchResult } from "./search.schema";
import { users, teams, scrims } from "@compesn/shared/common/schemas";
import { sql, desc } from "drizzle-orm";
import { SearchCacheService } from "@/lib/search-cache";
import { SearchTelemetryService, PerformanceTimer, SearchAnalytics } from "@/lib/search-telemetry";
import { db } from "@/lib/database/db";

export const searchRouter = createTRPCRouter({
	query: authenticatedProcedure
		.input(searchQuerySchema)
		.output(searchResponseSchema)
		.query(async ({ input, ctx }) => {
			const timer = new PerformanceTimer();
			let cacheHit = false;

			try {
				// Try to get cached results first
				const cachedResults = await SearchCacheService.get(input);
				if (cachedResults) {
					cacheHit = true;
					const executionTimeMs = timer.getElapsedMs();

					// Log telemetry for cache hit
					SearchTelemetryService.logSearchQuery(
						input,
						cachedResults,
						executionTimeMs,
						cacheHit,
						ctx.session?.user?.id,
						undefined,
					);

					// Record analytics
					SearchAnalytics.recordSearch({
						timestamp: new Date().toISOString(),
						searchTerm: input.term,
						typeFilter: input.type,
						limit: input.limit,
						offset: input.offset,
						resultsCount: cachedResults.results.length,
						totalResults: cachedResults.total,
						executionTimeMs,
						cacheHit,
						userId: ctx.session?.user?.id,
						sessionId: undefined,
					});

					return cachedResults;
				}

				const { term, type, limit, offset } = input;

				// Convert search term to tsquery format
				const tsquery = term
					.split(/\s+/)
					.filter((word) => word.length > 0)
					.map((word) => `${word}:*`)
					.join(" & ");

				const results: SearchResult[] = [];

				// Search players if no type filter or type is 'player'
				if (!type || type === "player") {
					const playerResults = await db
						.select({
							id: users.id,
							name: users.name,
							riotGameName: users.riotGameName,
							riotTagLine: users.riotTagLine,
							region: users.region,
							image: users.image,
							rank: sql<number>`ts_rank(${users.searchVector}, to_tsquery('english', ${tsquery}))`,
						})
						.from(users)
						.where(sql`${users.searchVector} @@ to_tsquery('english', ${tsquery})`)
						.orderBy(
							desc(
								sql`ts_rank(${users.searchVector}, to_tsquery('english', ${tsquery}))`,
							),
						)
						.limit(limit)
						.offset(offset);

					results.push(
						...playerResults.map(
							(player): SearchResult => ({
								type: "player" as const,
								id: player.id,
								name: player.name,
								riotGameName: player.riotGameName,
								riotTagLine: player.riotTagLine,
								region: player.region,
								image: player.image,
								rank: player.rank,
							}),
						),
					);
				}

				// Search teams if no type filter or type is 'team'
				if (!type || type === "team") {
					const teamResults = await db
						.select({
							id: teams.id,
							name: teams.name,
							tag: teams.tag,
							region: teams.region,
							ownerId: teams.ownerId,
							createdAt: teams.createdAt,
							rank: sql<number>`ts_rank(${teams.searchVector}, to_tsquery('english', ${tsquery}))`,
						})
						.from(teams)
						.where(sql`${teams.searchVector} @@ to_tsquery('english', ${tsquery})`)
						.orderBy(
							desc(
								sql`ts_rank(${teams.searchVector}, to_tsquery('english', ${tsquery}))`,
							),
						)
						.limit(limit)
						.offset(offset);

					results.push(
						...teamResults.map(
							(team): SearchResult => ({
								type: "team" as const,
								id: team.id,
								name: team.name,
								tag: team.tag,
								region: team.region,
								ownerId: team.ownerId,
								createdAt: team.createdAt,
								rank: team.rank,
							}),
						),
					);
				}

				// Search scrims if no type filter or type is 'scrim'
				if (!type || type === "scrim") {
					const scrimResults = await db
						.select({
							id: scrims.id,
							title: scrims.title,
							notes: scrims.notes,
							status: scrims.status,
							startTime: scrims.startTime,
							creatingTeamId: scrims.creatingTeamId,
							rank: sql<number>`ts_rank(${scrims.searchVector}, to_tsquery('english', ${tsquery}))`,
						})
						.from(scrims)
						.where(sql`${scrims.searchVector} @@ to_tsquery('english', ${tsquery})`)
						.orderBy(
							desc(
								sql`ts_rank(${scrims.searchVector}, to_tsquery('english', ${tsquery}))`,
							),
						)
						.limit(limit)
						.offset(offset);

					results.push(
						...scrimResults.map(
							(scrim): SearchResult => ({
								type: "scrim" as const,
								id: scrim.id,
								title: scrim.title,
								notes: scrim.notes,
								status: scrim.status,
								startTime: scrim.startTime,
								creatingTeamId: scrim.creatingTeamId,
								rank: scrim.rank,
							}),
						),
					);
				}

				// Sort results by rank (descending) and then by deterministic secondary criteria
				results.sort((a, b) => {
					// Primary sort: rank (descending)
					if (a.rank !== b.rank) {
						return b.rank - a.rank;
					}

					// Secondary sort: deterministic tie-breaking
					if (a.type === "player" && b.type === "player") {
						// For players: sort by name alphabetically
						return a.name.localeCompare(b.name);
					} else if (a.type === "team" && b.type === "team") {
						// For teams: sort by creation date (newest first)
						return b.createdAt.getTime() - a.createdAt.getTime();
					} else if (a.type === "scrim" && b.type === "scrim") {
						// For scrims: sort by start time (earliest first)
						return a.startTime.getTime() - b.startTime.getTime();
					} else {
						// Mixed types: sort by type order (player, team, scrim)
						const typeOrder = { player: 0, team: 1, scrim: 2 };
						return typeOrder[a.type] - typeOrder[b.type];
					}
				});

				// Apply final pagination to combined results
				const paginatedResults = results.slice(offset, offset + limit);
				const total = results.length;
				const hasMore = offset + limit < total;

				const response = {
					results: paginatedResults,
					total,
					hasMore,
				};

				// Cache the results for future requests
				await SearchCacheService.set(input, response);

				const executionTimeMs = timer.getElapsedMs();

				// Log telemetry for database query
				SearchTelemetryService.logSearchQuery(
					input,
					response,
					executionTimeMs,
					cacheHit,
					ctx.session?.user?.id,
					undefined,
				);

				// Record analytics
				SearchAnalytics.recordSearch({
					timestamp: new Date().toISOString(),
					searchTerm: input.term,
					typeFilter: input.type,
					limit: input.limit,
					offset: input.offset,
					resultsCount: response.results.length,
					totalResults: response.total,
					executionTimeMs,
					cacheHit,
					userId: ctx.session?.user?.id,
					sessionId: undefined,
				});

				return response;
			} catch (error) {
				const executionTimeMs = timer.getElapsedMs();

				// Log error telemetry
				SearchTelemetryService.logSearchError(
					input,
					error as Error,
					executionTimeMs,
					ctx.session?.user?.id,
					undefined,
				);

				throw error;
			}
		}),
});
