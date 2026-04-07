import { z } from "zod";
export const ETeamColor = z.enum(["blue", "red"]);
export type TTeamColor = z.infer<typeof ETeamColor>;
