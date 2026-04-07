"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ClockIcon, UsersIcon, MapPinIcon, RefreshCwIcon, MessageCircleIcon } from "lucide-react";
import { REGIONS } from "@/constants/regions";
import { LocalizedDateTime } from "@/components/localized-datetime";
import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";

const RANK_TIERS = [
	"IRON",
	"BRONZE",
	"SILVER",
	"GOLD",
	"PLATINUM",
	"EMERALD",
	"DIAMOND",
	"MASTER",
	"GRANDMASTER",
	"CHALLENGER",
] as const;

type RankTier = (typeof RANK_TIERS)[number];

export default function ScrimsQueuePage() {
	const trpc = useTRPC();
	const [filters, setFilters] = useState({
		minRankTier: "" as RankTier | "",
		maxRankTier: "" as RankTier | "",
		regions: [] as string[],
	});

	const [autoRefresh, setAutoRefresh] = useState(true);
	const [lastRefresh, setLastRefresh] = useState(new Date());

	const {
		data: queueTeams = [],
		isLoading,
		refetch,
	} = useQuery(
		trpc.scrims.getQueue.queryOptions({
			...(filters.minRankTier && { minRankTier: filters.minRankTier as RankTier }),
			...(filters.maxRankTier && { maxRankTier: filters.maxRankTier as RankTier }),
			...(filters.regions.length > 0 && { regions: filters.regions as any }),
			limit: 50,
		}),
	);

	// Auto-refresh functionality
	useEffect(() => {
		if (!autoRefresh) return;

		const interval = setInterval(() => {
			refetch();
			setLastRefresh(new Date());
		}, 30000); // 30 seconds

		return () => clearInterval(interval);
	}, [autoRefresh, refetch]);

	const getRankBadgeColor = (tier: string) => {
		const colors: Record<string, string> = {
			IRON: "bg-gray-600",
			BRONZE: "bg-amber-700",
			SILVER: "bg-gray-400",
			GOLD: "bg-yellow-500",
			PLATINUM: "bg-teal-500",
			EMERALD: "bg-emerald-500",
			DIAMOND: "bg-blue-500",
			MASTER: "bg-purple-500",
			GRANDMASTER: "bg-red-500",
			CHALLENGER: "bg-gradient-to-r from-yellow-400 to-red-500",
		};
		return colors[tier] || "bg-gray-500";
	};

	const getTimeAgo = (date: Date) => {
		const now = new Date();
		const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

		if (diffInMinutes < 1) return "Just now";
		if (diffInMinutes === 1) return "1 minute ago";
		if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;

		const diffInHours = Math.floor(diffInMinutes / 60);
		if (diffInHours === 1) return "1 hour ago";
		return `${diffInHours} hours ago`;
	};

	return (
		<div className="container mx-auto py-8 px-6">
			<div className="mb-8">
				<div className="flex items-center gap-3 mb-2">
					<h1 className="text-3xl font-bold text-cyan-400">Live Scrim Queue</h1>
					<div className="flex items-center gap-2">
						<div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
						<span className="text-green-400 text-sm font-medium">LIVE</span>
					</div>
				</div>
				<p className="text-gray-300">Teams actively looking for scrims right now.</p>
				<div className="flex items-center gap-4 mt-4">
					<div className="flex items-center gap-2">
						<Checkbox
							checked={autoRefresh}
							onCheckedChange={(checked) => setAutoRefresh(checked === true)}
							id="auto-refresh"
						/>
						<label htmlFor="auto-refresh" className="text-sm text-gray-300">
							Auto-refresh (30s)
						</label>
					</div>
					<Button
						variant="outline"
						size="sm"
						onClick={() => {
							refetch();
							setLastRefresh(new Date());
						}}
						className="border-cyan-500 text-cyan-400 hover:bg-cyan-500/10"
					>
						<RefreshCwIcon className="h-4 w-4 mr-2" />
						Refresh
					</Button>
					<span className="text-xs text-gray-500">
						Last updated:{" "}
						<LocalizedDateTime date={lastRefresh} options={{ timeStyle: "medium" }} />
					</span>
				</div>
			</div>

			{/* Quick Filters */}
			<Card className="mb-6 bg-gray-900/50 border-cyan-500/20">
				<CardHeader>
					<CardTitle className="text-cyan-400">Quick Filters</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
						<div>
							<label className="block text-sm font-medium text-gray-300 mb-2">
								Min Rank
							</label>
							<Select
								value={filters.minRankTier}
								onValueChange={(value) =>
									setFilters((prev) => ({
										...prev,
										minRankTier: value as RankTier | "",
									}))
								}
							>
								<SelectTrigger className="bg-gray-800 border-gray-600">
									<SelectValue placeholder="Any rank" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="">Any rank</SelectItem>
									{RANK_TIERS.map((tier) => (
										<SelectItem key={tier} value={tier}>
											{tier}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-300 mb-2">
								Max Rank
							</label>
							<Select
								value={filters.maxRankTier}
								onValueChange={(value) =>
									setFilters((prev) => ({
										...prev,
										maxRankTier: value as RankTier | "",
									}))
								}
							>
								<SelectTrigger className="bg-gray-800 border-gray-600">
									<SelectValue placeholder="Any rank" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="">Any rank</SelectItem>
									{RANK_TIERS.map((tier) => (
										<SelectItem key={tier} value={tier}>
											{tier}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-300 mb-2">
								Region
							</label>
							<Select
								value={filters.regions[0] || ""}
								onValueChange={(value) =>
									setFilters((prev) => ({
										...prev,
										regions: value ? [value] : [],
									}))
								}
							>
								<SelectTrigger className="bg-gray-800 border-gray-600">
									<SelectValue placeholder="Any region" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="">Any region</SelectItem>
									{REGIONS.map((region) => (
										<SelectItem key={region.value} value={region.value}>
											{region.label}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Queue List */}
			{isLoading ? (
				<div className="text-center py-8">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto"></div>
					<p className="text-gray-300 mt-4">Loading live queue...</p>
				</div>
			) : queueTeams && queueTeams.length > 0 ? (
				<div className="grid gap-4">
					{(queueTeams as any[]).map((team: any) => (
						<Card
							key={team.id}
							className="bg-gray-900/50 border-cyan-500/20 hover:border-cyan-500/40 transition-colors"
						>
							<CardContent className="p-4">
								<div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
									<div className="flex-1">
										<div className="flex items-center gap-3 mb-2">
											<h3 className="text-lg font-semibold text-cyan-400">
												{team.name}
											</h3>
											<Badge
												variant="outline"
												className="text-cyan-300 border-cyan-500"
											>
												{team.tag}
											</Badge>
											<div className="flex items-center gap-1">
												<div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
												<span className="text-xs text-green-400">
													Looking now
												</span>
											</div>
										</div>

										<div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-sm text-gray-300">
											<div className="flex items-center gap-2">
												<ClockIcon className="h-4 w-4 text-cyan-400" />
												<span>{getTimeAgo(team.lookingSince)}</span>
											</div>
											<div className="flex items-center gap-2">
												<MapPinIcon className="h-4 w-4 text-cyan-400" />
												<span>{team.region}</span>
											</div>
											<div className="flex items-center gap-2">
												<UsersIcon className="h-4 w-4 text-cyan-400" />
												<span>{team.memberCount}/5 members</span>
											</div>
											{team.currentRank && (
												<div className="flex items-center gap-2">
													<Badge
														className={`text-xs ${getRankBadgeColor(team.currentRank)}`}
													>
														{team.currentRank}
													</Badge>
												</div>
											)}
										</div>

										{team.preferredGameModes &&
											team.preferredGameModes.length > 0 && (
												<div className="mt-2 flex flex-wrap gap-1">
													<span className="text-xs text-gray-400">
														Preferred:
													</span>
													{(team.preferredGameModes as string[]).map(
														(mode) => (
															<Badge
																key={mode}
																variant="secondary"
																className="text-xs"
															>
																{mode}
															</Badge>
														),
													)}
												</div>
											)}
									</div>

									<div className="flex flex-col gap-2 lg:w-40">
										<Button className="bg-cyan-600 hover:bg-cyan-700" size="sm">
											<MessageCircleIcon className="h-4 w-4 mr-2" />
											Contact
										</Button>
										<Button
											variant="outline"
											size="sm"
											className="border-cyan-500 text-cyan-400 hover:bg-cyan-500/10"
										>
											Quick Match
										</Button>
									</div>
								</div>
							</CardContent>
						</Card>
					))}
				</div>
			) : (
				<Card className="bg-gray-900/50 border-cyan-500/20">
					<CardContent className="text-center py-12">
						<ClockIcon className="h-12 w-12 text-gray-500 mx-auto mb-4" />
						<h3 className="text-lg font-medium text-gray-300 mb-2">
							No teams in queue
						</h3>
						<p className="text-gray-500 mb-4">
							No teams are currently looking for scrims. Check back in a few minutes!
						</p>
						<Button
							variant="outline"
							className="border-cyan-500 text-cyan-400 hover:bg-cyan-500/10"
						>
							Create Scrim Request
						</Button>
					</CardContent>
				</Card>
			)}
		</div>
	);
}
