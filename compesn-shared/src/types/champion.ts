import { ERole, TRole } from "./role";
import { ETag, TTag } from "./tag";
import { z } from "zod";

export const ChampionSchema = z.object({
	name: z.string(),
	fileName: z.string(),
	roles: z.array(ERole),
	tags: z.array(ETag),
});

export type TChampion = {
	name: string;
	fileName: string;
	roles: TRole[];
	tags: TTag[];
};
