import type { TChampion } from "../types/champion";
import type { TChampionList } from "../types/champion-list";
import type { TDraft } from "../types/draft";
import type { TTurn } from "../types/turn";

const getDraftList = (draft: TDraft, turn: TTurn | undefined): TChampionList => {
	const team = turn?.team;

	if (!turn || !team) {
		return [];
	}

	return turn.type === "ban" ? draft[team].ban : draft[team].pick;
};

export const addChampion = (draft: TDraft, champion: TChampion) => {
	const turn = draft.turn;
	const list = getDraftList(draft, turn);

	if (turn) {
		list[turn.typeNumber - 1] = champion;
	}

	return draft;
};

export const removeChampion = (draft: TDraft, turn: TTurn | undefined) => {
	const list = getDraftList(draft, turn);

	if (turn) {
		list[turn.typeNumber - 1] = null;
	}
};

export const getCurrentChampion = (draft: TDraft, turn: TTurn | undefined) => {
	const team = turn?.team;

	if (!turn || !team) {
		return "";
	}

	return draft[team][turn.type][turn.typeNumber - 1] || "";
};
