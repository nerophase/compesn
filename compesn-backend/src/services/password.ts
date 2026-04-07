import { db } from "@/database";
import { verifications } from "@compesn/shared/common/schemas/verifications";
import { and, eq } from "drizzle-orm";

const addResetCode = async (email: string, code: string) => {
	const date = new Date();
	date.setDate(date.getDate() + 7);
	await db.insert(verifications).values({ identifier: email, value: code, expiresAt: date });
};

const checkResetCode = async (email: string, code: string) => {
	return (await db.query.verifications.findFirst({
		where: and(eq(verifications.identifier, email), eq(verifications.value, code)),
	}))
		? true
		: false;
};

export const passwordResetService = {
	addResetCode,
	checkResetCode,
};
