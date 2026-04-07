import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prefetch, trpc } from "@/trpc/server";
import TeamManagementClient from "./team-management-client";

interface TeamManagePageProps {
	params: Promise<{
		teamId: string;
	}>;
}

export default async function TeamManagePage({ params }: TeamManagePageProps) {
	const { teamId } = await params;
	const session = await auth();

	if (!session?.user) {
		redirect("/auth/login");
	}

	// Prefetch team data
	try {
		await prefetch(trpc.teams.byId.queryOptions({ teamId }));
	} catch (error) {
		// Team not found or access denied
		redirect("/teams");
	}

	return <TeamManagementClient teamId={teamId} userId={session.user.id} />;
}
