import { TDraftTeam } from "./draft-team";

export type TDraftHistory = {
	id: string;
	roomId: string;
	draftIndex: number;
	blue: TDraftTeam;
	red: TDraftTeam;
	tournamentCode: string;
};
