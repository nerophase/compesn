import { z } from "zod";
export const EUserRole = z.enum(["admin", "player"]);
export type TUserRole = z.infer<typeof EUserRole>;
