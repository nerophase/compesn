import { z } from "zod";
export const EState = z.enum([
	"waiting",
	"ongoing",
	"time-over",
	"requested-repeat-prev-turn",
	"finished",
]);
export type TDraftState = z.infer<typeof EState>;
