import { z } from "zod";

export const DraftHistoryByUserSchema = z.object({
	userId: z.string(),
});
