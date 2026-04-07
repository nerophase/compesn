import { REGIONS } from "@/constants/regions";

export const RANK_TIERS = [
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
] as const;

// Align with backend enum: CASUAL | REGULAR | COMPETITIVE | HARDCORE
export const ACTIVITY_LEVELS = ["CASUAL", "REGULAR", "COMPETITIVE", "HARDCORE"] as const;

export const SORT_OPTIONS = [
	{ value: "name_asc", label: "Name (A-Z)" },
	{ value: "name_desc", label: "Name (Z-A)" },
	{ value: "rank_desc", label: "Rank (High to Low)" },
	{ value: "rank_asc", label: "Rank (Low to High)" },
	{ value: "activity", label: "Recent Activity" },
	{ value: "members", label: "Member Count" },
] as const;

export type RankTier = (typeof RANK_TIERS)[number];
export type RegionCode = (typeof REGIONS)[number]["value"];
export type ActivityLevel = (typeof ACTIVITY_LEVELS)[number];
export type MemberCountFilter = "" | "full" | "recruiting" | "new";
export type SortBy = (typeof SORT_OPTIONS)[number]["value"];

export type TeamCard = {
	id: string;
	name: string;
	tag: string;
	logoUrl?: string | null;
	currentRank?: string | null;
	region?: string | null;
	activityLevel: string;
	lastActiveAt?: string | Date | null;
	createdAt?: string | Date | null;
	memberCount: number;
	isMember: boolean;
	isInvited: boolean;
};

export type TeamsDirectoryResult = {
	teams: TeamCard[];
	total: number;
	totalPages: number;
	currentPage: number;
	hasNextPage: boolean;
	hasPreviousPage: boolean;
};
