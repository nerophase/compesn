import { TUserRole } from "@compesn/shared/common/types/user-role";
import { env } from "@/environment";
import jwt from "jsonwebtoken";

export function verifyRefresh(userId: string, token: string) {
	try {
		const decoded: any = jwt.verify(token, env.APP_SECRET);
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
