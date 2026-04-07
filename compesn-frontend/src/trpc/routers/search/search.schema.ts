import { z } from "zod";

// Input schema for search query
export const searchQuerySchema = z.object({
	term: z.string().min(3, "Search term must be at least 3 characters"),
	type: z.enum(["player", "team", "scrim"]).optional(),
	limit: z.number().min(1).max(50).default(20),
	offset: z.number().min(0).default(0),
});

export type SearchQueryInput = z.infer<typeof searchQuerySchema>;

// Output schemas for each entity type
export const playerResultSchema = z.object({
	type: z.literal("player"),
	id: z.string(),
	name: z.string(),
	riotGameName: z.string().nullable(),
	riotTagLine: z.string().nullable(),
	region: z.string().nullable(),
	image: z.string().nullable(),
	rank: z.number(), // ts_rank score
});

export const teamResultSchema = z.object({
	type: z.literal("team"),
	id: z.string(),
	name: z.string(),
	tag: z.string(),
	region: z.string(),
	ownerId: z.string(),
	createdAt: z.date(),
	rank: z.number(), // ts_rank score
});

export const scrimResultSchema = z.object({
	type: z.literal("scrim"),
	id: z.string(),
	title: z.string().nullable(),
	notes: z.string().nullable(),
	status: z.enum(["OPEN", "REQUESTED", "ACCEPTED", "CONFIRMED", "CANCELLED", "COMPLETED"]),
	startTime: z.date(),
	creatingTeamId: z.string(),
	rank: z.number(), // ts_rank score
});

// Union type for search results
export const searchResultSchema = z.union([
	playerResultSchema,
	teamResultSchema,
	scrimResultSchema,
]);

// Output schema for search response
export const searchResponseSchema = z.object({
	results: z.array(searchResultSchema),
	total: z.number(),
	hasMore: z.boolean(),
});

export type SearchResult = z.infer<typeof searchResultSchema>;
export type SearchResponse = z.infer<typeof searchResponseSchema>;
