import { z } from "zod";

// Scrim status enum
export const ScrimStatusSchema = z.enum([
	"OPEN",
	"REQUESTED",
	"ACCEPTED",
	"CONFIRMED",
	"CANCELLED",
	"COMPLETED",
]);

// Rank tier and division enums
export const RankTierSchema = z.enum([
	"IRON",
	"BRONZE",
	"SILVER",
	"GOLD",
	"PLATINUM",
	"EMERALD",
	"DIAMOND",
	"MASTER",
	"GRANDMASTER",
	"CHALLENGER",
]);
export const RankDivisionSchema = z.enum(["I", "II", "III", "IV"]);

// Team roles enum (matching existing team member roles)
export const TeamRoleSchema = z.enum(["TOP", "JUNGLE", "MID", "BOT", "SUPPORT", "SUB", "COACH"]);

// Region enum (matching regions.ts)
export const RegionSchema = z.enum([
	"br",
	"eune",
	"euw",
	"jp",
	"lan",
	"las",
	"na",
	"oce",
	"kr",
	"ru",
	"tr",
	"me",
	"ph",
	"sg",
	"th",
	"tw",
	"vn",
	"pbe",
]);

// Scrim creation schema
export const ScrimCreateSchema = z.object({
	startTime: z.date().refine((date) => date > new Date(), {
		message: "Start time must be in the future",
	}),
	durationMinutes: z
		.number()
		.min(30, "Duration must be at least 30 minutes")
		.max(300, "Duration cannot exceed 5 hours")
		.default(60),
	bestOf: z.number().min(1).max(5).default(1),
	minRankTier: RankTierSchema.optional(),
	minRankDivision: RankDivisionSchema.optional(),
	maxRankTier: RankTierSchema.optional(),
	maxRankDivision: RankDivisionSchema.optional(),
	notes: z.string().max(500, "Notes cannot exceed 500 characters").optional(),
	commsLink: z.string().url("Invalid communication link").optional(),
	rolesNeeded: z.array(TeamRoleSchema).optional(),
});

// Scrim list filtering schema
export const ScrimListSchema = z.object({
	// Team name filter
	teamName: z.string().optional(),

	// Date/time filters
	startDate: z.date().optional(),
	endDate: z.date().optional(),
	startTimeFrom: z.string().optional(), // HH:MM format
	startTimeTo: z.string().optional(), // HH:MM format

	// Rank filters
	minRankTier: RankTierSchema.optional(),
	minRankDivision: RankDivisionSchema.optional(),
	maxRankTier: RankTierSchema.optional(),
	maxRankDivision: RankDivisionSchema.optional(),

	// Region filter
	regions: z.array(RegionSchema).optional(),

	// Role filters
	rolesNeeded: z.array(TeamRoleSchema).optional(),

	// Status filter
	status: z.array(ScrimStatusSchema).optional(),

	// Pagination
	limit: z.number().min(1).max(100).default(20),
	offset: z.number().min(0).default(0),
});

// Scrim by ID schema
export const ScrimByIdSchema = z.object({
	scrimId: z.string().uuid(),
});

// Scrim status update schema
export const ScrimUpdateStatusSchema = z.object({
	scrimId: z.string().uuid(),
	status: ScrimStatusSchema,
	opponentTeamId: z.string().uuid().optional(), // Required when moving to REQUESTED
});

// Scrim request schema (for requesting to join an open scrim)
export const ScrimRequestSchema = z.object({
	scrimId: z.string().uuid(),
	teamId: z.string().uuid(),
});

// Scrim cancel schema
export const ScrimCancelSchema = z.object({
	scrimId: z.string().uuid(),
	reason: z.string().max(200, "Cancellation reason cannot exceed 200 characters").optional(),
});

// Scrim request cancellation schema
export const ScrimCancelRequestSchema = z.object({
	scrimId: z.string().uuid(),
});

// Scrim list by team ID schema
export const ScrimListByTeamIdSchema = z.object({
	teamId: z.string().uuid(),
	limit: z.number().min(1).max(100).default(20),
	offset: z.number().min(0).default(0),
});

// Scrim participant schema for match results
export const ScrimParticipantSchema = z.object({
	userId: z.string().uuid(),
	teamId: z.string().uuid(),
	championId: z.number().min(1).max(1000),
	role: z.enum(["TOP", "JUNGLE", "MID", "BOT", "SUPPORT"]),
	kills: z.number().min(0).default(0),
	deaths: z.number().min(0).default(0),
	assists: z.number().min(0).default(0),
	totalCreepScore: z.number().min(0).default(0),
	goldEarned: z.number().min(0).default(0),
	visionScore: z.number().min(0).default(0),
	csAt10Minutes: z.number().min(0).default(0),
	totalDamageDealtToChampions: z.number().min(0).default(0),
	totalDamageTaken: z.number().min(0).default(0),
});

// Scrim completion schema (for recording match results)
export const ScrimCompleteSchema = z.object({
	scrimId: z.string().uuid(),
	winningTeamId: z.string().uuid(),
	matchDurationSeconds: z.number().min(0),
	participants: z.array(ScrimParticipantSchema).min(2).max(10),
});

// Scrim list by user ID schema
export const ScrimListByUserIdSchema = z.object({
	userId: z.string().uuid(),
	limit: z.number().min(1).max(100).default(20),
	offset: z.number().min(0).default(0),
});

// Enhanced scrim listings schema for Scrims Hub
export const ScrimListingsSchema = z.object({
	// Date range filter
	startDate: z.date().optional(),
	endDate: z.date().optional(),

	// Rank filters
	minRankTier: RankTierSchema.optional(),
	maxRankTier: RankTierSchema.optional(),

	// Region filter
	regions: z.array(RegionSchema).optional(),

	// Status filter (default to OPEN for hub)
	status: z.array(ScrimStatusSchema).default(["OPEN"]),

	// Pagination
	limit: z.number().min(1).max(50).default(20),
	offset: z.number().min(0).default(0),
});

// Live queue schema for teams actively looking for scrims
export const ScrimQueueSchema = z.object({
	// Rank filters
	minRankTier: RankTierSchema.optional(),
	maxRankTier: RankTierSchema.optional(),

	// Region filter
	regions: z.array(RegionSchema).optional(),

	// Limit (no offset for live queue)
	limit: z.number().min(1).max(50).default(50),
});

// Helper function to convert rank tier to numeric value for comparison
export const getRankTierValue = (tier: string): number => {
	const tierValues: Record<string, number> = {
		IRON: 1,
		BRONZE: 2,
		SILVER: 3,
		GOLD: 4,
		PLATINUM: 5,
		EMERALD: 6,
		DIAMOND: 7,
		MASTER: 8,
		GRANDMASTER: 9,
		CHALLENGER: 10,
	};
	return tierValues[tier] || 0;
};

// Helper function to convert rank division to numeric value for comparison
export const getRankDivisionValue = (division: string): number => {
	const divisionValues: Record<string, number> = {
		IV: 1,
		III: 2,
		II: 3,
		I: 4,
	};
	return divisionValues[division] || 0;
};
