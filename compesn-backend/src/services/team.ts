import { db } from "@/database";
import { teams, TTeamInsert, usersToTeams } from "@compesn/shared/common/schemas";
import { and, asc, eq, exists } from "drizzle-orm";

const getTeamById = async (teamId: string) => {
	return await db.query.teams.findFirst({
		where: eq(teams.id, teamId),
		with: { usersToTeams: { with: { user: true } } },
	});
};

const getTeamByName = async (teamName: string) => {
	return await db.query.teams.findFirst({
		where: eq(teams.name, teamName),
		with: { usersToTeams: { with: { user: true } } },
	});
};

const getTeams = async () => {
	return await db.query.teams.findMany({
		with: { usersToTeams: { with: { user: true } } },
	});
};

const createTeam = async (team: TTeamInsert) => {
	return await db.insert(teams).values(team).returning();
};

const updateTeam = async (teamId: string, team: TTeamInsert) => {
	return await db.update(teams).set(team).where(eq(teams.id, teamId));
};

const deleteTeam = async (teamId: string) => {
	return await db.delete(teams).where(eq(teams.id, teamId));
};

const getUserTeams = async (userId: string) => {
	return await db.query.teams.findMany({
		where: exists(
			db
				.select()
				.from(usersToTeams)
				.where(and(eq(usersToTeams.teamId, teams.id), eq(usersToTeams.userId, userId))),
		),
		with: {
			usersToTeams: {
				with: {
					user: true,
				},
			},
		},
		orderBy: asc(teams.name),
	});
};

const getUserInviteTeams = async (userId: string) => {
	return await db.query.teams.findMany({
		with: {
			usersToTeams: {
				where: and(
					eq(usersToTeams.userId, userId),
					eq(usersToTeams.userIsPendingConfirmation, true),
				),
			},
		},
	});
};

export const teamService = {
	getTeamById,
	getTeamByName,
	getTeams,
	createTeam,
	updateTeam,
	deleteTeam,
	getUserTeams,
	getUserInviteTeams,
};
