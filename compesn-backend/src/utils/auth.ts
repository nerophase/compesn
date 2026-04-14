import { TUserRole } from "@compesn/shared/types/user-role";
import { env } from "@/environment";
import jwt from "jsonwebtoken";

type TokenPayload = {
	userId: string;
	role: TUserRole;
};

export function verifyRefresh(userId: string, token: string) {
	try {
		const decoded = jwt.verify(token, env.APP_SECRET) as TokenPayload;
		return decoded.userId === userId;
	} catch (error) {
		return false;
	}
}
export function createToken(userId: string, role: string, tokenType: "access" | "refresh") {
	return jwt.sign({ userId, role }, env.APP_SECRET, {
		// ...(tokenType === "access" && {
		// 	expiresIn: "7d",
		// }),
	});
}
export function getTokens(userId: string, role: TUserRole) {
	const accessToken = createToken(userId, role, "access");
	const refreshToken = createToken(userId, role, "refresh");
	return { accessToken, refreshToken };
}
