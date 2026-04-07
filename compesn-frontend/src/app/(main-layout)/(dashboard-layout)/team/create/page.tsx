import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import CreateTeamForm from "./create-team-form";

export default async function CreateTeamPage() {
	const session = await auth();

	if (!session?.user) {
		redirect("/auth/login");
	}

	return (
		<div className="container max-w-2xl mx-auto py-8">
			<div className="space-y-6">
				<div>
					<h1 className="text-3xl font-bold">Create Team</h1>
					<p className="text-muted-foreground">
						Create a new team and start building your roster.
					</p>
				</div>
				<CreateTeamForm />
			</div>
		</div>
	);
}
