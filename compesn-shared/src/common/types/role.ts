import { z } from "zod";
export const ERole = z.enum(["top", "mid", "bottom", "jungle", "support"]);
export type TRole = z.infer<typeof ERole>;
