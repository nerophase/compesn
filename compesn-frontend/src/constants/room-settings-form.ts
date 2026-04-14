import { TDraftMode } from "@compesn/shared/types/draft-mode";
import { TPickType } from "@compesn/shared/types/tournament";

export const DRAFT_MODE_OPTIONS: {
	label: string;
	value: TDraftMode;
}[] = [
	{ label: "Standard", value: "standard" },
	{ label: "Fearless", value: "fearless" },
];

export const NUMBER_OF_DRAFTS_OPTIONS: { label: string; value: number }[] = [
	{ label: "1", value: 1 },
	{ label: "2", value: 2 },
	{ label: "3", value: 3 },
	{ label: "4", value: 4 },
	{ label: "5", value: 5 },
];

export const PICK_TYPE_OPTIONS: {
	label: string;
	value: TPickType;
}[] = [
	{ label: "All Random", value: "ALL_RANDOM" },
	{ label: "Blind Pick", value: "BLIND_PICK" },
	{ label: "Draft Mode", value: "DRAFT_MODE" },
	{ label: "Tournament Draft", value: "TOURNAMENT_DRAFT" },
];

export const TIME_OPTIONS: { label: string; value: number }[] = [
	{ label: "30s", value: 30 },
	{ label: "45s", value: 45 },
	{ label: "60s", value: 60 },
	{ label: "Infinite", value: -1 },
];
