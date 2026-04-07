export type TAccount = {
	id: string;
	accountId: string;
	providerId: "discord" | "riot";
	userId: string;
	username: string;
	accessToken: string | null;
	refreshToken: string | null;
	idToken: string | null;
	accessTokenExpiresAt: Date | null;
	refreshTokenExpiresAt: Date | null;
	scope: string | null;
	password: string | null;
	createdAt: Date; // from timestamps
	updatedAt: Date; // from timestamps
};
