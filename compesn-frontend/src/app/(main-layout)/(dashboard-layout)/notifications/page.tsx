import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prefetch, trpc } from "@/trpc/server";
import NotificationsClient from "./notifications-client";

export default async function NotificationsPage() {
	const session = await auth();

	if (!session?.user) {
		redirect("/auth/login");
	}

	// Prefetch user invites
	prefetch(trpc.teams.userInvites.queryOptions());

	return <NotificationsClient userId={session.user.id} />;
}
