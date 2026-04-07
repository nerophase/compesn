import SettingsPageClient from "./page-client";
import { prefetch, trpc } from "@/trpc/server";

export default async function SettingsPage() {
	prefetch(trpc.users.getUser.queryOptions());

	return <SettingsPageClient />;
}
