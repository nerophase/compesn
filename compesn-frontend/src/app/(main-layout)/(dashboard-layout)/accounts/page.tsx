import { db } from "@/lib/database/db";
import AccountsPageClient from "./page-client";
import { SearchParams } from "@compesn/shared/types/page-params";
import { eq } from "drizzle-orm";
import { users } from "@compesn/shared/schemas";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ROUTES } from "@/environment";

export default async function AccountsPage({ searchParams }: { searchParams: SearchParams }) {
	const session = await auth();
	if (!session?.user?.id) {
		return redirect(ROUTES.client.authLogin);
	}

	const userInfo = await db.query.users.findFirst({
		where: eq(users.id, session?.user?.id),
	});

	if (!userInfo) {
		return redirect(ROUTES.client.authLogin);
	}

	return (
		<AccountsPageClient
			userInfo={userInfo}
			error={((await searchParams).error as "DISCORD" | "RIOT") || undefined}
		/>
	);
}
