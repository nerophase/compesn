import { EDraftMode } from "@compesn/shared/types/draft-mode";
import { ERole } from "@compesn/shared/types/role";
import { ETag } from "@compesn/shared/types/tag";
import { EPickType } from "@compesn/shared/types/tournament";
import { z } from "zod";

export const RoomIdSchema = z.object({ roomId: z.string() });

export const ChampionSchema = z.object({
	name: z.string(),
	fileName: z.string(),
	roles: z.array(ERole),
	tags: z.array(ETag),
});

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
