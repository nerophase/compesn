import { z } from "zod";
export const ETurnType = z.enum(["ban", "pick"]);
export type TTurnType = z.infer<typeof ETurnType>;
