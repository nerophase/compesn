"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BarChart3Icon, CalendarIcon, TrophyIcon } from "lucide-react";
import { useTRPC } from "@/trpc/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import type { TeamProfile } from "../types";

export function TeamStatsTab({ team }: { team: TeamProfile }) {
	const trpc = useTRPC();
	const [selectedMember, setSelectedMember] = useState<string | null>(null);
	const [statsSource, setStatsSource] = useState<"riot" | "scrim">("riot");

	const { data: playerStats, isLoading } = useQuery({
		...trpc.stats.getPlayerMetrics.queryOptions({
			userId: selectedMember || team.members?.[0]?.userId,
			source: statsSource,
			count: 20,
		}),
		enabled: !!selectedMember || !!team.members?.[0]?.userId,
	});

	useEffect(() => {
		if (team.members && team.members.length > 0 && !selectedMember) {
			setSelectedMember(team.members[0].userId);
		}
	}, [team.members, selectedMember]);

	return (
		<div className="space-y-6">
			<Card className="bg-gray-900/30 backdrop-blur-xl border-cyan-500/30 shadow-2xl">
				<CardHeader>
					<CardTitle className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">
						Player Statistics
					</CardTitle>
					<CardDescription className="text-gray-400">
						View individual performance metrics
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="flex gap-4 items-end">
						<div className="flex-1 space-y-2">
							<Label className="text-gray-300">Select Player</Label>
							<Select value={selectedMember || ""} onValueChange={setSelectedMember}>
								<SelectTrigger className="bg-gray-800/50 backdrop-blur-sm border-gray-600">
									<SelectValue placeholder="Select a player" />
								</SelectTrigger>
								<SelectContent className="bg-gray-900/95 backdrop-blur-xl border-cyan-500/30">
									{team.members?.map((member) => (
										<SelectItem key={member.userId} value={member.userId}>
											{member.user.name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						<div className="flex-1 space-y-2">
							<Label className="text-gray-300">Stats Source</Label>
							<Select
								value={statsSource}
								onValueChange={(value) => setStatsSource(value as "riot" | "scrim")}
							>
								<SelectTrigger className="bg-gray-800/50 backdrop-blur-sm border-gray-600">
									<SelectValue />
								</SelectTrigger>
								<SelectContent className="bg-gray-900/95 backdrop-blur-xl border-cyan-500/30">
									<SelectItem value="riot">Riot Games (Ranked)</SelectItem>
									<SelectItem value="scrim">Scrims Only</SelectItem>
								</SelectContent>
							</Select>
						</div>
					</div>

					{isLoading ? (
						<div className="text-center py-8">
							<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400 mx-auto"></div>
							<p className="text-gray-400 mt-2">Loading stats...</p>
						</div>
					) : playerStats?.aggregateStats ? (
						<div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
							<div className="p-4 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 backdrop-blur-sm rounded-lg border border-cyan-500/20 text-center">
								<p className="text-2xl font-bold text-cyan-400">
									{playerStats.aggregateStats.totalGames}
								</p>
								<p className="text-sm text-gray-400">Games Played</p>
							</div>
							<div className="p-4 bg-gradient-to-br from-green-500/10 to-emerald-500/10 backdrop-blur-sm rounded-lg border border-green-500/20 text-center">
								<p className="text-2xl font-bold text-green-400">
									{playerStats.aggregateStats.winRate}%
								</p>
								<p className="text-sm text-gray-400">Win Rate</p>
							</div>
							<div className="p-4 bg-gradient-to-br from-purple-500/10 to-pink-500/10 backdrop-blur-sm rounded-lg border border-purple-500/20 text-center">
								<p className="text-2xl font-bold text-purple-400">
									{playerStats.aggregateStats.averageKDA.ratio}
								</p>
								<p className="text-sm text-gray-400">KDA Ratio</p>
							</div>
							<div className="p-4 bg-gradient-to-br from-yellow-500/10 to-orange-500/10 backdrop-blur-sm rounded-lg border border-yellow-500/20 text-center">
								<p className="text-2xl font-bold text-yellow-400">
									{playerStats.aggregateStats.averageCSAt10}
								</p>
								<p className="text-sm text-gray-400">CS @ 10</p>
							</div>
						</div>
					) : (
						<p className="text-center text-gray-400 py-8">No stats available</p>
					)}

					{playerStats?.aggregateStats && (
						<div className="mt-4 p-4 bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm rounded-lg border border-gray-700/50">
							<h3 className="text-sm font-medium text-gray-300 mb-3">Average KDA</h3>
							<div className="flex items-center justify-around">
								<div className="text-center">
									<p className="text-xl font-bold text-green-400">
										{playerStats.aggregateStats.averageKDA.kills}
									</p>
									<p className="text-xs text-gray-500">Kills</p>
								</div>
								<span className="text-gray-600">/</span>
								<div className="text-center">
									<p className="text-xl font-bold text-red-400">
										{playerStats.aggregateStats.averageKDA.deaths}
									</p>
									<p className="text-xs text-gray-500">Deaths</p>
								</div>
								<span className="text-gray-600">/</span>
								<div className="text-center">
									<p className="text-xl font-bold text-blue-400">
										{playerStats.aggregateStats.averageKDA.assists}
									</p>
									<p className="text-xs text-gray-500">Assists</p>
								</div>
							</div>
						</div>
					)}
				</CardContent>
			</Card>

			<Card className="bg-gray-900/30 backdrop-blur-xl border-cyan-500/30 shadow-2xl">
				<CardHeader>
					<CardTitle className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">
						Team-Wide Statistics
					</CardTitle>
					<CardDescription className="text-gray-400">
						Aggregated performance across all members
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="grid grid-cols-2 md:grid-cols-3 gap-4">
						<div className="p-4 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 backdrop-blur-sm rounded-lg border border-cyan-500/20 text-center">
							<TrophyIcon className="h-8 w-8 text-cyan-400 mx-auto mb-2" />
							<p className="text-2xl font-bold text-cyan-400">
								{team.stats?.winRate || 0}%
							</p>
							<p className="text-sm text-gray-400">Team Win Rate</p>
						</div>
						<div className="p-4 bg-gradient-to-br from-purple-500/10 to-pink-500/10 backdrop-blur-sm rounded-lg border border-purple-500/20 text-center">
							<BarChart3Icon className="h-8 w-8 text-purple-400 mx-auto mb-2" />
							<p className="text-2xl font-bold text-purple-400">
								{team.members?.length || 0}
							</p>
							<p className="text-sm text-gray-400">Active Players</p>
						</div>
						<div className="p-4 bg-gradient-to-br from-green-500/10 to-emerald-500/10 backdrop-blur-sm rounded-lg border border-green-500/20 text-center">
							<CalendarIcon className="h-8 w-8 text-green-400 mx-auto mb-2" />
							<p className="text-2xl font-bold text-green-400">
								{team.stats?.totalScrims || 0}
							</p>
							<p className="text-sm text-gray-400">Total Scrims</p>
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
