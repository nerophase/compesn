import { accounts } from "./accounts";
import { conversations, conversationParticipants, messages } from "./conversations";
import { draftMembers } from "./draft-members";
import { draftsHistory } from "./drafts-history";
import { friendships } from "./friendships";
import { matchHistory } from "./match-history";
import { notifications } from "./notifications";
import { rankedStats } from "./ranked-stats";
import { regionChangeLogs } from "./region-change-logs";
import { riotAccounts } from "./riot-accounts";
import { scrims, scrimParticipants } from "./scrims";
import { scrimDrafts } from "./scrim-drafts";
import { summonerProfiles } from "./summoner-profiles";
import { teams, usersToTeams, teamMembers, teamInvites } from "./teams";
import { users } from "./users";
import { relations } from "drizzle-orm";

// Accounts
export const accountsRelations = relations(accounts, ({ one }) => ({
	user: one(users, { fields: [accounts.userId], references: [users.id] }),
}));

// Draft History
export const draftsHistoryRelations = relations(draftsHistory, ({ many }) => ({
	members: many(draftMembers),
}));

// Draft Members
export const draftMembersRelations = relations(draftMembers, ({ one }) => ({
	user: one(users, {
		fields: [draftMembers.userId],
		references: [users.id],
	}),
	draft: one(draftsHistory, {
		fields: [draftMembers.draftHistoryId],
		references: [draftsHistory.id],
	}),
}));

// Teams
export const teamsRelations = relations(teams, ({ one, many }) => ({
	owner: one(users, {
		fields: [teams.ownerId],
		references: [users.id],
	}),
	members: many(teamMembers),
	invites: many(teamInvites),
	usersToTeams: many(usersToTeams), // Keep for backward compatibility
	createdScrims: many(scrims, { relationName: "creatingTeam" }),
	opponentScrims: many(scrims, { relationName: "opponentTeam" }),
	wonScrims: many(scrims, { relationName: "winningTeam" }),
	scrimParticipants: many(scrimParticipants),
	blueDrafts: many(scrimDrafts, { relationName: "blueTeam" }),
	redDrafts: many(scrimDrafts, { relationName: "redTeam" }),
}));

export const teamMembersRelations = relations(teamMembers, ({ one }) => ({
	team: one(teams, {
		fields: [teamMembers.teamId],
		references: [teams.id],
	}),
	user: one(users, {
		fields: [teamMembers.userId],
		references: [users.id],
	}),
}));

export const teamInvitesRelations = relations(teamInvites, ({ one }) => ({
	team: one(teams, {
		fields: [teamInvites.teamId],
		references: [teams.id],
	}),
	inviter: one(users, {
		fields: [teamInvites.inviterId],
		references: [users.id],
		relationName: "inviter",
	}),
	invitedUser: one(users, {
		fields: [teamInvites.invitedUserId],
		references: [users.id],
		relationName: "invitedUser",
	}),
}));

export const usersToTeamsRelations = relations(usersToTeams, ({ one }) => ({
	team: one(teams, {
		fields: [usersToTeams.teamId],
		references: [teams.id],
	}),
	user: one(users, {
		fields: [usersToTeams.userId],
		references: [users.id],
	}),
}));

// Users
export const usersRelations = relations(users, ({ one, many }) => ({
	accounts: many(accounts),
	notifications: many(notifications),
	ownedTeams: many(teams),
	teamMemberships: many(teamMembers),
	sentInvites: many(teamInvites, { relationName: "inviter" }),
	receivedInvites: many(teamInvites, { relationName: "invitedUser" }),
	usersToTeams: many(usersToTeams), // Keep for backward compatibility
	regionChangeLogs: many(regionChangeLogs),
	riotAccount: one(riotAccounts),
	scrimParticipants: many(scrimParticipants),
}));

// Region Change Logs
export const regionChangeLogsRelations = relations(regionChangeLogs, ({ one }) => ({
	user: one(users, {
		fields: [regionChangeLogs.userId],
		references: [users.id],
	}),
}));

// Rooms
// export const roomsRelations = relations(rooms, ({ many }) => ({
// 	members: many(roomMembers),
// 	drafts: many(drafts),
// }));

// Room Members
// export const roomMembersRelations = relations(roomMembers, ({ one }) => ({
// 	user: one(users, {
// 		fields: [roomMembers.userId],
// 		references: [users.id],
// 	}),
// 	room: one(rooms, {
// 		fields: [roomMembers.roomId],
// 		references: [rooms.id],
// 	}),
// }));

// Riot Accounts
export const riotAccountsRelations = relations(riotAccounts, ({ one }) => ({
	user: one(users, {
		fields: [riotAccounts.userId],
		references: [users.id],
	}),
	summonerProfile: one(summonerProfiles),
}));

// Summoner Profiles
export const summonerProfilesRelations = relations(summonerProfiles, ({ one, many }) => ({
	riotAccount: one(riotAccounts, {
		fields: [summonerProfiles.puuid],
		references: [riotAccounts.puuid],
	}),
	rankedStats: many(rankedStats),
	matchHistory: many(matchHistory),
}));

// Ranked Stats
export const rankedStatsRelations = relations(rankedStats, ({ one }) => ({
	summonerProfile: one(summonerProfiles, {
		fields: [rankedStats.puuid],
		references: [summonerProfiles.puuid],
	}),
}));

// Match History
export const matchHistoryRelations = relations(matchHistory, ({ one }) => ({
	summonerProfile: one(summonerProfiles, {
		fields: [matchHistory.puuid],
		references: [summonerProfiles.puuid],
	}),
}));

// // Drafts
// export const draftsRelations = relations(drafts, ({ one, many }) => ({
// 	room: one(rooms, {
// 		fields: [drafts.roomId],
// 		references: [rooms.id],
// 	}),
// 	members: many(draftMembers),
// }));

// Scrims
export const scrimsRelations = relations(scrims, ({ one, many }) => ({
	creatingTeam: one(teams, {
		fields: [scrims.creatingTeamId],
		references: [teams.id],
		relationName: "creatingTeam",
	}),
	opponentTeam: one(teams, {
		fields: [scrims.opponentTeamId],
		references: [teams.id],
		relationName: "opponentTeam",
	}),
	winningTeam: one(teams, {
		fields: [scrims.winningTeamId],
		references: [teams.id],
		relationName: "winningTeam",
	}),
	participants: many(scrimParticipants),
	draft: one(scrimDrafts, {
		fields: [scrims.id],
		references: [scrimDrafts.scrimId],
	}),
}));

// Scrim Participants
export const scrimParticipantsRelations = relations(scrimParticipants, ({ one }) => ({
	scrim: one(scrims, {
		fields: [scrimParticipants.scrimId],
		references: [scrims.id],
	}),
	user: one(users, {
		fields: [scrimParticipants.userId],
		references: [users.id],
	}),
	team: one(teams, {
		fields: [scrimParticipants.teamId],
		references: [teams.id],
	}),
}));

// Scrim Drafts
export const scrimDraftsRelations = relations(scrimDrafts, ({ one }) => ({
	scrim: one(scrims, {
		fields: [scrimDrafts.scrimId],
		references: [scrims.id],
	}),
	blueTeam: one(teams, {
		fields: [scrimDrafts.blueTeamId],
		references: [teams.id],
		relationName: "blueTeam",
	}),
	redTeam: one(teams, {
		fields: [scrimDrafts.redTeamId],
		references: [teams.id],
		relationName: "redTeam",
	}),
}));

// Conversations relations
export const conversationsRelations = relations(conversations, ({ many, one }) => ({
	participants: many(conversationParticipants),
	messages: many(messages),
	primaryTeam: one(teams, {
		fields: [conversations.primaryTeamId],
		references: [teams.id],
		relationName: "conversationPrimaryTeam",
	}),
	secondaryTeam: one(teams, {
		fields: [conversations.secondaryTeamId],
		references: [teams.id],
		relationName: "conversationSecondaryTeam",
	}),
}));

export const conversationParticipantsRelations = relations(conversationParticipants, ({ one }) => ({
	conversation: one(conversations, {
		fields: [conversationParticipants.conversationId],
		references: [conversations.id],
	}),
	user: one(users, {
		fields: [conversationParticipants.userId],
		references: [users.id],
	}),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
	conversation: one(conversations, {
		fields: [messages.conversationId],
		references: [conversations.id],
	}),
	sender: one(users, {
		fields: [messages.senderId],
		references: [users.id],
	}),
}));

// Friendships relations
export const friendshipsRelations = relations(friendships, ({ one }) => ({
	requester: one(users, {
		fields: [friendships.requesterId],
		references: [users.id],
		relationName: "friendshipRequester",
	}),
	addressee: one(users, {
		fields: [friendships.addresseeId],
		references: [users.id],
		relationName: "friendshipAddressee",
	}),
}));
