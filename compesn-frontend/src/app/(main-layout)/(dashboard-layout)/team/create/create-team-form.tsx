"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useTRPC } from "@/trpc/client";
import { TeamCreateSchema } from "@/trpc/routers/teams/teams.schema";
import { useTRPCMutationForm } from "@/utils/reactTRPCHookForm";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function CreateTeamForm() {
	const router = useRouter();
	const trpc = useTRPC();

	const createTeamMutation = useMutation(
		trpc.teams.create.mutationOptions({
			onSuccess: (team) => {
				toast.success("Team created successfully!");
				router.push(`/teams/${team.id}/manage`);
			},
			onError: (error) => {
				toast.error(error.message);
			},
		}),
	);

	const { onSubmit, form } = useTRPCMutationForm(createTeamMutation, {
		schema: TeamCreateSchema,
		defaultValues: {
			name: "",
			tag: "",
		},
	});

	return (
		<Card>
			<CardHeader>
				<CardTitle>Team Information</CardTitle>
				<CardDescription>
					Enter your team&apos;s name and tag. The tag will be displayed alongside your
					team name.
				</CardDescription>
			</CardHeader>
			<CardContent>
				<Form {...form}>
					<form onSubmit={onSubmit} className="space-y-6">
						<FormField
							control={form.control}
							name="name"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Team Name</FormLabel>
									<FormControl>
										<Input
											placeholder="Enter team name (3-24 characters)"
											{...field}
										/>
									</FormControl>
									<FormDescription>
										This is your team&apos;s display name. It must be between 3
										and 24 characters.
									</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="tag"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Team Tag</FormLabel>
									<FormControl>
										<Input
											placeholder="Enter team tag (2-5 characters)"
											{...field}
											onChange={(e) => {
												// Auto-uppercase the tag
												field.onChange(e.target.value.toUpperCase());
											}}
										/>
									</FormControl>
									<FormDescription>
										A short identifier for your team (e.g., &quot;TSM&quot;,
										&quot;C9&quot;). Must be 2-5 uppercase letters and numbers.
									</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>
						<div className="flex gap-4">
							<Button type="button" variant="outline" onClick={() => router.back()}>
								Cancel
							</Button>
							<Button type="submit" disabled={createTeamMutation.isPending}>
								{createTeamMutation.isPending ? "Creating..." : "Create Team"}
							</Button>
						</div>
					</form>
				</Form>
			</CardContent>
		</Card>
	);
}
