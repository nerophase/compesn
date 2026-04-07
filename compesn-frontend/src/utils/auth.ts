import { TUserRole } from "@compesn/shared/common/types/user-role";
import { randomUUID } from "crypto";

export function verifyRefresh(userId: string, token: string) {
	// Simplified: since we don't verify JWTs here, accept any non-empty token.
	return Boolean(userId && token);
}

export function createToken(userId: string, role: string, tokenType: "access" | "refresh") {
	// Generate a simple opaque token. For production, use a proper JWT service.
	return `${tokenType}.${userId}.${role}.${randomUUID()}`;
}
export function getTokens(userId: string, role: TUserRole) {
	const accessToken = createToken(userId, role, "access");
	const refreshToken = createToken(userId, role, "refresh");
	return { accessToken, refreshToken };
}
