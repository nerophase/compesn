"use client";

import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Form, FormControl, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useTRPC } from "@/trpc/client";
import { ConversationCreateSchema } from "@/trpc/routers/messages/messages.schema";
import { useTRPCMutationForm } from "@/utils/reactTRPCHookForm";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useDeferredValue, useState } from "react";
import { toast } from "sonner";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSession } from "next-auth/react";

interface NewConversationModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSuccess?: () => void;
}

type User = {
	id: string;
	name: string;
	displayName: string;
	primaryRegion?: string;
	image: string | null;
	riotGameName: string | null;
	riotTagLine: string | null;
};

export default function NewConversationModal({
	open,
	onOpenChange,
	onSuccess,
}: NewConversationModalProps) {
	const trpc = useTRPC();
	const [searchQuery, setSearchQuery] = useState("");
	const deferredSearchQuery = useDeferredValue(searchQuery);
	const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
	const [userSearchOpen, setUserSearchOpen] = useState(false);
	const session = useSession();

	// Search users
	const { data, isLoading: isSearching } = useQuery(
		trpc.users.search.queryOptions(
			{
				query: deferredSearchQuery,
				limit: 10,
			},
			{ enabled: deferredSearchQuery.length >= 1 },
		),
	);
	const searchResults = (data ?? []) as User[];

	// Filter out already selected users from search results
	const availableUsers = searchResults.filter(
		(user) =>
			!selectedUsers.some((selected) => selected.id === user.id) &&
			session.data?.user.id !== user.id,
	);

	const createConversationMutation = useMutation(
		trpc.messages.createConversation.mutationOptions({
			onSuccess: () => {
				toast.success("Conversation created successfully!");
				onSuccess?.();
				onOpenChange(false);
				form.reset();
				setSelectedUsers([]);
				setSearchQuery("");
			},
			onError: (error) => {
				toast.error(error.message);
			},
		}),
	);

	const { onSubmit, form } = useTRPCMutationForm(createConversationMutation, {
		schema: ConversationCreateSchema,
		defaultValues: {
			participantIds: [],
			name: undefined,
			isGroup: false,
		},
	});

	const handleAddUser = (user: User) => {
		if (!selectedUsers.some((selected) => selected.id === user.id)) {
			const newSelectedUsers = [...selectedUsers, user];
			setSelectedUsers(newSelectedUsers);
			form.setValue(
				"participantIds",
				newSelectedUsers.map((u) => u.id),
			);
			form.setValue("isGroup", newSelectedUsers.length > 1);
			setSearchQuery("");
			setUserSearchOpen(false);
		}
	};

	const handleRemoveUser = (userId: string) => {
		const newSelectedUsers = selectedUsers.filter((u) => u.id !== userId);
		setSelectedUsers(newSelectedUsers);
		form.setValue(
			"participantIds",
			newSelectedUsers.map((u) => u.id),
		);
		form.setValue("isGroup", newSelectedUsers.length > 1);
	};

	return (
		<Dialog
			open={open}
			onOpenChange={(open) => {
				if (!open) {
					setSelectedUsers([]);
					setSearchQuery("");
					setUserSearchOpen(false);
					form.reset({
						participantIds: [],
						name: undefined,
						isGroup: false,
					});
				}
				onOpenChange(open);
			}}
		>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>New Conversation</DialogTitle>
					<DialogDescription>
						Start a conversation with one or more users.
					</DialogDescription>
				</DialogHeader>
				<Form {...form}>
					<form onSubmit={onSubmit} className="space-y-4">
						<FormItem className="flex flex-col">
							<FormLabel>Start conversation with:</FormLabel>
							<Popover open={userSearchOpen} onOpenChange={setUserSearchOpen}>
								<PopoverTrigger asChild>
									<FormControl>
										<Button
											type="button"
											variant="outline"
											role="combobox"
											aria-expanded={userSearchOpen}
											className={cn(
												"justify-between",
												"text-muted-foreground",
											)}
										>
											Search users...
											<ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
										</Button>
									</FormControl>
								</PopoverTrigger>
								<PopoverContent className="w-[300px] p-0">
									<Command>
										<CommandInput
											placeholder="Search users..."
											value={searchQuery}
											onValueChange={setSearchQuery}
										/>
										<CommandEmpty>
											{searchQuery.length === 0
												? "Start typing to search users..."
												: isSearching
													? "Searching..."
													: "No users found."}
										</CommandEmpty>
										<CommandGroup>
											{availableUsers?.map((user) => (
												<CommandItem
													key={user.id}
													value={user.name}
													onSelect={() => {
														handleAddUser(user);
													}}
												>
													<div className="flex items-center gap-2 w-full">
														{/* <Avatar className="w-8 h-8">
															<AvatarImage
																src={
																	user.image ||
																	""
																}
															/>
															<AvatarFallback>
																{user.name
																	?.charAt(0)
																	.toUpperCase()}
															</AvatarFallback>
														</Avatar> */}
														<div className="flex-1 flex-col">
															<div className="font-medium">
																{user.displayName}
															</div>
															<div className="text-sm text-foreground/80">
																{user.primaryRegion || "No region"}
															</div>
														</div>
														<Check className="ml-auto h-4 w-4 opacity-0" />
													</div>
												</CommandItem>
											))}
										</CommandGroup>
									</Command>
								</PopoverContent>
							</Popover>
							<FormMessage />
						</FormItem>

						{/* Selected Users List */}
						{selectedUsers.length > 0 && (
							<div className="space-y-2">
								<FormLabel>Selected users:</FormLabel>
								<div className="flex flex-wrap gap-2 p-3 border rounded-md min-h-[60px]">
									{selectedUsers.map((user) => (
										<Badge
											key={user.id}
											variant="default"
											className="flex items-center gap-2 px-2 py-1 pr-1"
										>
											<span className="text-xs">{user.displayName}</span>
											<Button
												type="button"
												variant="ghost"
												size="sm"
												className="h-4 w-4 p-0 hover:bg-transparent"
												onClick={() => handleRemoveUser(user.id)}
											>
												<X className="h-3 w-3" />
											</Button>
										</Badge>
									))}
								</div>
							</div>
						)}

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
								disabled={
									createConversationMutation.isPending ||
									selectedUsers.length === 0
								}
							>
								{createConversationMutation.isPending
									? "Creating..."
									: selectedUsers.length === 1
										? "Start DM"
										: "Start Group Chat"}
							</Button>
						</div>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
}
