"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
	Trophy,
	Target,
	Eye,
	Sword,
	Shield,
	Activity,
	TrendingUp,
	Clock,
	Gamepad2,
	Crosshair,
	Mountain,
	Zap,
	Crown,
	Medal,
	Star,
	Calendar,
	BarChart3,
	Users,
	Flame,
	Sparkles,
	Award,
	RefreshCw,
	MessageCircle,
	UserPlus,
} from "lucide-react";
import Image from "next/image";
import { useTRPC } from "@/trpc/client";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { toast } from "sonner";

// Data source toggle component
const DataSourceToggle = ({
	source,
	onSourceChange,
}: {
	source: "riot" | "scrim";
	onSourceChange: (source: "riot" | "scrim") => void;
}) => {
	return (
		<div className="flex items-center bg-slate-800/50 border border-slate-700/50 rounded-lg p-1">
			<button
				onClick={() => onSourceChange("riot")}
				className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
					source === "riot"
						? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg"
						: "text-slate-400 hover:text-white hover:bg-slate-700/50"
				}`}
			>
				<Crown size={16} />
				Riot History
			</button>
			<button
				onClick={() => onSourceChange("scrim")}
				className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
					source === "scrim"
						? "bg-gradient-to-r from-green-600 to-blue-600 text-white shadow-lg"
						: "text-slate-400 hover:text-white hover:bg-slate-700/50"
				}`}
			>
				<Users size={16} />
				Scrim History
			</button>
		</div>
	);
};

// Stats card component
const StatsCard = ({
	icon,
	title,
	value,
	subtitle,
	color = "blue",
}: {
	icon: React.ReactNode;
	title: string;
	value: string | number;
	subtitle?: string;
	color?: "blue" | "green" | "purple" | "yellow" | "red";
}) => {
	const colorClasses = {
		blue: "from-blue-500/10 to-cyan-500/10 border-blue-500/20 text-blue-400",
		green: "from-green-500/10 to-emerald-500/10 border-green-500/20 text-green-400",
		purple: "from-purple-500/10 to-violet-500/10 border-purple-500/20 text-purple-400",
		yellow: "from-yellow-500/10 to-orange-500/10 border-yellow-500/20 text-yellow-400",
		red: "from-red-500/10 to-rose-500/10 border-red-500/20 text-red-400",
	};

	return (
		<div className={`bg-gradient-to-br ${colorClasses[color]} border rounded-lg p-4`}>
			<div className="flex items-center gap-2 mb-2">
				{icon}
				<span className="text-sm font-medium text-slate-300">{title}</span>
			</div>
			<div className="text-2xl font-bold text-white mb-1">{value}</div>
			{subtitle && <div className="text-xs text-slate-400">{subtitle}</div>}
		</div>
	);
};

// Champion image helper
const getChampionImage = (championId: number) => {
	// This would need to be mapped to actual champion names
	// For now, using a placeholder
	return `https://ddragon.leagueoflegends.com/cdn/13.24.1/img/champion/Jinx.png`;
};

// Role icon helper
const getRoleIcon = (role?: string) => {
	switch (role?.toLowerCase()) {
		case "adc":
		case "bot":
			return <Crosshair className="text-orange-400" size={16} />;
		case "support":
			return <Shield className="text-blue-400" size={16} />;
		case "jungle":
			return <Mountain className="text-green-400" size={16} />;
		case "mid":
			return <Zap className="text-purple-400" size={16} />;
		case "top":
			return <Sword className="text-red-400" size={16} />;
		default:
			return <Gamepad2 className="text-gray-400" size={16} />;
	}
};

export default function UserStatsPage() {
	const trpc = useTRPC();
	const router = useRouter();
	const queryClient = useQueryClient();
	const { status: sessionStatus } = useSession();
	const params = useParams();
	const userIdParam = params.userId as string;
	const isPuuid = userIdParam.length > 50; // Simple heuristic for PUUID (78 chars) vs UUID (36 chars)
	const [dataSource, setDataSource] = useState<"riot" | "scrim">("riot");

	const { data: currentUser } = useQuery({
		...trpc.auth.authenticatedUser.queryOptions(),
		enabled: sessionStatus === "authenticated",
	});

	// Fetch player metrics based on selected data source
	const {
		data: playerMetrics,
		isLoading,
		error,
		refetch,
	} = useQuery(
		trpc.stats.getPlayerMetrics.queryOptions({
			userId: isPuuid ? undefined : userIdParam,
			puuid: isPuuid ? userIdParam : undefined,
			source: dataSource,
			count: 20,
		}),
	);

	const relationshipEnabled =
		!isPuuid && sessionStatus === "authenticated" && !!currentUser && currentUser.id !== userIdParam;

	const { data: friendshipState } = useQuery(
		trpc.friends.getRelationship.queryOptions(
			{
				userId: userIdParam,
			},
			{
				enabled: relationshipEnabled,
			},
		),
	);

	const createConversationMutation = useMutation(
		trpc.messages.createOrGetDirectConversation.mutationOptions({
			onSuccess: ({ conversationId }) => {
				router.push(`/messages?conversationId=${conversationId}`);
			},
			onError: (error) => {
				toast.error(error.message || "Unable to open conversation");
			},
		}),
	);

	const sendFriendRequestMutation = useMutation(
		trpc.friends.sendRequest.mutationOptions({
			onSuccess: (result: any) => {
				if (result?.autoAccepted) {
					toast.success("Friend request accepted.");
				} else {
					toast.success("Friend request sent.");
				}
				void queryClient.invalidateQueries({
					queryKey: [["friends", "getRelationship"]],
				});
			},
			onError: (error) => {
				toast.error(error.message || "Unable to send friend request");
			},
		}),
	);

	const canShowPlayerActions =
		!isPuuid && sessionStatus === "authenticated" && !!currentUser && currentUser.id !== userIdParam;

	const friendshipButtonLabel =
		friendshipState?.status === "ACCEPTED"
			? "Friends"
			: friendshipState?.status === "OUTGOING_PENDING"
				? "Request Sent"
				: friendshipState?.status === "BLOCKED"
					? "Blocked"
					: "Add Friend";

	const friendshipButtonDisabled =
		sendFriendRequestMutation.isPending ||
		friendshipState?.status === "ACCEPTED" ||
		friendshipState?.status === "OUTGOING_PENDING" ||
		friendshipState?.status === "BLOCKED";

	const handleRefresh = () => {
		refetch();
	};

	const handleMessage = () => {
		if (!canShowPlayerActions) return;

		createConversationMutation.mutate({
			targetUserId: userIdParam,
		});
	};

	const handleFriendRequest = () => {
		if (!canShowPlayerActions || friendshipButtonDisabled) return;

		sendFriendRequestMutation.mutate({
			addresseeId: userIdParam,
		});
	};

	if (isLoading) {
		return (
			<div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900 text-white">
				<div className="container mx-auto px-4 pt-8">
					<div className="flex items-center justify-center h-64">
						<div className="flex items-center gap-3">
							<RefreshCw className="animate-spin text-blue-400" size={24} />
							<span className="text-lg text-slate-300">Loading stats...</span>
						</div>
					</div>
				</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900 text-white">
				<div className="container mx-auto px-4 pt-8">
					<div className="flex items-center justify-center h-64">
						<div className="text-center">
							<div className="text-red-400 text-lg mb-2">Error loading stats</div>
							<div className="text-slate-400 text-sm mb-4">{error.message}</div>
							<button
								onClick={handleRefresh}
								className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white px-4 py-2 rounded-lg transition-all duration-200 flex items-center gap-2 mx-auto"
							>
								<RefreshCw size={16} />
								Retry
							</button>
						</div>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900 text-white">
			<div className="container mx-auto px-4 pt-8 pb-10">
				{/* Header */}
				<div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
					<div className="flex items-center gap-4">
						{playerMetrics?.summoner && (
							<div className="relative">
								<div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-slate-700 shadow-xl">
									<Image
										src={`https://ddragon.leagueoflegends.com/cdn/13.24.1/img/profileicon/${playerMetrics.summoner.profileIconId}.png`}
										alt="Profile Icon"
										width={80}
										height={80}
										className="w-full h-full object-cover"
									/>
								</div>
								<div className="absolute -bottom-2 -right-2 bg-slate-900 border border-slate-700 rounded-lg px-2 py-0.5 text-xs font-bold shadow-lg">
									{playerMetrics.summoner.summonerLevel}
								</div>
							</div>
						)}
						<div>
							<h1 className="text-3xl font-bold text-white mb-1 flex items-center gap-3">
								{playerMetrics?.summoner?.name || "Player Statistics"}
								{isPuuid && (
									<span className="bg-blue-500/10 text-blue-400 text-xs px-2 py-1 rounded border border-blue-500/20">
										Riot ID
									</span>
								)}
							</h1>
							<p className="text-slate-400 flex items-center gap-2">
								{playerMetrics?.summoner && (
									<>
										<span className="w-2 h-2 rounded-full bg-green-500"></span>
										<span>Online</span> {/* Mock status for now */}
										<span className="text-slate-600">•</span>
									</>
								)}
								Detailed performance metrics and match history
							</p>
						</div>
					</div>
					<div className="flex flex-wrap items-center gap-3">
						{!isPuuid && (
							<DataSourceToggle source={dataSource} onSourceChange={setDataSource} />
						)}
						{canShowPlayerActions && (
							<>
								<button
									onClick={handleMessage}
									disabled={createConversationMutation.isPending}
									className="bg-gradient-to-r from-cyan-600/90 to-blue-600/90 hover:from-cyan-500/90 hover:to-blue-500/90 border border-cyan-400/40 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200 flex items-center gap-2 backdrop-blur-sm disabled:opacity-60"
								>
									<MessageCircle size={16} />
									{createConversationMutation.isPending ? "Opening..." : "Message"}
								</button>
								<button
									onClick={handleFriendRequest}
									disabled={friendshipButtonDisabled}
									className="bg-slate-900/70 hover:bg-slate-800/80 border border-slate-600/70 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200 flex items-center gap-2 backdrop-blur-sm disabled:opacity-60"
								>
									<UserPlus size={16} />
									{friendshipButtonLabel}
								</button>
							</>
						)}
						<button
							onClick={handleRefresh}
							className="bg-gradient-to-r from-blue-600/80 to-purple-600/80 hover:from-blue-500/80 hover:to-purple-500/80 border border-blue-500/50 hover:border-blue-400/70 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200 flex items-center gap-2 backdrop-blur-sm"
						>
							<RefreshCw size={16} />
							Refresh
						</button>
					</div>
				</div>

				{/* Aggregate Stats */}
				{playerMetrics && (
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						className="mb-8"
					>
						<div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 shadow-xl rounded-lg">
							<div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 p-6 border-b border-slate-700/50 rounded-t-lg">
								<h2 className="text-xl font-bold text-white flex items-center gap-3">
									<div className="bg-gradient-to-r from-yellow-400 to-orange-400 p-2 rounded-lg">
										<BarChart3 className="text-black" size={20} />
									</div>
									AGGREGATE STATISTICS
									<span className="text-sm font-normal text-slate-400 ml-2">
										(Last {playerMetrics.recentGames.length} games)
									</span>
								</h2>
							</div>
							<div className="p-6">
								<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
									<StatsCard
										icon={<Gamepad2 size={16} />}
										title="Total Games"
										value={playerMetrics.aggregateStats.totalGames}
										color="blue"
									/>
									<StatsCard
										icon={<TrendingUp size={16} />}
										title="Win Rate"
										value={`${playerMetrics.aggregateStats.winRate}%`}
										color={
											playerMetrics.aggregateStats.winRate >= 50
												? "green"
												: "red"
										}
									/>
									<StatsCard
										icon={<Sword size={16} />}
										title="Average KDA"
										value={playerMetrics.aggregateStats.averageKDA.ratio}
										subtitle={`${playerMetrics.aggregateStats.averageKDA.kills}/${playerMetrics.aggregateStats.averageKDA.deaths}/${playerMetrics.aggregateStats.averageKDA.assists}`}
										color="purple"
									/>
									<StatsCard
										icon={<Eye size={16} />}
										title="Avg Vision Score"
										value={playerMetrics.aggregateStats.averageVisionScore}
										color="blue"
									/>
								</div>
								<div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
									<StatsCard
										icon={<Target size={16} />}
										title="Average CS@10"
										value={playerMetrics.aggregateStats.averageCSAt10}
										subtitle="Creep Score at 10 minutes"
										color="yellow"
									/>
									<StatsCard
										icon={<Activity size={16} />}
										title="Data Source"
										value={dataSource === "riot" ? "Riot API" : "Scrim Logs"}
										subtitle={
											dataSource === "riot"
												? "Official match data"
												: "Internal scrim data"
										}
										color="green"
									/>
								</div>
							</div>
						</div>
					</motion.div>
				)}

				{/* Recent Games */}
				{playerMetrics && playerMetrics.recentGames.length > 0 && (
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: 0.2 }}
					>
						<div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 shadow-xl rounded-lg">
							<div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 p-6 border-b border-slate-700/50 rounded-t-lg">
								<h2 className="text-xl font-bold text-white flex items-center gap-3">
									<div className="bg-gradient-to-r from-blue-400 to-purple-400 p-2 rounded-lg">
										<Clock className="text-white" size={20} />
									</div>
									RECENT MATCHES
								</h2>
							</div>
							<div className="p-6">
								<div className="space-y-4">
									{playerMetrics.recentGames.map((game, index) => (
										<motion.div
											key={game.gameId}
											initial={{ opacity: 0, x: -20 }}
											animate={{ opacity: 1, x: 0 }}
											transition={{ delay: index * 0.1 }}
											className={`bg-slate-900/50 border border-slate-700/50 rounded-lg p-4 hover:bg-slate-800/50 transition-all duration-200 ${
												game.win
													? "border-l-4 border-l-green-500 shadow-green-500/20"
													: "border-l-4 border-l-red-500 shadow-red-500/20"
											}`}
										>
											<div className="flex items-center justify-between">
												<div className="flex items-center gap-4">
													<div className="relative">
														<div className="w-14 h-14 border-2 border-slate-600 rounded-lg overflow-hidden bg-slate-700">
															<Image
																src={getChampionImage(
																	game.championId,
																)}
																alt={`Champion ${game.championId}`}
																width={56}
																height={56}
																className="w-full h-full object-cover"
															/>
														</div>
														{/* {game.role && (
                                                            <div className="absolute -bottom-1 -right-1 bg-slate-800 border border-slate-600 rounded px-1">
                                                                {getRoleIcon(game.role)}
                                                            </div>
                                                        )} */}
													</div>
													<div>
														<div className="text-white font-semibold text-lg">
															Champion #{game.championId}
														</div>
														<div className="flex items-center gap-2 text-slate-400 text-sm">
															<Gamepad2 size={12} />
															<span>{game.queueType}</span>
															<span>•</span>
															<Calendar size={12} />
															<span>
																{new Date(
																	game.gameDate,
																).toLocaleDateString()}
															</span>
														</div>
													</div>
												</div>
												<div className="text-right">
													<div
														className={`font-bold text-lg flex items-center gap-2 ${
															game.win
																? "text-green-400"
																: "text-red-400"
														}`}
													>
														{game.win ? (
															<TrendingUp size={16} />
														) : (
															<TrendingUp
																size={16}
																className="rotate-180"
															/>
														)}
														{game.win ? "VICTORY" : "DEFEAT"}
													</div>
													{game.gameDuration && (
														<div className="flex items-center gap-1 text-slate-400 text-sm">
															<Clock size={12} />
															{Math.floor(game.gameDuration / 60)}:
															{(game.gameDuration % 60)
																.toString()
																.padStart(2, "0")}
														</div>
													)}
												</div>
												<div className="text-center bg-slate-800/50 px-4 py-2 rounded-lg">
													<div className="text-white font-bold text-lg">
														{game.kills}/{game.deaths}/{game.assists}
													</div>
													<div className="text-blue-400 text-sm font-medium">
														{game.kda} KDA
													</div>
												</div>
												<div className="text-center bg-slate-800/50 px-4 py-2 rounded-lg hidden md:block">
													<div className="text-white font-bold">
														{game.visionScore}
													</div>
													<div className="text-slate-400 text-sm">
														Vision
													</div>
												</div>
												{game.csAt10Minutes && (
													<div className="text-center bg-slate-800/50 px-4 py-2 rounded-lg hidden md:block">
														<div className="text-white font-bold">
															{game.csAt10Minutes}
														</div>
														<div className="text-slate-400 text-sm">
															CS@10
														</div>
													</div>
												)}
											</div>
										</motion.div>
									))}
								</div>
							</div>
						</div>
					</motion.div>
				)}

				{/* No Data State */}
				{playerMetrics && playerMetrics.recentGames.length === 0 && (
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: 0.2 }}
						className="text-center py-16"
					>
						<div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 shadow-xl rounded-lg p-8">
							<div className="text-slate-400 text-6xl mb-4">
								<Gamepad2 className="mx-auto" />
							</div>
							<h3 className="text-xl font-semibold text-white mb-2">
								No Games Found
							</h3>
							<p className="text-slate-400 mb-4">
								No {dataSource === "riot" ? "ranked matches" : "scrim games"} found
								for this player.
							</p>
							{!isPuuid && (
								<button
									onClick={() =>
										setDataSource(dataSource === "riot" ? "scrim" : "riot")
									}
									className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white px-6 py-2 rounded-lg transition-all duration-200"
								>
									Try {dataSource === "riot" ? "Scrim History" : "Riot History"}
								</button>
							)}
						</div>
					</motion.div>
				)}
			</div>
		</div>
	);
}
