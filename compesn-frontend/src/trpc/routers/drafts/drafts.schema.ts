import { z } from "zod";

// Draft status enum
export const DraftStatusSchema = z.enum(["PENDING", "ACTIVE", "COMPLETED", "EXPIRED"]);

// Draft turn enum
export const DraftTurnSchema = z.enum([
	"BLUE_BAN_1",
	"RED_BAN_1",
	"BLUE_BAN_2",
	"RED_BAN_2",
	"BLUE_BAN_3",
	"RED_BAN_3",
	"BLUE_PICK_1",
	"RED_PICK_1",
	"RED_PICK_2",
	"BLUE_PICK_2",
	"BLUE_PICK_3",
	"RED_PICK_3",
	"RED_BAN_4",
	"BLUE_BAN_4",
	"RED_BAN_5",
	"BLUE_BAN_5",
	"RED_PICK_4",
	"BLUE_PICK_4",
	"BLUE_PICK_5",
	"RED_PICK_5",
]);

// Draft action type enum
export const DraftActionTypeSchema = z.enum(["PICK", "BAN"]);

// Schema for getting a draft by ID
export const DraftByIdSchema = z.object({
	draftId: z.string().uuid(),
});

// Schema for making a draft action
export const DraftMakeActionSchema = z.object({
	draftId: z.string().uuid(),
	actionType: DraftActionTypeSchema,
	championId: z.number().int().positive(),
});

// Schema for initializing a draft for a scrim
export const DraftInitializeSchema = z.object({
	scrimId: z.string().uuid(),
});

// Schema for draft state output
export const DraftStateSchema = z.object({
	id: z.string().uuid(),
	scrimId: z.string().uuid(),
	blueTeamId: z.string().uuid(),
	redTeamId: z.string().uuid(),
	status: DraftStatusSchema,
	bluePicks: z.array(z.number()),
	redPicks: z.array(z.number()),
	blueBans: z.array(z.number()),
	redBans: z.array(z.number()),
	currentTurn: DraftTurnSchema,
	turnStartAt: z.date().nullable(),
	expiresAt: z.date(),
	blueRoster: z.array(z.string()),
	redRoster: z.array(z.string()),
	createdAt: z.date(),
	updatedAt: z.date(),
});

// Extended draft state with team information
export const DraftWithTeamsSchema = DraftStateSchema.extend({
	scrim: z.object({
		id: z.string().uuid(),
		startTime: z.date(),
		durationMinutes: z.number(),
		bestOf: z.number(),
	}),
	blueTeam: z.object({
		id: z.string().uuid(),
		name: z.string(),
		tag: z.string(),
		members: z.array(
			z.object({
				id: z.string().uuid(),
				role: z.enum(["TOP", "JUNGLE", "MID", "BOT", "SUPPORT", "SUB", "COACH"]),
				user: z.object({
					id: z.string().uuid(),
					username: z.string(),
					riotAccount: z
						.object({
							puuid: z.string(),
							gameName: z.string(),
							tagLine: z.string(),
						})
						.nullable(),
				}),
			}),
		),
	}),
	redTeam: z.object({
		id: z.string().uuid(),
		name: z.string(),
		tag: z.string(),
		members: z.array(
			z.object({
				id: z.string().uuid(),
				role: z.enum(["TOP", "JUNGLE", "MID", "BOT", "SUPPORT", "SUB", "COACH"]),
				user: z.object({
					id: z.string().uuid(),
					username: z.string(),
					riotAccount: z
						.object({
							puuid: z.string(),
							gameName: z.string(),
							tagLine: z.string(),
						})
						.nullable(),
				}),
			}),
		),
	}),
});

// Helper function to get the next turn in the draft sequence
export const getNextTurn = (currentTurn: string): string | null => {
	const turnOrder = [
		"BLUE_BAN_1",
		"RED_BAN_1",
		"BLUE_BAN_2",
		"RED_BAN_2",
		"BLUE_BAN_3",
		"RED_BAN_3",
		"BLUE_PICK_1",
		"RED_PICK_1",
		"RED_PICK_2",
		"BLUE_PICK_2",
		"BLUE_PICK_3",
		"RED_PICK_3",
		"RED_BAN_4",
		"BLUE_BAN_4",
		"RED_BAN_5",
		"BLUE_BAN_5",
		"RED_PICK_4",
		"BLUE_PICK_4",
		"BLUE_PICK_5",
		"RED_PICK_5",
	];

	const currentIndex = turnOrder.indexOf(currentTurn);
	if (currentIndex === -1 || currentIndex === turnOrder.length - 1) {
		return null; // Invalid turn or draft complete
	}

	return turnOrder[currentIndex + 1];
};

// Helper function to determine which team's turn it is
export const getTeamFromTurn = (turn: string): "BLUE" | "RED" => {
	return turn.startsWith("BLUE_") ? "BLUE" : "RED";
};

// Helper function to determine if a turn is a pick or ban
export const getActionFromTurn = (turn: string): "PICK" | "BAN" => {
	return turn.includes("_PICK_") ? "PICK" : "BAN";
};
