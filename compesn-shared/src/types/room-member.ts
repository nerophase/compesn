import { TTeamColor } from "./team-color";

export type TRoomMember = {
	socketId: string;
	userId: string;
	name: string;
	team: TTeamColor | undefined;
	isGuest: boolean;
};
