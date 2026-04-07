"use client";

import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { UserX, TrashIcon, UserPlusIcon, XIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import DashboardHeader from "@/components/dashboard-top";
import { TUserTeam } from "@compesn/shared/common/types/user-team";
import { useTRPC } from "@/trpc/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTRPCMutationForm } from "@/utils/reactTRPCHookForm";
import { TeamAddPlayerSchema, TeamRegisterSchema } from "@/trpc/routers/teams/teams.schema";
import Link from "next/link";

export default function TeamsPageClient({ userId }: { userId: string | undefined }) {
	const trpc = useTRPC();
	const queryClient = useQueryClient();
	const { data: teamMemberships = [] } = useQuery(trpc.teams.userTeams.queryOptions());

	// Extract teams from team memberships
	const teams = teamMemberships.map((membership) => ({
		...membership.team,
		currentUserMembership: membership,
	}));

	// leave team
	const [leaveTeamDialogOpen, setLeaveTeamDialogOpen] = useState<boolean>(false);
	const [teamToLeave, setTeamToLeave] = useState<string | null>(null);

	// delete team
	const [deleteTeamDialogOpen, setDeleteTeamDialogOpen] = useState<boolean>(false);
	const [teamToDelete, setTeamToDelete] = useState<string | null>(null);

	// create team
	const createTeam = useMutation(
		trpc.teams.registerTeam.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries(trpc.teams.userTeams.queryOptions());
				setCreateTeamDialogOpen(false);
				createTeamForm.reset();
			},
			onError: (error) => {
				toast.error(error.message);
			},
		}),
	);

	const [createTeamDialogOpen, setCreateTeamDialogOpen] = useState<boolean>(false);

	const { onSubmit: onCreateTeam, form: createTeamForm } = useTRPCMutationForm(createTeam, {
		schema: TeamRegisterSchema,
		mode: "onBlur",
		reValidateMode: "onBlur",
		defaultValues: {
			teamName: "",
		},
	});

	//add player to team
	const [addPlayerDialogOpen, setAddPlayerDialogOpen] = useState<boolean>(false);
	const [currentTeamToAddPlayer, setCurrentTeamToAddPlayer] = useState<TUserTeam>();
	const [loadingAddPlayer, setLoadingAddPlayer] = useState<boolean>(false);

	const addPlayer = useMutation(
		trpc.teams.addPlayer.mutationOptions({
			onMutate: (values) => {
				setLoadingAddPlayer(true);
			},
			onError: (error) => {
				toast.error(error.message);
				setLoadingAddPlayer(false);
			},
			onSuccess: () => {
				queryClient.invalidateQueries(trpc.teams.userTeams.queryOptions());
				setAddPlayerDialogOpen(false);
				setLoadingAddPlayer(false);
				addPlayerForm.reset();

				toast("Player added to the team.", {
					description: `We have sent an email to the player for confirmation.`,
				});
			},
		}),
	);

	const { onSubmit: onAddPlayer, form: addPlayerForm } = useTRPCMutationForm(addPlayer, {
		schema: TeamAddPlayerSchema,
		mode: "onBlur",
		reValidateMode: "onBlur",
		defaultValues: {
			playerName: "",
		},
	});

	const { mutateAsync: onKickPlayer } = useMutation(
		trpc.teams.kickPlayer.mutationOptions({
			onSuccess: (data) => {
				queryClient.invalidateQueries(trpc.teams.userTeams.queryOptions());
				toast(`${data?.name} is no longer in the team.`);
			},
		}),
	);

	const { mutateAsync: onLeaveTeam } = useMutation(
		trpc.teams.leaveTeam.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries(trpc.teams.userTeams.queryOptions());
				setLeaveTeamDialogOpen(false);
			},
		}),
	);

	const { mutateAsync: onDeleteTeam } = useMutation(
		trpc.teams.delete.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries(trpc.teams.userTeams.queryOptions());
				setDeleteTeamDialogOpen(false);
			},
		}),
	);

	return (
		<div>
			<DashboardHeader title="Your Teams" description="Create and manage your teams.">
				<div className="flex gap-2">
					<Link href="/teams/create">
						<Button className="font-bold rounded">Create Team</Button>
					</Link>
					<Link href="/notifications">
						<Button variant="outline" className="font-bold rounded">
							Notifications
						</Button>
					</Link>
				</div>
			</DashboardHeader>
			<div className="w-full h-full flex flex-col overflow-y-auto">
				{teams.length === 0 ? (
					<div className="w-full h-full flex items-center justify-center ">
						<div className="flex flex-col justify-center items-center">
							<Image
								alt=""
								src={"imgs/sad_face.svg"}
								width={64}
								height={64}
								className="mb-4"
							></Image>
							<span>You are not in a team</span>
							<span className="text-primary font-bold">Create one</span>
						</div>
					</div>
				) : (
					<div className="w-full h-full flex flex-col gap-6">
						{teams.map((team) => {
							return (
								<div className="w-full flex flex-col gap-2" key={team.id}>
									<div className="flex justify-between items-center">
										<div className="flex items-center gap-2">
											<span className="text-lg font-bold">{team.name}</span>
										</div>
										<div className="flex gap-3 items-center">
											<span>
												{team.members?.length || 0} member
												{(team.members?.length || 0) > 1 ? "s" : ""}
											</span>

											<>
												<span>|</span>
												<Link href={`/teams/${team.id}/manage`}>
													<Button size="sm" variant="outline">
														Manage
													</Button>
												</Link>
												<button
													className="text-primary hover:cursor-pointer"
													onClick={() => {
														setCurrentTeamToAddPlayer(team as any);
														setAddPlayerDialogOpen(true);
													}}
												>
													<UserPlusIcon />
												</button>
												<button
													className="hover:cursor-pointer"
													onClick={() => {
														setDeleteTeamDialogOpen(true);
														setTeamToDelete(team.id || "");
													}}
												>
													<TrashIcon className="stroke-destructive" />
												</button>
											</>
										</div>
									</div>
									<div className="border"></div>
									<div className="flex flex-col gap-2 px-2">
										{team.members?.map((member) => {
											const isCurrentUser = member.userId === userId;

											return (
												<div
													key={`${team.id}-${member.userId}`}
													className={`flex justify-between items-center`}
												>
													<div className="flex gap-1 items-center">
														<span
															className={cn(
																isCurrentUser && "underline",
															)}
														>
															{member.user.name} ({member.role})
														</span>
													</div>
													{isCurrentUser && (
														<DropdownMenu>
															<DropdownMenuTrigger className="bg-background-light px-2 rounded-md flex justify-center items-center hover:cursor-pointer">
																<span>...</span>
															</DropdownMenuTrigger>
															<DropdownMenuContent className="">
																<DropdownMenuItem
																	className="text-destructive"
																	onClick={() => {
																		setLeaveTeamDialogOpen(
																			true,
																		);
																		setTeamToLeave(team.id);
																	}}
																>
																	<XIcon className="mr-2 h-4 w-4 stroke-destructive" />
																	<span>Leave</span>
																</DropdownMenuItem>
															</DropdownMenuContent>
														</DropdownMenu>
													)}
													{!isCurrentUser && team.ownerId === userId && (
														<DropdownMenu>
															<DropdownMenuTrigger className="bg-background-light px-2 rounded-md flex justify-center items-center hover:cursor-pointer">
																<span>...</span>
															</DropdownMenuTrigger>
															<DropdownMenuContent className="">
																<DropdownMenuItem
																	className="text-destructive"
																	onClick={async () => {
																		await onKickPlayer({
																			teamId: team.id,
																			playerId: member.userId,
																		});
																	}}
																>
																	<UserX className="mr-2 h-4 w-4 stroke-destructive" />
																	<span>Kick</span>
																</DropdownMenuItem>
															</DropdownMenuContent>
														</DropdownMenu>
													)}
												</div>
											);
										})}
									</div>
								</div>
							);
						})}
					</div>
				)}
			</div>

			{/* Create Team Modal */}
			<Dialog open={createTeamDialogOpen} onOpenChange={setCreateTeamDialogOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Create Team</DialogTitle>
						<DialogDescription>
							Insert team name to create a new team.
						</DialogDescription>
					</DialogHeader>
					<div className="flex w-full">
						<Form {...createTeamForm}>
							<form onSubmit={onCreateTeam} className="space-y-4 w-full mt-0">
								<FormField
									control={createTeamForm.control}
									name="teamName"
									render={({ field }) => (
										<FormItem>
											{/* <FormLabel>Team Name</FormLabel> */}
											<FormControl>
												<Input placeholder="Team Name" {...field} />
											</FormControl>
											<FormMessage className="text-destructive" />
										</FormItem>
									)}
								/>
								<Button type="submit" className="w-full font-bold">
									Create
								</Button>
							</form>
						</Form>
					</div>
				</DialogContent>
			</Dialog>
			{/* Add Player Modal */}
			<Dialog open={addPlayerDialogOpen} onOpenChange={setAddPlayerDialogOpen}>
				<DialogContent className="max-w-sm">
					<DialogHeader>
						<DialogTitle>Add Player</DialogTitle>
						<DialogDescription>Insert player name.</DialogDescription>
					</DialogHeader>
					<div className="flex w-full">
						<Form {...addPlayerForm}>
							<form onSubmit={onAddPlayer} className="space-y-4 w-full mt-0">
								<FormField
									control={addPlayerForm.control}
									name="playerName"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Player Name</FormLabel>
											<FormControl>
												<Input placeholder="Player Name" {...field} />
											</FormControl>
											<FormMessage className="text-destructive" />
										</FormItem>
									)}
								/>
								<Button
									type="submit"
									className="w-full font-bold"
									disabled={loadingAddPlayer}
								>
									Add
								</Button>
							</form>
						</Form>
					</div>
				</DialogContent>
			</Dialog>

			{/* Confirm Leave Modal */}
			<Dialog open={leaveTeamDialogOpen} onOpenChange={setLeaveTeamDialogOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Are you sure absolutely sure?</DialogTitle>
						<DialogDescription>
							This action cannot be undone. This will remove you from the team.
						</DialogDescription>
					</DialogHeader>
					<div className="flex w-full justify-around ">
						<Button
							variant={"destructive"}
							onClick={async () => {
								if (!teamToLeave) return;
								await onLeaveTeam({ teamId: teamToLeave });
							}}
						>
							Yes
						</Button>
						<Button onClick={() => setLeaveTeamDialogOpen(false)}>No</Button>
					</div>
				</DialogContent>
			</Dialog>

			{/* Confirm Delete Modal */}
			<Dialog open={deleteTeamDialogOpen} onOpenChange={setDeleteTeamDialogOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Are you sure absolutely sure?</DialogTitle>
						<DialogDescription>
							This action cannot be undone. This will permanently delete the team.
						</DialogDescription>
					</DialogHeader>
					<div className="flex w-full justify-around ">
						<Button
							variant={"destructive"}
							onClick={async () => {
								if (!teamToDelete) return;
								await onDeleteTeam({ teamId: teamToDelete });
							}}
						>
							Yes
						</Button>
						<Button onClick={() => setDeleteTeamDialogOpen(false)}>No</Button>
					</div>
				</DialogContent>
			</Dialog>
		</div>
	);
}
