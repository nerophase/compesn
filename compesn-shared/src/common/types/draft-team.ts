import { TChampionList } from "./champion-list";

export type TDraftTeam = {
	id: string;
	name: string;
	isGuest: boolean;
	pick: TChampionList;
	ban: TChampionList;
	ready: boolean;
};
