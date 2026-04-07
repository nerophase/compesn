import { TTeamColor } from "./team-color";

export type TMessage = {
	id: string;
	name: string;
	team: TTeamColor | undefined;
	all: boolean;
	text: string;
};
