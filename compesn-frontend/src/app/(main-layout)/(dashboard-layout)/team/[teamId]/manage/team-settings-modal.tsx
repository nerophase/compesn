"use client";

import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
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
import { TeamUpdateSchema } from "@/trpc/routers/teams/teams.schema";
import { useTRPCMutationForm } from "@/utils/reactTRPCHookForm";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

interface TeamSettingsModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	team: {
		id: string;
		name: string;
		tag: string;
	};
	onSuccess?: () => void;
}

export default function TeamSettingsModal({
	open,
	onOpenChange,
	team,
	onSuccess,
}: TeamSettingsModalProps) {
	const trpc = useTRPC();

	const updateTeamMutation = useMutation(
		trpc.teams.update.mutationOptions({
			onSuccess: () => {
				toast.success("Team updated successfully!");
				onSuccess?.();
				onOpenChange(false);
			},
			onError: (error) => {
				toast.error(error.message);
			},
		}),
	);

	const { onSubmit, form } = useTRPCMutationForm(updateTeamMutation, {
		schema: TeamUpdateSchema,
		defaultValues: {
			teamId: team.id,
			name: team.name,
			tag: team.tag,
		},
	});

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>Team Settings</DialogTitle>
					<DialogDescription>Update your team&apos;s name and tag.</DialogDescription>
				</DialogHeader>
				<Form {...form}>
					<form onSubmit={onSubmit} className="space-y-4">
						<FormField
							control={form.control}
							name="name"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Team Name</FormLabel>
									<FormControl>
										<Input placeholder="Enter team name" {...field} />
									</FormControl>
									<FormDescription>
										This is your team&apos;s display name (3-24 characters).
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
											placeholder="Enter team tag"
											{...field}
											onChange={(e) => {
												field.onChange(e.target.value.toUpperCase());
											}}
										/>
									</FormControl>
									<FormDescription>
										A short identifier for your team (2-5 uppercase characters).
									</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>
						<div className="flex justify-end gap-2">
							<Button
								type="button"
								variant="outline"
								onClick={() => onOpenChange(false)}
							>
								Cancel
							</Button>
							<Button type="submit" disabled={updateTeamMutation.isPending}>
								{updateTeamMutation.isPending ? "Updating..." : "Update Team"}
							</Button>
						</div>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
}
