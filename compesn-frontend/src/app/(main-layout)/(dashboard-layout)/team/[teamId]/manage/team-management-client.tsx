"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useTRPC } from "@/trpc/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import {
	MoreHorizontal,
	UserPlus,
	Settings,
	Trash2,
	UserMinus,
	Crown,
	Mail,
	X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import InvitePlayerModal from "./invite-player-modal";
import TeamSettingsModal from "./team-settings-modal";

interface TeamManagementClientProps {
	teamId: string;
	userId: string;
}

export default function TeamManagementClient({ teamId, userId }: TeamManagementClientProps) {
	const router = useRouter();
	const trpc = useTRPC();
	const queryClient = useQueryClient();

	// State for modals
	const [inviteModalOpen, setInviteModalOpen] = useState(false);
	const [settingsModalOpen, setSettingsModalOpen] = useState(false);
	const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

	// Fetch team data
	const { data: team, isLoading } = useQuery(trpc.teams.byId.queryOptions({ teamId }));

	// Mutations
	const removePlayerMutation = useMutation(
		trpc.teams.removePlayer.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries(trpc.teams.byId.queryOptions({ teamId }));
				toast.success("Player removed from team");
			},
			onError: (error) => {
				toast.error(error.message);
			},
		}),
	);

	const rescindInviteMutation = useMutation(
		trpc.teams.rescindInvite.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries(trpc.teams.byId.queryOptions({ teamId }));
				toast.success("Invite rescinded");
			},
			onError: (error) => {
				toast.error(error.message);
			},
		}),
	);

	const deleteTeamMutation = useMutation(
		trpc.teams.delete.mutationOptions({
			onSuccess: () => {
				toast.success("Team deleted");
				router.push("/teams");
			},
			onError: (error) => {
				toast.error(error.message);
			},
		}),
	);

	const transferOwnershipMutation = useMutation(
		trpc.teams.transferOwnership.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries(trpc.teams.byId.queryOptions({ teamId }));
				toast.success("Ownership transferred");
			},
			onError: (error) => {
				toast.error(error.message);
			},
		}),
	);

	if (isLoading) {
		return <div>Loading...</div>;
	}

	if (!team) {
		return <div>Team not found</div>;
	}

	const isOwner = team.ownerId === userId;
	const currentUserMember = team.members?.find((m) => m.userId === userId);

	if (!isOwner && !currentUserMember) {
		return <div>Access denied</div>;
	}

	const handleRemovePlayer = (playerId: string) => {
		removePlayerMutation.mutate({ teamId, userId: playerId });
	};

	const handleRescindInvite = (inviteId: string) => {
		rescindInviteMutation.mutate({ inviteId });
	};

	const handleTransferOwnership = (newOwnerId: string) => {
		transferOwnershipMutation.mutate({ teamId, newOwnerId });
	};

	const handleDeleteTeam = () => {
		deleteTeamMutation.mutate({ teamId });
	};

	const getRoleColor = (role: string) => {
		const colors = {
			TOP: "bg-blue-100 text-blue-800",
			JUNGLE: "bg-green-100 text-green-800",
			MID: "bg-yellow-100 text-yellow-800",
			BOT: "bg-red-100 text-red-800",
			SUPPORT: "bg-purple-100 text-purple-800",
			SUB: "bg-gray-100 text-gray-800",
			COACH: "bg-orange-100 text-orange-800",
		};
		return colors[role as keyof typeof colors] || "bg-gray-100 text-gray-800";
	};

	return (
		<div className="container max-w-4xl mx-auto py-8 space-y-6">
			{/* Team Header */}
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-3xl font-bold">
						{team.name} <span className="text-muted-foreground">[{team.tag}]</span>
					</h1>
					<p className="text-muted-foreground">Owner: {team.owner?.name}</p>
				</div>
				{isOwner && (
					<div className="flex gap-2">
						<Button variant="outline" onClick={() => setInviteModalOpen(true)}>
							<UserPlus className="w-4 h-4 mr-2" />
							Invite Player
						</Button>
						<Button variant="outline" onClick={() => setSettingsModalOpen(true)}>
							<Settings className="w-4 h-4 mr-2" />
							Settings
						</Button>
					</div>
				)}
			</div>

			{/* Team Members */}
			<Card>
				<CardHeader>
					<CardTitle>Team Roster ({team.members?.length || 0}/10)</CardTitle>
					<CardDescription>Current team members and their roles</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="space-y-4">
						{team.members?.map((member) => (
							<div
								key={member.id}
								className="flex items-center justify-between p-4 border rounded-lg"
							>
								<div className="flex items-center gap-3">
									<Avatar>
										<AvatarImage src={member.user.image || ""} />
										<AvatarFallback>
											{member.user.name?.charAt(0).toUpperCase()}
										</AvatarFallback>
									</Avatar>
									<div>
										<div className="flex items-center gap-2">
											<span className="font-medium">{member.user.name}</span>
											{member.userId === team.ownerId && (
												<Crown className="w-4 h-4 text-yellow-500" />
											)}
										</div>
										<div className="flex items-center gap-2 text-sm text-muted-foreground">
											{member.user.riotGameName && member.user.riotTagLine ? (
												<span>
													{member.user.riotGameName}#
													{member.user.riotTagLine}
												</span>
											) : (
												<span>No Riot account linked</span>
											)}
										</div>
									</div>
								</div>
								<div className="flex items-center gap-2">
									<Badge className={getRoleColor(member.role)}>
										{member.role}
									</Badge>
									{isOwner && member.userId !== userId && (
										<DropdownMenu>
											<DropdownMenuTrigger asChild>
												<Button variant="ghost" size="sm">
													<MoreHorizontal className="w-4 h-4" />
												</Button>
											</DropdownMenuTrigger>
											<DropdownMenuContent>
												<DropdownMenuItem
													onClick={() =>
														handleTransferOwnership(member.userId)
													}
												>
													<Crown className="w-4 h-4 mr-2" />
													Transfer Ownership
												</DropdownMenuItem>
												<DropdownMenuItem
													onClick={() =>
														handleRemovePlayer(member.userId)
													}
													className="text-destructive"
												>
													<UserMinus className="w-4 h-4 mr-2" />
													Remove Player
												</DropdownMenuItem>
											</DropdownMenuContent>
										</DropdownMenu>
									)}
								</div>
							</div>
						))}
					</div>
				</CardContent>
			</Card>

			{/* Pending Invites */}
			{isOwner && team.invites && team.invites.length > 0 && (
				<Card>
					<CardHeader>
						<CardTitle>Pending Invites ({team.invites.length})</CardTitle>
						<CardDescription>
							Players who have been invited but haven&apos;t responded yet
						</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="space-y-4">
							{team.invites.map((invite) => (
								<div
									key={invite.id}
									className="flex items-center justify-between p-4 border rounded-lg"
								>
									<div className="flex items-center gap-3">
										<Avatar>
											<AvatarImage src={invite.invitedUser.image || ""} />
											<AvatarFallback>
												{invite.invitedUser.name?.charAt(0).toUpperCase()}
											</AvatarFallback>
										</Avatar>
										<div>
											<span className="font-medium">
												{invite.invitedUser.name}
											</span>
											<div className="flex items-center gap-2 text-sm text-muted-foreground">
												<Mail className="w-3 h-3" />
												<span>Invited for {invite.role}</span>
												<span>•</span>
												<span>
													Expires:{" "}
													{new Date(
														invite.expiresAt,
													).toLocaleDateString()}
												</span>
											</div>
										</div>
									</div>
									<Button
										variant="ghost"
										size="sm"
										onClick={() => handleRescindInvite(invite.id)}
									>
										<X className="w-4 h-4" />
									</Button>
								</div>
							))}
						</div>
					</CardContent>
				</Card>
			)}

			{/* Danger Zone */}
			{isOwner && (
				<Card className="border-destructive">
					<CardHeader>
						<CardTitle className="text-destructive">Danger Zone</CardTitle>
						<CardDescription>Irreversible and destructive actions</CardDescription>
					</CardHeader>
					<CardContent>
						<Button variant="destructive" onClick={() => setDeleteConfirmOpen(true)}>
							<Trash2 className="w-4 h-4 mr-2" />
							Delete Team
						</Button>
					</CardContent>
				</Card>
			)}

			{/* Modals */}
			<InvitePlayerModal
				open={inviteModalOpen}
				onOpenChange={setInviteModalOpen}
				teamId={teamId}
				onSuccess={() => {
					queryClient.invalidateQueries(trpc.teams.byId.queryOptions({ teamId }));
				}}
			/>

			<TeamSettingsModal
				open={settingsModalOpen}
				onOpenChange={setSettingsModalOpen}
				team={team}
				onSuccess={() => {
					queryClient.invalidateQueries(trpc.teams.byId.queryOptions({ teamId }));
				}}
			/>

			{/* Delete Confirmation */}
			<Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Are you absolutely sure?</DialogTitle>
						<DialogDescription>
							This action cannot be undone. This will permanently delete the team and
							remove all members and pending invites.
						</DialogDescription>
					</DialogHeader>
					<div className="flex justify-end gap-2">
						<Button variant="outline" onClick={() => setDeleteConfirmOpen(false)}>
							Cancel
						</Button>
						<Button
							variant="destructive"
							onClick={handleDeleteTeam}
							disabled={deleteTeamMutation.isPending}
						>
							{deleteTeamMutation.isPending ? "Deleting..." : "Delete Team"}
						</Button>
					</div>
				</DialogContent>
			</Dialog>
		</div>
	);
}
