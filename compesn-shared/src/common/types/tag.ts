import { z } from "zod";
export const ETag = z.enum(["All", "Assassin", "Fighter", "Mage", "Marksman", "Support", "Tank"]);
export type TTag = z.infer<typeof ETag>;
