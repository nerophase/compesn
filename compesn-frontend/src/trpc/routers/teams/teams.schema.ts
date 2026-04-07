import { z } from "zod";

// Team member roles enum
export const TeamMemberRoleSchema = z.enum([
	"TOP",
	"JUNGLE",
	"MID",
	"BOT",
	"SUPPORT",
	"SUB",
	"COACH",
]);

// Invite status enum
export const InviteStatusSchema = z.enum(["PENDING", "ACCEPTED", "DECLINED", "EXPIRED"]);

// Regions enum
export const RegionsSchema = z.enum([
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

export type TRegion = typeof RegionsSchema._type;

// Ranks enum
export const RanksSchema = z.enum([
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
	"UNRANKED",
]);

// Activity Level enum
export const ActivityLevelSchema = z.enum(["CASUAL", "REGULAR", "COMPETITIVE", "HARDCORE"]);

export type TActivityLevel = typeof ActivityLevelSchema._type;

// Current Rank enum
export const CurrentRankSchema = z.enum([
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
	"UNRANKED",
]);

export type TCurrentRank = typeof CurrentRankSchema._type;

// Team management schemas
export const TeamCreateSchema = z.object({
	name: z
		.string()
		.min(3, "Team name must be at least 3 characters")
		.max(24, "Team name must be at most 24 characters"),
	tag: z
		.string()
		.min(2, "Team tag must be at least 2 characters")
		.max(5, "Team tag must be at most 5 characters")
		.regex(/^[A-Z0-9]+$/, "Team tag must contain only uppercase letters and numbers"),
	region: RegionsSchema.optional(),
	currentRank: CurrentRankSchema.optional(),
	activityLevel: ActivityLevelSchema.optional(),
});

export const TeamUpdateSchema = z.object({
	teamId: z.string().uuid(),
	name: z
		.string()
		.min(3, "Team name must be at least 3 characters")
		.max(24, "Team name must be at most 24 characters")
		.optional(),
	tag: z
		.string()
		.min(2, "Team tag must be at least 2 characters")
		.max(5, "Team tag must be at most 5 characters")
		.regex(/^[A-Z0-9]+$/, "Team tag must contain only uppercase letters and numbers")
		.optional(),
	region: RegionsSchema.optional(),
	currentRank: CurrentRankSchema.optional(),
	activityLevel: ActivityLevelSchema.optional(),
});

export const TeamTransferOwnershipSchema = z.object({
	teamId: z.string().uuid(),
	newOwnerId: z.string().uuid(),
});

export const TeamDeleteSchema = z.object({
	teamId: z.string().uuid(),
});

export const TeamByIdSchema = z.object({
	teamId: z.string().uuid(),
});

// Team listing schema
export const TeamListSchema = z.object({
	// Search filters
	search: z.string().optional(), // Search by team name
	region: RegionsSchema.optional(),

	// Pagination
	limit: z.number().min(1).max(100).default(20),
	offset: z.number().min(0).default(0),
});

// Enhanced team directory schema with advanced filtering
export const TeamDirectorySchema = z.object({
	// Search filters
	name: z.string().optional(), // Search by team name (substring)
	ranks: z.array(RanksSchema).optional(),
	regions: z.array(RegionsSchema).optional(),
	activityLevels: z.array(z.enum(["CASUAL", "REGULAR", "COMPETITIVE", "HARDCORE"])).optional(),
	memberCount: z.enum(["full", "recruiting", "new"]).optional(), // full = 5/5, recruiting = 1-4/5, new = 1/5

	// Sorting
	sortBy: z
		.enum(["name_asc", "name_desc", "rank_desc", "rank_asc", "activity", "members"])
		.default("activity"),

	// Pagination
	page: z.number().min(1).default(1),
	limit: z.number().min(1).max(48).default(12),
});

// Team scrim history schema
export const TeamScrimHistorySchema = z.object({
	teamId: z.string().uuid(),
	page: z.number().min(1).default(1),
	limit: z.number().min(1).max(50).default(10),
});

// Team upcoming scrims schema
export const TeamUpcomingScrimsSchema = z.object({
	teamId: z.string().uuid(),
});

// Team availability schema
export const TeamAvailabilitySchema = z.object({
	teamId: z.string().uuid(),
});

// Roster management schemas
export const InvitePlayerSchema = z.object({
	teamId: z.string().uuid(),
	userId: z.string().uuid(),
	role: TeamMemberRoleSchema,
});

export const RespondToInviteSchema = z.object({
	inviteId: z.string().uuid(),
	response: z.enum(["ACCEPT", "DECLINE"]),
});

export const RemovePlayerSchema = z.object({
	teamId: z.string().uuid(),
	userId: z.string().uuid(),
});

export const UpdateMemberRoleSchema = z.object({
	teamId: z.string().uuid(),
	userId: z.string().uuid(),
	role: TeamMemberRoleSchema,
});

export const RescindInviteSchema = z.object({
	inviteId: z.string().uuid(),
});

// Legacy schemas for backward compatibility
export const TeamRegisterSchema = z.object({ teamName: z.string() });
export const TeamLeaveSchema = z.object({ teamId: z.string() });
export const TeamKickPlayerSchema = z.object({
	teamId: z.string(),
	playerId: z.string(),
});
export const TeamPromotePlayerSchema = z.object({
	teamId: z.string(),
	playerId: z.string(),
	promote: z.boolean(),
});
export const TeamAddPlayerSchema = z.object({
	teamId: z.string(),
	playerName: z.string(),
	confirmUrl: z.string().url(),
});
export const TeamConfirmJoinSchema = z.object({ teamId: z.string() });
export const TeamCancelInvitationSchema = z.object({
	teamId: z.string(),
	playerId: z.string(),
});
