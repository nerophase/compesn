import { TDraftTeam } from "./draft-team";
import { TDraftState } from "./state";
import { TTurn } from "./turn";

export type TDraft = {
	draftIndex: number;
	blue: TDraftTeam;
	red: TDraftTeam;
	state: TDraftState;
	turn?: TTurn;
	turnStart: number;
	currentTurnTime: number;
	canRepeatPreviousTurn: boolean;
	tournamentCode: string;
};
