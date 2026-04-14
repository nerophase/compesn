"use client";

import { useState, type ReactNode } from "react";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import {
	ArrowLeftIcon,
	BarChart3Icon,
	HistoryIcon,
	MapPinIcon,
	ShieldIcon,
	SwordsIcon,
	TrophyIcon,
	UsersIcon,
} from "lucide-react";
import { toast } from "sonner";
import { useTRPC } from "@/trpc/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { CreateTeamDialog } from "@/components/create-team-dialog";
import {
	ChallengeTeamDialog,
	MessageTeamDialog,
	OpenTeamChatButton,
} from "@/features/team-profile/actions";
import { TeamDraftHistoryTab } from "@/features/team-profile/tabs/draft-history-tab";
import { TeamOverviewTab } from "@/features/team-profile/tabs/overview-tab";
import { TeamRosterTab } from "@/features/team-profile/tabs/roster-tab";
import { TeamScrimsTab } from "@/features/team-profile/tabs/scrims-tab";
import { TeamStatsTab } from "@/features/team-profile/tabs/stats-tab";
import type { TeamProfile } from "@/features/team-profile/types";

type TeamProfileTab = "overview" | "roster" | "stats" | "scrims" | "drafts";

export default function TeamProfilePage() {
	const { data: session } = useSession();
	const isUserLoggedIn = !!session?.user.id;
	const trpc = useTRPC();
	const queryClient = useQueryClient();
	const params = useParams();
	const router = useRouter();
	const teamId = params.id as string;
	const [showCreateDialog, setShowCreateDialog] = useState(false);
	const [activeTab, setActiveTab] = useState<TeamProfileTab>("overview");

	const {
		data: fullTeam,
		isLoading,
	} = useQuery({
		...trpc.teams.getById.queryOptions({
			teamId,
		}),
	});

	const { data: userTeamsData } = useQuery({
		...trpc.teams.userTeams.queryOptions(),
		enabled: !!session?.user,
	});

	const { data: userInvites = [] } = useQuery({
		...trpc.teams.userInvites.queryOptions(),
		enabled: !!session?.user,
	});

	const viewerTeams = userTeamsData?.map((membership) => membership.team) ?? [];
	const viewerTeamsExcludingCurrent = viewerTeams.filter((team) => team.id !== teamId);
	const currentUserInvite = userInvites.find((invite) => invite.teamId === teamId);
	const isOwner = fullTeam?.ownerId === session?.user?.id;
	const isMember = userTeamsData?.some((membership) => membership.team.id === teamId) ?? false;

	const respondToInviteMutation = useMutation(
		trpc.teams.respondToInvite.mutationOptions({
			onSuccess: (_, variables) => {
				void queryClient.invalidateQueries(trpc.teams.userInvites.queryOptions());
				void queryClient.invalidateQueries(trpc.teams.userTeams.queryOptions());
				void queryClient.invalidateQueries({ queryKey: [["teams", "list"]] });
				void queryClient.invalidateQueries(trpc.teams.getById.queryOptions({ teamId }));
				toast.success(
					variables.response === "ACCEPT"
						? "Team invitation accepted."
						: "Team invitation declined.",
				);
			},
			onError: (error) => {
				toast.error(error.message);
			},
		}),
	);

	if (isLoading) {
		return (
			<div className="min-h-screen flex items-center">
				<div className="container mx-auto py-8 px-6">
					<div className="text-center py-12">
						<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto"></div>
						<p className="text-gray-300 mt-4">Loading team...</p>
					</div>
				</div>
			</div>
		);
	}

	if (!fullTeam) {
		return (
			<div className="min-h-screen">
				<div className="container mx-auto py-8 px-6">
					<Card className="bg-gray-900/30 backdrop-blur-xl border-cyan-500/20 shadow-2xl">
						<CardContent className="text-center py-12">
							<UsersIcon className="h-12 w-12 text-gray-500 mx-auto mb-4" />
							<h3 className="text-lg font-medium text-gray-300 mb-2">
								Team not found
							</h3>
							<p className="text-gray-500">
								The team you&apos;re looking for doesn&apos;t exist or has been
								removed.
							</p>
							<Button
								onClick={() => router.push("/teams")}
								className="mt-4 bg-cyan-600 hover:bg-cyan-700"
							>
								Back to Teams
							</Button>
						</CardContent>
					</Card>
				</div>
			</div>
		);
	}

	const team = fullTeam as TeamProfile;

	return (
		<div className="min-h-screen">
			<div className="container mx-auto py-8 px-6">
				<Button
					variant="ghost"
					onClick={() => router.push("/teams")}
					className="mb-4 text-gray-400 hover:text-cyan-400"
				>
					<ArrowLeftIcon className="h-4 w-4 mr-2" />
					Back to Teams
				</Button>

				<Card className="bg-gray-900/30 backdrop-blur-xl border-cyan-500/30 shadow-2xl mb-6">
					<CardContent className="p-8">
						<div className="flex flex-col lg:flex-row lg:items-center gap-6">
							<div className="flex items-center gap-6">
								<div className="w-24 h-24 bg-gradient-to-br from-cyan-500/20 to-purple-500/20 backdrop-blur-sm rounded-xl border border-cyan-500/30 flex items-center justify-center shadow-lg">
									<ShieldIcon className="h-12 w-12 text-cyan-400" />
								</div>
								<div>
									<h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400 mb-1">
										{team.name}
									</h1>
									<p className="text-xl text-gray-300 mb-3">[{team.tag}]</p>
									<div className="flex items-center gap-4 flex-wrap">
										{team.region && (
											<Badge
												variant="outline"
												className="border-cyan-500/50 bg-cyan-500/10 text-cyan-400 backdrop-blur-sm"
											>
												<MapPinIcon className="h-3 w-3 mr-1" />
												{team.region.toUpperCase()}
											</Badge>
										)}
										{team.currentRank && (
											<Badge className="bg-purple-600/80 backdrop-blur-sm shadow-lg">
												<TrophyIcon className="h-3 w-3 mr-1" />
												{team.currentRank}
											</Badge>
										)}
										<Badge
											variant="outline"
											className="border-blue-500/50 bg-blue-500/10 text-blue-400 backdrop-blur-sm"
										>
											{team.activityLevel || "REGULAR"}
										</Badge>
										<div className="flex items-center gap-1 text-gray-400">
											<UsersIcon className="h-4 w-4" />
											<span className="text-sm">
												{team.members?.length || 0} Members
											</span>
										</div>
									</div>
								</div>
							</div>

							<div className="flex flex-col sm:flex-row gap-3 lg:ml-auto">
								{currentUserInvite ? (
									<>
										<Button
											onClick={() =>
												respondToInviteMutation.mutate({
													inviteId: currentUserInvite.id,
													response: "ACCEPT",
												})
											}
											disabled={respondToInviteMutation.isPending}
											className="bg-emerald-600 hover:bg-emerald-700"
										>
											Accept Invite
										</Button>
										<Button
											variant="outline"
											onClick={() =>
												respondToInviteMutation.mutate({
													inviteId: currentUserInvite.id,
													response: "DECLINE",
												})
											}
											disabled={respondToInviteMutation.isPending}
										>
											Decline Invite
										</Button>
									</>
								) : !isMember && isUserLoggedIn ? (
									<>
										<ChallengeTeamDialog team={team} />
										{viewerTeamsExcludingCurrent.length > 0 && (
											<MessageTeamDialog
												team={team}
												viewerTeams={viewerTeamsExcludingCurrent}
											/>
										)}
									</>
								) : isMember && isUserLoggedIn ? (
									<OpenTeamChatButton team={team} />
								) : null}
								{isOwner && (
									<CreateTeamDialog
										open={showCreateDialog}
										team={team}
										onOpenChange={setShowCreateDialog}
									/>
								)}
							</div>
						</div>

						<div className="flex gap-2 mt-6 border-t border-gray-700/50 pt-4">
							<TeamTabButton
								icon={<TrophyIcon className="h-4 w-4 mr-2" />}
								isActive={activeTab === "overview"}
								onClick={() => setActiveTab("overview")}
							>
								Overview
							</TeamTabButton>
							<TeamTabButton
								icon={<UsersIcon className="h-4 w-4 mr-2" />}
								isActive={activeTab === "roster"}
								onClick={() => setActiveTab("roster")}
							>
								Roster
							</TeamTabButton>
							<TeamTabButton
								icon={<BarChart3Icon className="h-4 w-4 mr-2" />}
								isActive={activeTab === "stats"}
								onClick={() => setActiveTab("stats")}
							>
								Stats
							</TeamTabButton>
							<TeamTabButton
								icon={<SwordsIcon className="h-4 w-4 mr-2" />}
								isActive={activeTab === "scrims"}
								onClick={() => setActiveTab("scrims")}
							>
								Scrims
							</TeamTabButton>
							<TeamTabButton
								icon={<HistoryIcon className="h-4 w-4 mr-2" />}
								isActive={activeTab === "drafts"}
								onClick={() => setActiveTab("drafts")}
							>
								Draft History
							</TeamTabButton>
						</div>
					</CardContent>
				</Card>

				{activeTab === "overview" && (
					<TeamOverviewTab
						team={team}
						isOwner={isOwner}
						isMember={isMember}
						viewerTeams={viewerTeamsExcludingCurrent}
					/>
				)}
				{activeTab === "roster" && <TeamRosterTab team={team} isOwner={isOwner} />}
				{activeTab === "stats" && <TeamStatsTab team={team} />}
				{activeTab === "scrims" && <TeamScrimsTab team={team} teamId={teamId} />}
				{activeTab === "drafts" && <TeamDraftHistoryTab teamId={teamId} />}
			</div>
		</div>
	);
}

function TeamTabButton({
	children,
	icon,
	isActive,
	onClick,
}: {
	children: ReactNode;
	icon: ReactNode;
	isActive: boolean;
	onClick: () => void;
}) {
	return (
		<Button
			variant={isActive ? "default" : "ghost"}
			onClick={onClick}
			className={
				isActive
					? "bg-gradient-to-r from-cyan-600 to-cyan-500 shadow-lg"
					: "text-gray-400 hover:text-cyan-400 hover:bg-cyan-500/10"
			}
		>
			{icon}
			{children}
		</Button>
	);
}
