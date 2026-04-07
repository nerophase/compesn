import { DraftHistoryByUserSchema } from "./draft-history.schema";
import { eq, or, desc } from "drizzle-orm";
import { draftMembers, scrimDrafts, scrims, teams } from "@compesn/shared/common/schemas";
import { baseProcedure, createTRPCRouter, authenticatedProcedure } from "@/trpc/init";
import { db } from "@/lib/database/db";
import { z } from "zod";

// Schema for byTeam query
const DraftHistoryByTeamSchema = z.object({
	teamId: z.string().uuid(),
	limit: z.number().min(1).max(50).default(20),
	offset: z.number().min(0).default(0),
});

export const draftHistoryRouter = createTRPCRouter({
	byUser: baseProcedure.input(DraftHistoryByUserSchema).query(async ({ input }) => {
		const draftsHistory = await db.query.draftsHistory.findMany({
			with: {
				members: { where: eq(draftMembers.userId, input.userId) },
			},
		});
		const grouped: { roomId: string; drafts: any[] }[] = [];
		for (const draft of draftsHistory) {
			const existing = grouped.find((e) => e.roomId === draft.roomId);
			if (existing) existing.drafts.push(draft);
			else grouped.push({ roomId: draft.roomId, drafts: [draft] });
		}
		return grouped;
	}),

	// Get draft history for a specific team
	byTeam: authenticatedProcedure.input(DraftHistoryByTeamSchema).query(async ({ input }) => {
		const { teamId, limit, offset } = input;

		// Query scrim drafts where the team participated
		const teamDrafts = await db.query.scrimDrafts.findMany({
			where: or(eq(scrimDrafts.blueTeamId, teamId), eq(scrimDrafts.redTeamId, teamId)),
			with: {
				scrim: {
					with: {
						creatingTeam: true,
						opponentTeam: true,
					},
				},
				blueTeam: true,
				redTeam: true,
			},
			orderBy: [desc(scrimDrafts.createdAt)],
			limit,
			offset,
		});

		// Transform the data to include team perspective info
		return teamDrafts.map((draft) => {
			const isBlueTeam = draft.blueTeamId === teamId;
			const opponentTeam = isBlueTeam ? draft.redTeam : draft.blueTeam;
			const teamPicks = isBlueTeam ? draft.bluePicks : draft.redPicks;
			const teamBans = isBlueTeam ? draft.blueBans : draft.redBans;
			const opponentPicks = isBlueTeam ? draft.redPicks : draft.bluePicks;
			const opponentBans = isBlueTeam ? draft.redBans : draft.blueBans;

			return {
				id: draft.id,
				scrimId: draft.scrimId,
				status: draft.status,
				createdAt: draft.createdAt,
				scrim: draft.scrim,
				isBlueTeam,
				teamPicks,
				teamBans,
				opponentPicks,
				opponentBans,
				opponentTeam,
				blueTeam: draft.blueTeam,
				redTeam: draft.redTeam,
			};
		});
	}),
});
