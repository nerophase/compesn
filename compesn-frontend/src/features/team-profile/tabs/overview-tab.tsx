"use client";

import { useSession } from "next-auth/react";
import { HistoryIcon, TrophyIcon, UsersIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
	ChallengeTeamDialog,
	InvitePlayerButton,
	MessageTeamDialog,
	OpenTeamChatButton,
	ScheduleScrimDialog,
} from "../actions";
import type { TeamProfile, ViewerTeam } from "../types";

export function TeamOverviewTab({
	team,
	isOwner,
	isMember,
	viewerTeams,
}: {
	team: TeamProfile;
	isOwner: boolean;
	isMember: boolean;
	viewerTeams: ViewerTeam[];
}) {
	const { data: session } = useSession();
	const isUserLoggedIn = !!session?.user.id;

	return (
		<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
			<Card
				className={cn(
					"bg-gray-900/30 backdrop-blur-xl border-cyan-500/30 shadow-2xl lg:col-span-2",
					!isUserLoggedIn && "lg:col-span-3",
				)}
			>
				<CardHeader>
					<CardTitle className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">
						Team Performance
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
						<div className="text-center p-4 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 backdrop-blur-sm rounded-lg border border-cyan-500/20">
							<p className="text-3xl font-bold text-cyan-400">
								{team.stats?.winRate || 0}%
							</p>
							<p className="text-sm text-gray-400">Win Rate</p>
						</div>
						<div className="text-center p-4 bg-gradient-to-br from-purple-500/10 to-pink-500/10 backdrop-blur-sm rounded-lg border border-purple-500/20">
							<p className="text-3xl font-bold text-purple-400">
								{team.stats?.totalScrims || 0}
							</p>
							<p className="text-sm text-gray-400">Total Scrims</p>
						</div>
						<div className="text-center p-4 bg-gradient-to-br from-green-500/10 to-emerald-500/10 backdrop-blur-sm rounded-lg border border-green-500/20">
							<p className="text-3xl font-bold text-green-400">
								{team.stats?.avgDuration || 0}m
							</p>
							<p className="text-sm text-gray-400">Avg Duration</p>
						</div>
						<div className="text-center p-4 bg-gradient-to-br from-yellow-500/10 to-orange-500/10 backdrop-blur-sm rounded-lg border border-yellow-500/20">
							<p className="text-3xl font-bold text-yellow-400">
								{team.stats?.recentForm || "N/A"}
							</p>
							<p className="text-sm text-gray-400">Recent Form</p>
						</div>
					</div>
				</CardContent>
			</Card>

			{isUserLoggedIn && (
				<Card className="bg-gray-900/30 backdrop-blur-xl border-cyan-500/30 shadow-2xl">
					<CardHeader>
						<CardTitle className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">
							Quick Actions
						</CardTitle>
					</CardHeader>
					<CardContent className="grid grid-cols-2 gap-2">
						{isMember && (
							<>
								<OpenTeamChatButton team={team} className="w-full" />
								<ScheduleScrimDialog team={team} />
								{isOwner && <InvitePlayerButton team={team} />}
							</>
						)}
						{!isMember && (
							<>
								<ChallengeTeamDialog team={team} />
								{viewerTeams.length > 0 && (
									<MessageTeamDialog team={team} viewerTeams={viewerTeams} />
								)}
							</>
						)}
						<Button
							variant="outline"
							className="w-full border-gray-600/50 bg-gray-600/10 text-gray-300 hover:bg-gray-600/20 backdrop-blur-sm col-span-2"
						>
							<HistoryIcon className="h-4 w-4 mr-2" />
							View Full History
						</Button>
					</CardContent>
				</Card>
			)}

			<Card className="bg-gray-900/30 backdrop-blur-xl border-cyan-500/30 shadow-2xl lg:col-span-3">
				<CardHeader>
					<CardTitle className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">
						Team Roster
					</CardTitle>
					<CardDescription className="text-gray-400">
						{team.members?.length || 0} member
						{(team.members?.length || 0) !== 1 ? "s" : ""}
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
						{team.members?.map((member) => (
							<div
								key={member.id}
								className="flex items-center gap-3 p-4 bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm rounded-lg border border-gray-700/50 hover:border-cyan-500/50 transition-all duration-200"
							>
								<div className="w-12 h-12 bg-gradient-to-br from-cyan-500/20 to-purple-500/20 rounded-full flex items-center justify-center border border-cyan-500/30">
									<UsersIcon className="h-6 w-6 text-cyan-400" />
								</div>
								<div className="flex-1 min-w-0">
									<p className="font-medium text-gray-300 truncate">
										{member.user.name}
									</p>
									<p className="text-sm text-gray-500">
										{member.role || "Member"}
									</p>
								</div>
								{team.ownerId === member.userId && (
									<Badge className="bg-gradient-to-r from-yellow-600 to-orange-600 shadow-lg">
										Owner
									</Badge>
								)}
							</div>
						))}
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
