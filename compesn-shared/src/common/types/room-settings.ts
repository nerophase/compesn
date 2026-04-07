import { z } from "zod";
import { EDraftMode } from "./draft-mode";
import { EPickType } from "./tournament";
import { ChampionSchema } from "./champion";

export const RoomSettingsSchema = z.object({
	draftMode: EDraftMode,
	numberOfDrafts: z.number().min(1).max(5),
	disabledTurns: z.array(z.number()),
	disabledChampions: z.array(ChampionSchema),
	timePerPick: z.number(),
	timePerBan: z.number(),
	pickType: EPickType,
	blueTeamName: z.string(),
	blueTeamIsGuest: z.boolean(),
	redTeamName: z.string(),
	redTeamIsGuest: z.boolean(),
	creatorId: z.string(),
});

export type TRoomSettings = z.infer<typeof RoomSettingsSchema>;
