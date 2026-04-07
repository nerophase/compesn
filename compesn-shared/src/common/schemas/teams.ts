import {
	pgTable,
	text,
	uuid,
	primaryKey,
	boolean,
	varchar,
	timestamp,
	pgEnum,
	unique,
} from "drizzle-orm/pg-core";
import { timestamps } from "./timestamps";
import { users } from "./users";

// Define enums for team member roles and invite statuses
export const teamMemberRoleEnum = pgEnum("team_member_role", [
	"TOP",
	"JUNGLE",
	"MID",
	"BOT",
	"SUPPORT",
	"SUB",
	"COACH",
]);

export const inviteStatusEnum = pgEnum("invite_status", [
	"PENDING",
	"ACCEPTED",
	"DECLINED",
	"EXPIRED",
]);

export const regionEnum = pgEnum("region", [
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

export const rankEnum = pgEnum("rank", [
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

export const activityLevelEnum = pgEnum("activity_level", [
	"CASUAL",
	"REGULAR",
	"COMPETITIVE",
	"HARDCORE",
]);

export const teams = pgTable("teams", {
	id: uuid("id").defaultRandom().primaryKey(),
	name: varchar("name", { length: 255 }).unique().notNull(),
	tag: varchar("tag", { length: 5 }).unique().notNull(),
	logoUrl: text("logo_url"),
	region: regionEnum("region").default("na").notNull(),
	currentRank: rankEnum("current_rank").default("UNRANKED"),
	activityLevel: activityLevelEnum("activity_level").default("REGULAR"),
	lastActiveAt: timestamp("last_active_at"),
	ownerId: uuid("owner_id")
		.notNull()
		.references(() => users.id, { onDelete: "cascade" }),
	// Full-text search vector for team name and tag (name weighted higher)
	searchVector: text("search_vector").$type<unknown>(),
	...timestamps,
});

export type TTeam = typeof teams.$inferSelect;
export type TTeamInsert = typeof teams.$inferInsert;

// Updated team_members table with proper role constraints
export const teamMembers = pgTable(
	"team_members",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		teamId: uuid("team_id")
			.notNull()
			.references(() => teams.id, { onDelete: "cascade" }),
		userId: uuid("user_id")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		role: teamMemberRoleEnum("role").notNull(),
		joinedAt: timestamp("joined_at")
			.notNull()
			.$defaultFn(() => new Date()),
	},
	(t) => [
		unique().on(t.teamId, t.userId), // Ensure user can only be on team once
	],
);

export type TTeamMember = typeof teamMembers.$inferSelect;
export type TTeamMemberInsert = typeof teamMembers.$inferInsert;

// New team_invites table
export const teamInvites = pgTable(
	"team_invites",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		teamId: uuid("team_id")
			.notNull()
			.references(() => teams.id, { onDelete: "cascade" }),
		inviterId: uuid("inviter_id")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		invitedUserId: uuid("invited_user_id")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		role: teamMemberRoleEnum("role").notNull(),
		status: inviteStatusEnum("status").default("PENDING").notNull(),
		expiresAt: timestamp("expires_at")
			.notNull()
			.$defaultFn(() => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)), // 7 days from creation
		...timestamps,
	},
	(t) => [unique().on(t.teamId, t.invitedUserId)],
);

export type TTeamInvite = typeof teamInvites.$inferSelect;
export type TTeamInviteInsert = typeof teamInvites.$inferInsert;

// Keep the old table for backward compatibility during migration
export const usersToTeams = pgTable(
	"users_to_teams",
	{
		userId: uuid("user_id")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		teamId: uuid("team_id")
			.notNull()
			.references(() => teams.id, { onDelete: "cascade" }),
		userIsPendingConfirmation: boolean("user_is_pending_confirmation").notNull(),
	},
	(t) => [primaryKey({ columns: [t.userId, t.teamId] })],
);
