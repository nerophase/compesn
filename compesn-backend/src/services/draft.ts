// import { db } from "database";
// import { drafts, TDraftInsert } from "database/schemas";
// import { eq } from "drizzle-orm";

// type TCreateDraftProps = {
// 	blue: {
// 		id: string;
// 		name: string;
// 		isGuest: boolean;
// 	};
// 	red: {
// 		id: string;
// 		name: string;
// 		isGuest: boolean;
// 	};
// 	tournamentCode: string;
// 	roomId: string;
// 	draftNumberInRoom: number;
// };

// export const createDraft = async ({
// 	roomId,
// 	draftNumberInRoom,
// 	tournamentCode,
// 	blue,
// 	red,
// }: TCreateDraftProps) => {
// 	return await db
// 		.insert(drafts)
// 		.values({
// 			blue: {
// 				id: blue.id,
// 				name: blue.name,
// 				isGuest: blue.isGuest,
// 				pick: [],
// 				ban: [],
// 				ready: false,
// 			},
// 			red: {
// 				id: red.id,
// 				name: red.name,
// 				isGuest: red.isGuest,
// 				pick: [],
// 				ban: [],
// 				ready: false,
// 			},
// 			roomId,
// 			draftIndex: draftNumberInRoom,
// 			state: "waiting",
// 			turnStart: 0,
// 			currentTurnTime: 0,
// 			canRepeatPreviousTurn: false,
// 			tournamentCode: tournamentCode ?? "",
// 		})
// 		.returning();
// };

// export const getDraftById = async (draftId: string) => {
// 	return await db.query.drafts.findFirst({ where: eq(drafts.id, draftId) });
// };

// export const updateDraft = async (draftId: string, draftData: TDraftInsert) => {
// 	return await db.update(drafts).set(draftData).where(eq(drafts.id, draftId));
// };
