import { TTeamColor } from "./team-color";
import { TTurnType } from "./turn-type";

export type TTurn = {
	number: number;
	team: TTeamColor;
	type: TTurnType;
	typeNumber: number;
	configOrder: number;
};
