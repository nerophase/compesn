import { TDraft } from "./draft";
import { TDraftMode } from "./draft-mode";
import { TRoomMember } from "./room-member";
import { TRoomTime } from "./room-time";
import { TPickType } from "./tournament";
import { TChampion } from "./champion";

export type TRoom = {
	id: string;
	pickType: TPickType;
	draftMode: TDraftMode;
	draftsCount: number;
	members: TRoomMember[];
	drafts: TDraft[];
	currentDraft: number;
	disabledTurns: number[];
	disabledChampions: TChampion[];
	time: TRoomTime;
	tournamentId: number;
	tournamentCodes: string[];
};
