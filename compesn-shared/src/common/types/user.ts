import { TAccount } from "./account";
import { TUserTeam } from "./user-team";
import { TUserRole } from "./user-role";

export type TUser = {
	id: string;
	name: string;
	email: string | null;
	emailVerified: boolean;
	password: string;
	region: string | null;
	role: TUserRole;
	image: string | null;
	defaultAccountId: string | null;
	accounts?: TAccount[];
	usersToTeams?: {
		teams: TUserTeam[];
	};
};
