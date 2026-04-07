import { eq, or } from "drizzle-orm";
import { logError } from "@compesn/shared/logging";
import { users } from "@compesn/shared/common/schemas";
import { db } from "./database/db";
import { env } from "@/environment";
import { isAuthBypassEnabled, resolveAuthBypassIdentifier } from "./auth-bypass-utils";

export const getBypassedUser = async (submittedUsername: string) => {
	if (!isAuthBypassEnabled(env.NODE_ENV, env.ENABLE_AUTH_BYPASS)) {
		return null;
	}

	const identifier = resolveAuthBypassIdentifier(
		submittedUsername,
		env.AUTH_BYPASS_IDENTIFIER,
	);

	if (!identifier) {
		return null;
	}

	try {
		return (
			(await db.query.users.findFirst({
				where: or(eq(users.name, identifier), eq(users.email, identifier)),
			})) ?? null
		);
	} catch (error) {
		logError("frontend.auth-bypass", error, { identifier });
		return null;
	}
};
