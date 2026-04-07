"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
	BarChart3Icon,
	CalendarIcon,
	ChevronDownIcon,
	ChevronUpIcon,
	ClockIcon,
	HistoryIcon,
	RefreshCwIcon,
	ShieldIcon,
	SwordsIcon,
	TrophyIcon,
	TrendingDownIcon,
	TrendingUpIcon,
	UsersIcon,
} from "lucide-react";
import { useTRPC } from "@/trpc/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { LocalizedDateTime } from "@/components/localized-datetime";
import type { TeamProfile } from "../types";

export function TeamScrimsTab({ team, teamId }: { team: TeamProfile; teamId: string }) {
	const trpc = useTRPC();
	const [historyPage, setHistoryPage] = useState(1);
	const [expandedScrim, setExpandedScrim] = useState<string | null>(null);
	const historyLimit = 10;

	const { data: scrimHistory, isLoading: historyLoading } = useQuery({
		...trpc.teams.getScrimHistory.queryOptions({
			teamId,
			page: historyPage,
			limit: historyLimit,
		}),
	});

	const { data: upcomingScrims, isLoading: upcomingLoading } = useQuery({
		...trpc.teams.getUpcomingScrims.queryOptions({
			teamId,
		}),
	});

	const { data: availability, isLoading: availabilityLoading } = useQuery({
		...trpc.teams.getAvailability.queryOptions({
			teamId,
		}),
	});

	const { data: detailedScrims, refetch } = useQuery({
		...trpc.scrims.listByTeamId.queryOptions({
			teamId,
			limit: 50,
			offset: 0,
		}),
	});

	const toggleScrimDetails = (scrimId: string) => {
		setExpandedScrim(expandedScrim === scrimId ? null : scrimId);
	};

	const getResultBadge = (result: string) => {
		const styles = {
			WIN: "bg-green-600 text-white shadow-lg",
			LOSS: "bg-red-600 text-white shadow-lg",
			DRAW: "bg-yellow-600 text-white shadow-lg",
		};
		return styles[result as keyof typeof styles] || "bg-gray-600 text-white";
	};

	const completedScrims =
		detailedScrims?.filter((scrim) => scrim.status === "COMPLETED") || [];
	const totalDetailedScrims = completedScrims.length;
	const wins = completedScrims.filter((scrim) => scrim.winningTeamId === teamId).length;
	const winRate = totalDetailedScrims > 0 ? (wins / totalDetailedScrims) * 100 : 0;

	return (
		<div className="space-y-6">
			<Card className="bg-gray-900/30 backdrop-blur-xl border-cyan-500/30 shadow-2xl">
				<CardHeader>
					<CardTitle className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400 flex items-center gap-2">
						<BarChart3Icon className="h-6 w-6 text-cyan-400" />
						Scrim Statistics
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
						<div className="p-4 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 backdrop-blur-sm rounded-lg border border-cyan-500/20 text-center">
							<TrophyIcon className="h-8 w-8 text-cyan-400 mx-auto mb-2" />
							<p className="text-2xl font-bold text-cyan-400">
								{totalDetailedScrims}
							</p>
							<p className="text-sm text-gray-400">Total Scrims</p>
						</div>
						<div
							className={`p-4 bg-gradient-to-br ${
								winRate >= 50
									? "from-green-500/10 to-emerald-500/10 border-green-500/20"
									: "from-red-500/10 to-rose-500/10 border-red-500/20"
							} backdrop-blur-sm rounded-lg border text-center`}
						>
							<TrendingUpIcon
								className={`h-8 w-8 ${
									winRate >= 50 ? "text-green-400" : "text-red-400"
								} mx-auto mb-2`}
							/>
							<p
								className={`text-2xl font-bold ${
									winRate >= 50 ? "text-green-400" : "text-red-400"
								}`}
							>
								{winRate.toFixed(1)}%
							</p>
							<p className="text-sm text-gray-400">
								Win Rate ({wins}W - {totalDetailedScrims - wins}L)
							</p>
						</div>
						<div className="p-4 bg-gradient-to-br from-green-500/10 to-emerald-500/10 backdrop-blur-sm rounded-lg border border-green-500/20 text-center">
							<TrophyIcon className="h-8 w-8 text-green-400 mx-auto mb-2" />
							<p className="text-2xl font-bold text-green-400">{wins}</p>
							<p className="text-sm text-gray-400">Victories</p>
						</div>
						<div className="p-4 bg-gradient-to-br from-purple-500/10 to-pink-500/10 backdrop-blur-sm rounded-lg border border-purple-500/20 text-center">
							<ShieldIcon className="h-8 w-8 text-purple-400 mx-auto mb-2" />
							<p className="text-2xl font-bold text-purple-400">
								{team.tag || "N/A"}
							</p>
							<p className="text-sm text-gray-400">Team Tag</p>
						</div>
					</div>
				</CardContent>
			</Card>

			<Card className="bg-gray-900/30 backdrop-blur-xl border-cyan-500/30 shadow-2xl">
				<CardHeader>
					<CardTitle className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400 flex items-center gap-2">
						<CalendarIcon className="h-5 w-5 text-cyan-400" />
						Upcoming Scrims
					</CardTitle>
				</CardHeader>
				<CardContent>
					{upcomingLoading ? (
						<div className="text-center py-8">
							<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400 mx-auto"></div>
							<p className="text-gray-300 mt-2">Loading upcoming scrims...</p>
						</div>
					) : upcomingScrims && upcomingScrims.length > 0 ? (
						<div className="space-y-4">
							{upcomingScrims.map((scrim) => (
								<div
									key={scrim.id}
									className="p-4 bg-gradient-to-br from-blue-900/20 to-cyan-900/20 backdrop-blur-sm rounded-lg border border-blue-500/30 hover:border-blue-500/50 transition-all"
								>
									<div className="flex items-center justify-between">
										<div>
											<h4 className="font-medium text-cyan-400 mb-1">
												vs {scrim.opponent.name}
											</h4>
											<div className="flex items-center gap-4 text-sm text-gray-300">
												<div className="flex items-center gap-1">
													<CalendarIcon className="h-4 w-4" />
													<LocalizedDateTime
														date={scrim.scheduledTime}
														options={{
															dateStyle: "medium",
															timeStyle: "short",
														}}
													/>
												</div>
												<div className="flex items-center gap-1">
													<ClockIcon className="h-4 w-4" />
													<span>{scrim.durationMinutes} min</span>
												</div>
											</div>
										</div>
										<Badge className="bg-gradient-to-r from-blue-600 to-cyan-600 shadow-lg">
											{scrim.status}
										</Badge>
									</div>
								</div>
							))}
						</div>
					) : (
						<div className="text-center py-8">
							<CalendarIcon className="h-12 w-12 text-gray-500 mx-auto mb-4" />
							<h3 className="text-lg font-medium text-gray-300 mb-2">
								No upcoming scrims
							</h3>
							<p className="text-gray-500">This team has no scheduled scrims.</p>
						</div>
					)}
				</CardContent>
			</Card>

			<Card className="bg-gray-900/30 backdrop-blur-xl border-cyan-500/30 shadow-2xl">
				<CardHeader>
					<div className="flex items-center justify-between">
						<CardTitle className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400 flex items-center gap-2">
							<HistoryIcon className="h-5 w-5 text-cyan-400" />
							Recent Scrim History
						</CardTitle>
						<Button
							onClick={() => refetch()}
							variant="outline"
							size="sm"
							className="border-cyan-500/50 bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 backdrop-blur-sm"
						>
							<RefreshCwIcon className="h-4 w-4 mr-2" />
							Refresh
						</Button>
					</div>
				</CardHeader>
				<CardContent>
					{historyLoading ? (
						<div className="text-center py-8">
							<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400 mx-auto"></div>
							<p className="text-gray-300 mt-2">Loading history...</p>
						</div>
					) : scrimHistory && scrimHistory.scrims.length > 0 ? (
						<>
							<Table>
								<TableHeader>
									<TableRow className="border-gray-700/50">
										<TableHead className="text-gray-300">Date</TableHead>
										<TableHead className="text-gray-300">Opponent</TableHead>
										<TableHead className="text-gray-300">Result</TableHead>
										<TableHead className="text-gray-300">Score</TableHead>
										<TableHead className="text-gray-300">Duration</TableHead>
										<TableHead className="text-gray-300">Mode</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{scrimHistory.scrims.map((scrim) => (
										<TableRow
											key={scrim.id}
											className="border-gray-700/50 hover:bg-cyan-500/5 transition-colors"
										>
											<TableCell className="text-gray-300">
												<LocalizedDateTime
													date={scrim.playedAt}
													options={{
														dateStyle: "short",
														timeStyle: "short",
													}}
												/>
											</TableCell>
											<TableCell>
												<div className="flex items-center gap-2">
													<span className="text-cyan-400">
														{scrim.opponent.name}
													</span>
													<Badge
														variant="outline"
														className="text-xs border-cyan-500/50 bg-cyan-500/10"
													>
														{scrim.opponent.tag}
													</Badge>
												</div>
											</TableCell>
											<TableCell>
												<Badge className={getResultBadge(scrim.result)}>
													{scrim.result}
												</Badge>
											</TableCell>
											<TableCell className="text-gray-300">
												{scrim.score}
											</TableCell>
											<TableCell className="text-gray-300">
												{scrim.durationMinutes}m
											</TableCell>
											<TableCell className="text-gray-300">
												{scrim.gameMode}
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>

							{scrimHistory.totalPages > 1 && (
								<div className="flex items-center justify-center gap-2 mt-6">
									<Button
										variant="outline"
										size="sm"
										onClick={() => setHistoryPage((page) => Math.max(1, page - 1))}
										disabled={historyPage === 1}
										className="border-cyan-500/50 bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 backdrop-blur-sm"
									>
										Previous
									</Button>
									<span className="text-sm text-gray-400">
										Page {historyPage} of {scrimHistory.totalPages}
									</span>
									<Button
										variant="outline"
										size="sm"
										onClick={() =>
											setHistoryPage((page) =>
												Math.min(scrimHistory.totalPages, page + 1),
											)
										}
										disabled={historyPage === scrimHistory.totalPages}
										className="border-cyan-500/50 bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 backdrop-blur-sm"
									>
										Next
									</Button>
								</div>
							)}
						</>
					) : (
						<div className="text-center py-8">
							<SwordsIcon className="h-12 w-12 text-gray-500 mx-auto mb-4" />
							<h3 className="text-lg font-medium text-gray-300 mb-2">
								No scrim history
							</h3>
							<p className="text-gray-500">
								This team hasn&apos;t played any scrims yet.
							</p>
						</div>
					)}
				</CardContent>
			</Card>

			{detailedScrims && detailedScrims.length > 0 && (
				<Card className="bg-gray-900/30 backdrop-blur-xl border-cyan-500/30 shadow-2xl">
					<CardHeader>
						<CardTitle className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400 flex items-center gap-2">
							<ClockIcon className="h-5 w-5 text-cyan-400" />
							Detailed Scrim History
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="space-y-4">
							{detailedScrims.map((scrim) => {
								const isWin = scrim.winningTeamId === teamId;
								const opponent =
									scrim.creatingTeamId === teamId
										? scrim.opponentTeamId
										: scrim.creatingTeamId;

								return (
									<div
										key={scrim.id}
										className={`bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm border rounded-lg overflow-hidden hover:from-gray-800/70 hover:to-gray-900/70 transition-all duration-200 ${
											scrim.status === "COMPLETED"
												? isWin
													? "border-l-4 border-l-green-500 border-green-500/30"
													: "border-l-4 border-l-red-500 border-red-500/30"
												: "border-l-4 border-l-blue-500 border-blue-500/30"
										}`}
									>
										<div
											className="p-6 cursor-pointer"
											onClick={() => toggleScrimDetails(scrim.id)}
										>
											<div className="flex items-center justify-between">
												<div className="flex items-center gap-4">
													<div className="relative">
														<div className="w-12 h-12 bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border-2 border-cyan-500/30 rounded-lg flex items-center justify-center">
															<UsersIcon
																className="text-cyan-400"
																size={24}
															/>
														</div>
														<div className="absolute -bottom-1 -right-1 bg-gray-800 border border-cyan-500/50 rounded px-1 text-xs text-cyan-400">
															VS
														</div>
													</div>
													<div>
														<div className="text-white font-semibold text-lg">
															vs {opponent || "Unknown Team"}
														</div>
														<div className="flex items-center gap-2 text-gray-400 text-sm">
															<CalendarIcon size={12} />
															<span>
																{new Date(
																	scrim.startTime,
																).toLocaleDateString()}
															</span>
															<span>•</span>
															<span
																className={`px-2 py-1 rounded text-xs font-medium ${
																	scrim.status === "COMPLETED"
																		? "bg-green-500/20 text-green-400"
																		: scrim.status ===
																			  "CONFIRMED"
																			? "bg-blue-500/20 text-blue-400"
																			: "bg-yellow-500/20 text-yellow-400"
																}`}
															>
																{scrim.status}
															</span>
														</div>
													</div>
												</div>

												{scrim.status === "COMPLETED" && (
													<div className="text-right">
														<div
															className={`font-bold text-lg flex items-center gap-2 ${
																isWin ? "text-green-400" : "text-red-400"
															}`}
														>
															{isWin ? (
																<TrendingUpIcon size={16} />
															) : (
																<TrendingDownIcon size={16} />
															)}
															{isWin ? "VICTORY" : "DEFEAT"}
														</div>
														{scrim.matchDurationSeconds && (
															<div className="flex items-center gap-1 text-gray-400 text-sm">
																<ClockIcon size={12} />
																{Math.floor(
																	scrim.matchDurationSeconds / 60,
																)}
																:
																{(scrim.matchDurationSeconds % 60)
																	.toString()
																	.padStart(2, "0")}
															</div>
														)}
													</div>
												)}

												<div className="text-gray-400">
													{expandedScrim === scrim.id ? (
														<ChevronUpIcon size={20} />
													) : (
														<ChevronDownIcon size={20} />
													)}
												</div>
											</div>
										</div>

										{expandedScrim === scrim.id && (
											<div className="border-t border-gray-700/50 bg-gray-900/50">
												<div className="p-6 space-y-4">
													<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
														<div className="bg-gray-800/50 backdrop-blur-sm p-4 rounded-lg border border-gray-700/50">
															<div className="flex items-center gap-2 text-gray-400 mb-2 text-sm">
																<ClockIcon size={14} />
																Match Details
															</div>
															<div className="space-y-2 text-sm">
																<div className="flex justify-between">
																	<span className="text-gray-400">
																		Scheduled:
																	</span>
																	<span className="text-white">
																		{new Date(
																			scrim.startTime,
																		).toLocaleString()}
																	</span>
																</div>
																{scrim.completedAt && (
																	<div className="flex justify-between">
																		<span className="text-gray-400">
																			Completed:
																		</span>
																		<span className="text-white">
																			{new Date(
																				scrim.completedAt,
																			).toLocaleString()}
																		</span>
																	</div>
																)}
																<div className="flex justify-between">
																	<span className="text-gray-400">
																		Best of:
																	</span>
																	<span className="text-white">
																		{scrim.bestOf}
																	</span>
																</div>
															</div>
														</div>

														<div className="bg-gray-800/50 backdrop-blur-sm p-4 rounded-lg border border-gray-700/50">
															<div className="flex items-center gap-2 text-gray-400 mb-2 text-sm">
																<UsersIcon size={14} />
																Teams
															</div>
															<div className="space-y-2 text-sm">
																<div className="flex justify-between items-center">
																	<span className="text-gray-400">
																		Your Team:
																	</span>
																	<span className="text-white font-medium">
																		{team.name}
																	</span>
																</div>
																<div className="flex justify-between items-center">
																	<span className="text-gray-400">
																		Opponent:
																	</span>
																	<span className="text-white font-medium">
																		{opponent || "Unknown"}
																	</span>
																</div>
																{scrim.status === "COMPLETED" && (
																	<div className="flex justify-between items-center">
																		<span className="text-gray-400">
																			Winner:
																		</span>
																		<span
																			className={`font-medium ${
																				isWin
																					? "text-green-400"
																					: "text-red-400"
																			}`}
																		>
																			{isWin ? team.name : opponent}
																		</span>
																	</div>
																)}
															</div>
														</div>
													</div>

													{scrim.notes && (
														<div className="bg-gray-800/50 backdrop-blur-sm p-4 rounded-lg border border-gray-700/50">
															<div className="flex items-center gap-2 text-gray-400 mb-2 text-sm">
																<HistoryIcon size={14} />
																Notes
															</div>
															<p className="text-gray-300 text-sm">
																{scrim.notes}
															</p>
														</div>
													)}
												</div>
											</div>
										)}
									</div>
								);
							})}
						</div>
					</CardContent>
				</Card>
			)}

			<Card className="bg-gray-900/30 backdrop-blur-xl border-cyan-500/30 shadow-2xl">
				<CardHeader>
					<CardTitle className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400 flex items-center gap-2">
						<CalendarIcon className="h-5 w-5 text-cyan-400" />
						Team Availability
					</CardTitle>
				</CardHeader>
				<CardContent>
					{availabilityLoading ? (
						<div className="text-center py-8">
							<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400 mx-auto"></div>
							<p className="text-gray-300 mt-2">Loading availability...</p>
						</div>
					) : availability ? (
						<div className="space-y-6">
							<div>
								<h4 className="text-lg font-medium text-cyan-400 mb-3">
									Preferred Times
								</h4>
								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									{availability.preferredTimes?.map((timeSlot, index) => (
										<div
											key={index}
											className="flex items-center justify-between p-3 bg-gradient-to-br from-cyan-900/20 to-blue-900/20 backdrop-blur-sm rounded-lg border border-cyan-500/20"
										>
											<span className="text-gray-300">{timeSlot.day}</span>
											<span className="text-cyan-400">{timeSlot.timeRange}</span>
										</div>
									)) || (
										<p className="text-gray-500 col-span-2">
											No preferred times set
										</p>
									)}
								</div>
							</div>

							<div>
								<h4 className="text-lg font-medium text-cyan-400 mb-3">Timezone</h4>
								<p className="text-gray-300 p-3 bg-gradient-to-br from-purple-900/20 to-pink-900/20 backdrop-blur-sm rounded-lg border border-purple-500/20">
									{availability.timezone || "Not specified"}
								</p>
							</div>

							<div>
								<h4 className="text-lg font-medium text-cyan-400 mb-3">Notes</h4>
								<p className="text-gray-300 p-3 bg-gradient-to-br from-green-900/20 to-emerald-900/20 backdrop-blur-sm rounded-lg border border-green-500/20">
									{availability.notes || "No additional availability notes"}
								</p>
							</div>
						</div>
					) : (
						<div className="text-center py-8">
							<CalendarIcon className="h-12 w-12 text-gray-500 mx-auto mb-4" />
							<h3 className="text-lg font-medium text-gray-300 mb-2">
								No availability info
							</h3>
							<p className="text-gray-500">
								This team hasn&apos;t set their availability preferences.
							</p>
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
