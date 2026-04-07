import { TUser } from "./user";

export type TUserTeam = {
	id: string;
	name: string;
	usersToTeams: {
		userId: string;
		teamId: string;
		userIsPendingConfirmation: boolean;
		user: TUser;
	}[];
};
