import { z } from "zod";
export const EDraftMode = z.enum(["standard", "fearless"]);
export type TDraftMode = z.infer<typeof EDraftMode>;
