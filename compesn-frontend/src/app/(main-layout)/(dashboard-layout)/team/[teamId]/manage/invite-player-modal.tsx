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
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useTRPC } from "@/trpc/client";
import { InvitePlayerSchema, TeamMemberRoleSchema } from "@/trpc/routers/teams/teams.schema";
import { useTRPCMutationForm } from "@/utils/reactTRPCHookForm";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useState, useDeferredValue } from "react";
import { toast } from "sonner";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface InvitePlayerModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	teamId: string;
	onSuccess?: () => void;
}

export default function InvitePlayerModal({
	open,
	onOpenChange,
	teamId,
	onSuccess,
}: InvitePlayerModalProps) {
	const trpc = useTRPC();
	const [searchQuery, setSearchQuery] = useState("");
	const deferredSearchQuery = useDeferredValue(searchQuery);
	const [selectedUserId, setSelectedUserId] = useState("");
	const [userSearchOpen, setUserSearchOpen] = useState(false);

	// Search users using deferred search query
	const { data, isLoading: isSearching } = useQuery(
		trpc.users.search.queryOptions({
			query: deferredSearchQuery,
			limit: 10,
		}),
	);
	const searchResults = (data ?? []) as Array<{
		id: string;
		name: string;
		displayName: string;
		primaryRegion?: string;
		image: string | null;
		riotGameName: string | null;
		riotTagLine: string | null;
	}>;

	const invitePlayerMutation = useMutation(
		trpc.teams.invitePlayer.mutationOptions({
			onSuccess: () => {
				toast.success("Player invited successfully!");
				onSuccess?.();
				onOpenChange(false);
				form.reset();
				setSelectedUserId("");
				setSearchQuery("");
			},
			onError: (error) => {
				toast.error(error.message);
			},
		}),
	);

	const { onSubmit, form } = useTRPCMutationForm(invitePlayerMutation, {
		schema: InvitePlayerSchema,
		defaultValues: {
			teamId,
			userId: "",
			role: undefined,
		},
	});

	const selectedUser = searchResults.find((user) => user.id === selectedUserId);

	const roles = TeamMemberRoleSchema.options;

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>Invite Player</DialogTitle>
					<DialogDescription>
						Search for a player and invite them to join your team.
					</DialogDescription>
				</DialogHeader>
				<Form {...form}>
					<form onSubmit={onSubmit} className="space-y-4">
						<FormField
							control={form.control}
							name="userId"
							render={({ field }) => (
								<FormItem className="flex flex-col">
									<FormLabel>Player</FormLabel>
									<Popover open={userSearchOpen} onOpenChange={setUserSearchOpen}>
										<PopoverTrigger asChild>
											<FormControl>
												<Button
													variant="outline"
													role="combobox"
													aria-expanded={userSearchOpen}
													className={cn(
														"justify-between",
														!selectedUser && "text-muted-foreground",
													)}
												>
													{selectedUser ? (
														<div className="flex items-center gap-2">
															<Avatar className="w-6 h-6">
																<AvatarImage
																	src={selectedUser.image || ""}
																/>
																<AvatarFallback>
																	{selectedUser.name
																		?.charAt(0)
																		.toUpperCase()}
																</AvatarFallback>
															</Avatar>
															<span>{selectedUser.displayName}</span>
														</div>
													) : (
														"Select player..."
													)}
													<ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
												</Button>
											</FormControl>
										</PopoverTrigger>
										<PopoverContent className="w-[300px] p-0">
											<Command>
												<CommandInput
													placeholder="Search players..."
													value={searchQuery}
													onValueChange={setSearchQuery}
												/>
												<CommandEmpty>
													{searchQuery.length === 0
														? "Start typing to search players..."
														: isSearching
															? "Searching..."
															: "No players found."}
												</CommandEmpty>
												<CommandGroup>
													{searchResults?.map((user) => (
														<CommandItem
															key={user.id}
															value={user.id}
															onSelect={() => {
																setSelectedUserId(user.id);
																field.onChange(user.id);
																setUserSearchOpen(false);
															}}
														>
															<div className="flex items-center gap-2 w-full">
																<Avatar className="w-8 h-8">
																	<AvatarImage
																		src={user.image || ""}
																	/>
																	<AvatarFallback>
																		{user.name
																			?.charAt(0)
																			.toUpperCase()}
																	</AvatarFallback>
																</Avatar>
																<div className="flex-1">
																	<div className="font-medium">
																		{user.displayName}
																	</div>
																	<div className="text-sm text-muted-foreground">
																		{user.primaryRegion ||
																			"No region"}
																	</div>
																</div>
																<Check
																	className={cn(
																		"ml-auto h-4 w-4",
																		selectedUserId === user.id
																			? "opacity-100"
																			: "opacity-0",
																	)}
																/>
															</div>
														</CommandItem>
													))}
												</CommandGroup>
											</Command>
										</PopoverContent>
									</Popover>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="role"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Role</FormLabel>
									<Select
										onValueChange={field.onChange}
										defaultValue={field.value}
									>
										<FormControl>
											<SelectTrigger>
												<SelectValue placeholder="Select a role" />
											</SelectTrigger>
										</FormControl>
										<SelectContent>
											{roles.map((role) => (
												<SelectItem key={role} value={role}>
													{role}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
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
							<Button
								type="submit"
								disabled={invitePlayerMutation.isPending || !selectedUserId}
							>
								{invitePlayerMutation.isPending ? "Inviting..." : "Send Invite"}
							</Button>
						</div>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
}
