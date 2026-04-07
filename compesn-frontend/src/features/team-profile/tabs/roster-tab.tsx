"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { SearchIcon, UserPlusIcon, UsersIcon, XIcon } from "lucide-react";
import { toast } from "sonner";
import { useTRPC } from "@/trpc/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import type { TeamProfile } from "../types";

export function TeamRosterTab({
	team,
	isOwner,
}: {
	team: TeamProfile;
	isOwner: boolean;
}) {
	const trpc = useTRPC();
	const queryClient = useQueryClient();
	const [searchQuery, setSearchQuery] = useState("");
	const [showInviteDialog, setShowInviteDialog] = useState(false);

	const { data: searchResults, isLoading: isSearching } = useQuery({
		...trpc.users.search.queryOptions({
			query: searchQuery,
			limit: 10,
		}),
		enabled: searchQuery.length >= 2,
	});

	const invitePlayerMutation = useMutation(
		trpc.teams.invitePlayer.mutationOptions({
			onSuccess: () => {
				void queryClient.invalidateQueries(trpc.teams.getById.queryOptions({ teamId: team.id }));
				toast.success("Player invited successfully!");
				setShowInviteDialog(false);
				setSearchQuery("");
			},
			onError: (error) => {
				toast.error(error.message || "Failed to invite player");
			},
		}),
	);

	const removePlayerMutation = useMutation(
		trpc.teams.removePlayer.mutationOptions({
			onSuccess: () => {
				toast.success("Player removed successfully!");
			},
			onError: (error) => {
				toast.error(error.message || "Failed to remove player");
			},
		}),
	);

	const rescindInviteMutation = useMutation(
		trpc.teams.rescindInvite.mutationOptions({
			onSuccess: (_, variables) => {
				queryClient.setQueryData(
					trpc.teams.getById.queryOptions({ teamId: team.id }).queryKey,
					(currentTeam: TeamProfile | undefined) =>
						currentTeam
							? {
									...currentTeam,
									invites:
										currentTeam.invites?.filter(
											(invite) => invite.id !== variables.inviteId,
										) ?? [],
								}
							: currentTeam,
				);
				toast.success("Invite canceled.");
			},
			onError: (error) => {
				toast.error(error.message || "Failed to cancel invite");
			},
		}),
	);

	return (
		<div className="space-y-6">
			<Card className="bg-gray-900/30 backdrop-blur-xl border-cyan-500/30 shadow-2xl">
				<CardHeader>
					<div className="flex items-center justify-between">
						<div>
							<CardTitle className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">
								Roster Management
							</CardTitle>
							<CardDescription className="text-gray-400">
								{team.members?.length || 0} Players
							</CardDescription>
						</div>
						{isOwner && team.members?.length < 5 && (
							<Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
								<DialogTrigger asChild>
									<Button className="bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 shadow-lg">
										<UserPlusIcon className="h-4 w-4 mr-2" />
										Invite Player
									</Button>
								</DialogTrigger>
								<DialogContent className="bg-gray-900/95 backdrop-blur-xl border-cyan-500/30">
									<DialogHeader>
										<DialogTitle className="text-cyan-400">
											Invite Player to Team
										</DialogTitle>
										<DialogDescription className="text-gray-400">
											Search for a player by their username or Riot ID
										</DialogDescription>
									</DialogHeader>
									<div className="space-y-4 py-4">
										<div className="relative">
											<SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
											<Input
												placeholder="Search players..."
												value={searchQuery}
												onChange={(event) => setSearchQuery(event.target.value)}
												className="pl-10 bg-gray-800/50 backdrop-blur-sm border-gray-600"
											/>
										</div>

										{searchQuery.length >= 2 && (
											<div className="max-h-64 overflow-y-auto space-y-2">
												{isSearching ? (
													<p className="text-center text-gray-400 py-4">
														Searching...
													</p>
												) : searchResults &&
												  Array.isArray(searchResults) &&
												  searchResults.length > 0 ? (
													searchResults.map((user) => (
														<div
															key={user.id}
															className="flex items-center justify-between p-3 bg-gray-800/50 backdrop-blur-sm rounded-lg border border-gray-700/50 hover:border-cyan-500/50 cursor-pointer transition-all"
															onClick={() => {
																invitePlayerMutation.mutate({
																	teamId: team.id,
																	userId: user.id,
																	role: "SUB",
																});
															}}
														>
															<div className="flex items-center gap-3">
																<div className="w-10 h-10 bg-gradient-to-br from-cyan-500/20 to-purple-500/20 rounded-full flex items-center justify-center border border-cyan-500/30">
																	<UsersIcon className="h-5 w-5 text-cyan-400" />
																</div>
																<div>
																	<p className="font-medium text-gray-300">
																		{user.displayName}
																	</p>
																	{user.primaryRegion && (
																		<p className="text-sm text-gray-500">
																			{user.primaryRegion}
																		</p>
																	)}
																</div>
															</div>
															<Button
																size="sm"
																className="bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400"
															>
																Invite
															</Button>
														</div>
													))
												) : (
													<p className="text-center text-gray-400 py-4">
														No players found
													</p>
												)}
											</div>
										)}
									</div>
								</DialogContent>
							</Dialog>
						)}
					</div>
				</CardHeader>
				<CardContent>
					<div className="space-y-3">
						{team.members?.map((member) => (
							<div
								key={member.id}
								className="flex items-center justify-between p-4 bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm rounded-lg border border-gray-700/50 hover:border-cyan-500/30 transition-all"
							>
								<div className="flex items-center gap-4">
									<div className="w-12 h-12 bg-gradient-to-br from-cyan-500/20 to-purple-500/20 rounded-full flex items-center justify-center border border-cyan-500/30">
										<UsersIcon className="h-6 w-6 text-cyan-400" />
									</div>
									<div>
										<div className="flex items-center gap-2">
											<p className="font-medium text-gray-300">
												{member.user.name}
											</p>
											{team.ownerId === member.userId && (
												<Badge className="bg-gradient-to-r from-yellow-600 to-orange-600 text-xs shadow-lg">
													Owner
												</Badge>
											)}
										</div>
										<p className="text-sm text-gray-500">
											{member.role || "Member"} • Joined{" "}
											{new Date(member.joinedAt).toLocaleDateString()}
										</p>
									</div>
								</div>
								{isOwner && team.ownerId !== member.userId && (
									<Button
										variant="destructive"
										size="sm"
										onClick={() => {
											if (confirm(`Remove ${member.user.name} from the team?`)) {
												removePlayerMutation.mutate({
													teamId: team.id,
													userId: member.userId,
												});
											}
										}}
									>
										<XIcon className="h-4 w-4" />
									</Button>
								)}
							</div>
						))}
					</div>
				</CardContent>
			</Card>

			{isOwner && team.invites && team.invites.length > 0 && (
				<Card className="bg-gray-900/30 backdrop-blur-xl border-cyan-500/30 shadow-2xl">
					<CardHeader>
						<CardTitle className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">
							Pending Invites
						</CardTitle>
						<CardDescription className="text-gray-400">
							{team.invites.length} pending invitation
							{team.invites.length !== 1 ? "s" : ""}
						</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="space-y-3">
							{team.invites.map((invite) => (
								<div
									key={invite.id}
									className="flex items-center justify-between p-4 bg-gradient-to-br from-yellow-900/20 to-orange-900/20 backdrop-blur-sm rounded-lg border border-yellow-600/30"
								>
									<div className="flex items-center gap-4">
										<div className="w-12 h-12 bg-gradient-to-br from-yellow-500/20 to-orange-500/20 rounded-full flex items-center justify-center border border-yellow-500/30">
											<UsersIcon className="h-6 w-6 text-yellow-400" />
										</div>
										<div>
											<p className="font-medium text-gray-300">
												{invite.invitedUser?.name}
											</p>
											<p className="text-sm text-yellow-500">
												Pending response
											</p>
										</div>
									</div>
									<div className="flex items-center gap-3">
										<Badge
											variant="outline"
											className="border-yellow-500/50 bg-yellow-500/10 text-yellow-400 backdrop-blur-sm"
										>
											Pending
										</Badge>
										<Button
											variant="outline"
											size="sm"
											className="border-red-500/40 bg-red-500/10 text-red-200 hover:bg-red-500/20 hover:border-red-400/60 hover:text-red-100 backdrop-blur-sm"
											onClick={() =>
												rescindInviteMutation.mutate({
													inviteId: invite.id,
												})
											}
											disabled={rescindInviteMutation.isPending}
										>
											<XIcon className="h-4 w-4 mr-2" />
											Cancel Invite
										</Button>
									</div>
								</div>
							))}
						</div>
					</CardContent>
				</Card>
			)}
		</div>
	);
}
