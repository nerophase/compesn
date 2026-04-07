import RoomSettingsPage from "./page-client";
import { prefetch, trpc } from "@/trpc/server";

export default async function Page() {
	prefetch(trpc.teams.userTeams.queryOptions());

	return (
		<div className="w-full flex justify-center items-center min-h-full">
			<RoomSettingsPage room={undefined} />
		</div>
	);
}
