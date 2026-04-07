import TeamsPageClient from "./page-client";
import { auth } from "@/lib/auth";
import { prefetch, trpc } from "@/trpc/server";

export default async function TeamsPage() {
	const session = await auth();

	prefetch(trpc.teams.userTeams.queryOptions());

	return <TeamsPageClient userId={session?.user.id} />;
}
