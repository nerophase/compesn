// import { IRoomSettings } from "@/interfaces/room";

import { TRoom } from "@compesn/shared/types/room";
import { TSelectOption } from "@compesn/shared/types/select-option";
import { RoomSettingsSchema } from "@/trpc/routers/rooms/rooms.schema";

// export const ROOM_DEFAULT_SETTINGS: IRoomSettings = {
// 	blueName: "",
// 	redName: "",
// 	blueGuest: false,
// 	redGuest: false,
// 	disabledTurns: [],
// 	disabledChampions: [],
// 	timePerPick: 30,
// 	timePerBan: 30,
// 	pickType: "BLIND_PICK",
// 	champions: [],
// };

export const PICK_TYPE_OPTIONS: TSelectOption[] = [
	{
		option: "BLIND_PICK",
		value: "Blind Pick",
	},
	{
		option: "TOURNAMENT_DRAFT",
		value: "Tournament Draft",
	},
];

export const TIME_OPTIONS: TSelectOption[] = [
	{
		option: "30",
		value: "30s",
	},
	{
		option: "45",
		value: "45s",
	},
	{
		option: "60",
		value: "60s",
	},
	{
		option: "-1",
		value: "Infinite",
	},
];

export const ROOM_DEFAULT_SETTINGS: typeof RoomSettingsSchema._type = {
	draftMode: "standard",
	numberOfDrafts: 1, // TODO: Reset to 1
	timePerBan: 30,
	timePerPick: 30,
	disabledChampions: [],
	disabledTurns: [],
	pickType: "BLIND_PICK",
	redTeamIsGuest: false,
	redTeamName: "",
	blueTeamIsGuest: false,
	blueTeamName: "",
	creatorId: "",
};

export const EMPTY_ROOM: TRoom = {
	id: "",
	draftMode: "standard",
	draftsCount: 0,
	drafts: [],
	currentDraft: 0,
	members: [],
	disabledTurns: [],
	disabledChampions: [],
	time: {
		pick: 0,
		ban: 0,
	},
	pickType: "BLIND_PICK",
	tournamentId: 0,
	tournamentCodes: [],
};
