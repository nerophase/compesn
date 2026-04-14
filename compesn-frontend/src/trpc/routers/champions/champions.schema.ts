import { ChampionSchema } from "@compesn/shared/types/champion";
import { z } from "zod";

export const ChampionGetSchema = z.object({
	championFileName: z.string(),
});

export const ChampionUpdateSchema = z.object({
	championFileName: z.string(),
	champion: ChampionSchema,
});

export const ChampionDeleteSchema = z.object({
	championFileName: z.string(),
});

export const ChampionAddSchema = z.object({
	champion: ChampionSchema,
});

export const ChampionSetSchema = z.object({
	champions: z.array(ChampionSchema),
});

export const ChampionImgSchema = z.object({
	champion: z.string(),
	imgUrl: z.string(),
	nameEnd: z.string(),
	updateImg: z.boolean(),
});

export const ChampionLargeImgSchema = z.object({
	champion: z.string(),
	updateImg: z.boolean().optional().default(false),
});

export const ChampionShortImgSchema = z.object({
	champion: z.string(),
	apiVersion: z.string(),
	updateImg: z.boolean().optional().default(false),
});
