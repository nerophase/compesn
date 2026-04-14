import { TChampion } from "./champion";
import { TRoom } from "./room";
import { TRoomMember } from "./room-member";
import { TStyles } from "./styles";
import { TTeamColor } from "./team-color";

export type TDraftContext = {
	room: TRoom;
	player: TRoomMember;
	styles: TStyles;
	activeDraft: number;
	totalSeconds: number;
	selectedChampion: TChampion | null;
	setActiveDraft: (value: number) => void;
	setSelectedChampion: (champion: TChampion | null) => void;
	addMessageToChatBox: (
		name: string,
		team: TTeamColor | undefined,
		all: boolean,
		text: string,
	) => void;
};
