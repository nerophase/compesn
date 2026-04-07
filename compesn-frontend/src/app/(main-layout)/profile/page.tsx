"use client";

import { motion } from "framer-motion";
import {
	Crown,
	Target,
	Star,
	Trophy,
	Clock,
	ChevronUp,
	ChevronDown,
	Medal,
	Flame,
	Eye,
	Users,
	Minus,
	Plus,
	Sword,
	Shield,
	Zap,
	Activity,
	TrendingUp,
	Award,
	Calendar,
	MapPin,
	Timer,
	Gamepad2,
	Crosshair,
	Gem,
	Sparkles,
	Target as TargetIcon,
	Swords,
	Mountain,
	Coffee,
	Play,
	Pause,
} from "lucide-react";
import Image from "next/image";
import { useState } from "react";

export default function Profile() {
	const [selectedQueue, setSelectedQueue] = useState("RANKED_SOLO_5x5");
	const [expandedMatch, setExpandedMatch] = useState<number | null>(null);

	// Minimizer states for right sidebar components
	const [masteryMinimized, setMasteryMinimized] = useState(false);
	const [achievementsMinimized, setAchievementsMinimized] = useState(false);
	const [gameStatusMinimized, setGameStatusMinimized] = useState(false);

	// Riot Data Dragon API base URL
	const DDRAGON_VERSION = "13.24.1";
	const DDRAGON_BASE = `https://ddragon.leagueoflegends.com/cdn/${DDRAGON_VERSION}/img`;

	// Helper function to get champion image URL
	const getChampionImage = (championName: string) => {
		return `${DDRAGON_BASE}/champion/${championName}.png`;
	};

	// Helper function to get profile icon URL
	const getProfileIconImage = (iconId: number) => {
		return `${DDRAGON_BASE}/profileicon/${iconId}.png`;
	};

	// Helper function to get role icon
	const getRoleIcon = (role: string) => {
		switch (role.toLowerCase()) {
			case "adc":
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

	// Helper function to get achievement rarity icon
	const getRarityIcon = (rarity: string) => {
		switch (rarity) {
			case "legendary":
				return <Crown className="text-yellow-400" size={16} />;
			case "epic":
				return <Gem className="text-purple-400" size={16} />;
			case "rare":
				return <Sparkles className="text-blue-400" size={16} />;
			case "common":
				return <Award className="text-gray-400" size={16} />;
			default:
				return <Medal className="text-gray-400" size={16} />;
		}
	};

	// Player Profile Data
	const playerProfile = {
		summonerName: "ToxicMaster96",
		level: 147,
		profileIcon: 4835,
		region: "NA1",
		puuid: "example-puuid",
		lastActivity: "2 minutes ago",
		premadeWith: ["SkillIssue42", "ADCDiff", "WardBot"],
		accountCreated: "2019-03-15",
		honorLevel: 4,
		blueEssence: 47250,
		rpBalance: 1350,
		mainRole: "ADC",
		secondaryRole: "Support",
		peakRank: "Diamond I",
		currentSeason: "Season 13",
	};

	// Current Season Ranked Data
	const rankedData = {
		RANKED_SOLO_5x5: {
			tier: "DIAMOND",
			rank: "II",
			leaguePoints: 73,
			wins: 156,
			losses: 132,
			winRate: 54.2,
			promoSeries: null,
			hotStreak: false,
			veteran: true,
			inactive: false,
			freshBlood: false,
		},
		RANKED_FLEX_SR: {
			tier: "PLATINUM",
			rank: "I",
			leaguePoints: 45,
			wins: 89,
			losses: 71,
			winRate: 55.6,
			promoSeries: { target: "DIAMOND", wins: 1, losses: 0 },
			hotStreak: true,
			veteran: false,
			inactive: false,
			freshBlood: false,
		},
	};

	// Champion Mastery Data
	const championMastery = [
		{
			championId: 222,
			championName: "Jinx",
			championLevel: 7,
			championPoints: 287543,
			lastPlayTime: 1640995200000,
			chestGranted: true,
			tokensEarned: 0,
			championPointsSinceLastLevel: 65543,
			championPointsUntilNextLevel: 0,
			gamesPlayed: 234,
			winRate: 68.2,
			averageKDA: 2.8,
			role: "ADC",
		},
		{
			championId: 51,
			championName: "Caitlyn",
			championLevel: 7,
			championPoints: 198234,
			lastPlayTime: 1640908800000,
			chestGranted: false,
			tokensEarned: 2,
			championPointsSinceLastLevel: 34234,
			championPointsUntilNextLevel: 0,
			gamesPlayed: 156,
			winRate: 72.4,
			averageKDA: 3.2,
			role: "ADC",
		},
		{
			championId: 498,
			championName: "Xayah",
			championLevel: 6,
			championPoints: 156789,
			lastPlayTime: 1640822400000,
			chestGranted: true,
			tokensEarned: 1,
			championPointsSinceLastLevel: 35789,
			championPointsUntilNextLevel: 65211,
			gamesPlayed: 123,
			winRate: 65.9,
			averageKDA: 2.5,
			role: "ADC",
		},
		{
			championId: 22,
			championName: "Ashe",
			championLevel: 6,
			championPoints: 134567,
			lastPlayTime: 1640736000000,
			chestGranted: true,
			tokensEarned: 0,
			championPointsSinceLastLevel: 23567,
			championPointsUntilNextLevel: 76433,
			gamesPlayed: 98,
			winRate: 61.2,
			averageKDA: 2.9,
			role: "ADC",
		},
		{
			championId: 67,
			championName: "Vayne",
			championLevel: 5,
			championPoints: 89432,
			lastPlayTime: 1640649600000,
			chestGranted: false,
			tokensEarned: 0,
			championPointsSinceLastLevel: 10432,
			championPointsUntilNextLevel: 10568,
			gamesPlayed: 87,
			winRate: 58.6,
			averageKDA: 2.1,
			role: "ADC",
		},
	];

	// Recent Match History
	const recentMatches = [
		{
			matchId: "NA1_4567890123",
			gameMode: "CLASSIC",
			gameType: "MATCHED_GAME",
			queueId: 420,
			gameDuration: 1847,
			gameCreation: 1640995200000,
			gameVersion: "13.24.513.5504",
			participant: {
				championId: 222,
				championName: "Jinx",
				spell1Id: 4,
				spell2Id: 7,
				team: 100,
				win: true,
				kills: 12,
				deaths: 3,
				assists: 8,
				totalDamageDealtToChampions: 32450,
				totalDamageTaken: 15620,
				goldEarned: 16234,
				champLevel: 17,
				totalMinionsKilled: 234,
				neutralMinionsKilled: 18,
				visionScore: 23,
				wardsPlaced: 15,
				wardsKilled: 8,
				largestKillingSpree: 6,
				largestMultiKill: 2,
				doubleKills: 3,
				tripleKills: 1,
				quadraKills: 0,
				pentaKills: 0,
				totalHeal: 3420,
				damageSelfMitigated: 8950,
				role: "ADC",
				lane: "BOTTOM",
				items: [3006, 3031, 3094, 3072, 3036, 3139],
				kda: 6.67,
			},
			teamStats: {
				blue: {
					kills: 23,
					deaths: 15,
					assists: 58,
					dragons: 3,
					barons: 1,
					towers: 8,
				},
				red: {
					kills: 15,
					deaths: 23,
					assists: 41,
					dragons: 1,
					barons: 0,
					towers: 3,
				},
			},
		},
		{
			matchId: "NA1_4567890122",
			gameMode: "CLASSIC",
			gameType: "MATCHED_GAME",
			queueId: 420,
			gameDuration: 2156,
			gameCreation: 1640908800000,
			gameVersion: "13.24.513.5504",
			participant: {
				championId: 51,
				championName: "Caitlyn",
				spell1Id: 4,
				spell2Id: 7,
				team: 200,
				win: false,
				kills: 8,
				deaths: 7,
				assists: 12,
				totalDamageDealtToChampions: 28650,
				totalDamageTaken: 18230,
				goldEarned: 14567,
				champLevel: 16,
				totalMinionsKilled: 198,
				neutralMinionsKilled: 12,
				visionScore: 19,
				wardsPlaced: 12,
				wardsKilled: 5,
				largestKillingSpree: 3,
				largestMultiKill: 2,
				doubleKills: 2,
				tripleKills: 0,
				quadraKills: 0,
				pentaKills: 0,
				totalHeal: 2890,
				damageSelfMitigated: 7250,
				role: "ADC",
				lane: "BOTTOM",
				items: [3006, 3031, 3094, 3072, 3036, 3139],
				kda: 2.86,
			},
			teamStats: {
				blue: {
					kills: 19,
					deaths: 28,
					assists: 45,
					dragons: 2,
					barons: 0,
					towers: 4,
				},
				red: {
					kills: 28,
					deaths: 19,
					assists: 67,
					dragons: 4,
					barons: 2,
					towers: 9,
				},
			},
		},
		{
			matchId: "NA1_4567890121",
			gameMode: "CLASSIC",
			gameType: "MATCHED_GAME",
			queueId: 420,
			gameDuration: 1623,
			gameCreation: 1640822400000,
			gameVersion: "13.24.513.5504",
			participant: {
				championId: 498,
				championName: "Xayah",
				spell1Id: 4,
				spell2Id: 7,
				team: 100,
				win: true,
				kills: 15,
				deaths: 2,
				assists: 6,
				totalDamageDealtToChampions: 35670,
				totalDamageTaken: 12340,
				goldEarned: 17890,
				champLevel: 18,
				totalMinionsKilled: 267,
				neutralMinionsKilled: 24,
				visionScore: 28,
				wardsPlaced: 18,
				wardsKilled: 11,
				largestKillingSpree: 8,
				largestMultiKill: 3,
				doubleKills: 4,
				tripleKills: 2,
				quadraKills: 0,
				pentaKills: 0,
				totalHeal: 4120,
				damageSelfMitigated: 9850,
				role: "ADC",
				lane: "BOTTOM",
				items: [3006, 3031, 3094, 3072, 3036, 3139],
				kda: 10.5,
			},
			teamStats: {
				blue: {
					kills: 31,
					deaths: 12,
					assists: 78,
					dragons: 4,
					barons: 2,
					towers: 11,
				},
				red: {
					kills: 12,
					deaths: 31,
					assists: 28,
					dragons: 0,
					barons: 0,
					towers: 1,
				},
			},
		},
	];

	// Career Statistics
	const careerStats = {
		totalGames: 2847,
		totalWins: 1598,
		totalLosses: 1249,
		overallWinRate: 56.1,
		totalKills: 45782,
		totalDeaths: 32156,
		totalAssists: 67894,
		averageKDA: 3.53,
		totalDamageDealt: 1234567890,
		totalGoldEarned: 456789123,
		totalMinionKills: 234567,
		averageVisionScore: 22.4,
		totalWardsPurchased: 15678,
		totalWardsKilled: 8934,
		pentaKills: 12,
		quadraKills: 89,
		tripleKills: 456,
		doubleKills: 1234,
		totalTimeSpent: 4567890, // in minutes
		favoriteRole: "ADC",
		mostPlayedChampion: "Jinx",
	};

	// Achievements
	const achievements = [
		{
			id: "pentakill_master",
			title: "Pentakill Master",
			description: "Achieved 10+ Pentakills",
			icon: "⚔️",
			rarity: "legendary",
			unlockedDate: "2024-03-15",
			progress: { current: 12, max: 10 },
		},
		{
			id: "diamond_climber",
			title: "Diamond Climber",
			description: "Reached Diamond rank",
			icon: "💎",
			rarity: "rare",
			unlockedDate: "2024-02-28",
			progress: { current: 1, max: 1 },
		},
		{
			id: "adc_specialist",
			title: "ADC Specialist",
			description: "500+ games as ADC",
			icon: "🏹",
			rarity: "common",
			unlockedDate: "2024-01-12",
			progress: { current: 1847, max: 500 },
		},
		{
			id: "vision_master",
			title: "Vision Master",
			description: "Average 25+ vision score",
			icon: "👁️",
			rarity: "epic",
			unlockedDate: "2024-04-03",
			progress: { current: 22.4, max: 25 },
		},
		{
			id: "mastery_collector",
			title: "Mastery Collector",
			description: "5+ Level 7 Champions",
			icon: "🎖️",
			rarity: "rare",
			unlockedDate: "2024-03-20",
			progress: { current: 7, max: 5 },
		},
		{
			id: "comeback_king",
			title: "Comeback King",
			description: "Won 50+ games from behind",
			icon: "🔄",
			rarity: "epic",
			unlockedDate: "2024-02-14",
			progress: { current: 78, max: 50 },
		},
	];

	// Live Game Data - Set to active for mockup
	const liveGame = {
		gameId: 4567890124,
		gameMode: "CLASSIC",
		gameType: "MATCHED_GAME",
		queueId: 420,
		gameStartTime: Date.now() - 18 * 60 * 1000, // 18 minutes ago
		participant: {
			championId: 222,
			championName: "Jinx",
			spell1Id: 4, // Flash
			spell2Id: 7, // Heal
			team: 100,
			position: "ADC",
			isBot: false,
		},
		teams: {
			blue: [
				{
					summonerName: "ToxicMaster96",
					championName: "Jinx",
					position: "ADC",
					rank: "Diamond II",
				},
				{
					summonerName: "SupportGod",
					championName: "Thresh",
					position: "SUPPORT",
					rank: "Diamond III",
				},
				{
					summonerName: "JungleKing42",
					championName: "Graves",
					position: "JUNGLE",
					rank: "Diamond I",
				},
				{
					summonerName: "MidLaner2024",
					championName: "Yasuo",
					position: "MID",
					rank: "Platinum I",
				},
				{
					summonerName: "TopDiff",
					championName: "Darius",
					position: "TOP",
					rank: "Diamond III",
				},
			],
			red: [
				{
					summonerName: "Enemy1",
					championName: "Vayne",
					position: "ADC",
					rank: "Diamond II",
				},
				{
					summonerName: "Enemy2",
					championName: "Lulu",
					position: "SUPPORT",
					rank: "Diamond I",
				},
				{
					summonerName: "Enemy3",
					championName: "Kha'Zix",
					position: "JUNGLE",
					rank: "Diamond II",
				},
				{
					summonerName: "Enemy4",
					championName: "Azir",
					position: "MID",
					rank: "Master",
				},
				{
					summonerName: "Enemy5",
					championName: "Gnar",
					position: "TOP",
					rank: "Diamond I",
				},
			],
		},
		gameLength: 18 * 60, // 18 minutes in seconds
		spectatorKey: "abc123def456",
	};

	const formatDuration = (seconds: number) => {
		const mins = Math.floor(seconds / 60);
		const secs = seconds % 60;
		return `${mins}:${secs.toString().padStart(2, "0")}`;
	};

	const formatTimeAgo = (timestamp: number) => {
		const now = Date.now();
		const diff = now - timestamp;
		const hours = Math.floor(diff / (1000 * 60 * 60));
		const days = Math.floor(hours / 24);

		if (days > 0) return `${days}d ago`;
		if (hours > 0) return `${hours}h ago`;
		return "< 1h ago";
	};

	const formatGameTime = (startTime: number) => {
		const now = Date.now();
		const diff = Math.floor((now - startTime) / 1000);
		return formatDuration(diff);
	};

	const getRankColor = (tier: string) => {
		const colors: { [key: string]: string } = {
			IRON: "text-amber-700",
			BRONZE: "text-amber-600",
			SILVER: "text-gray-400",
			GOLD: "text-yellow-400",
			PLATINUM: "text-cyan-400",
			DIAMOND: "text-blue-400",
			MASTER: "text-purple-400",
			GRANDMASTER: "text-red-400",
			CHALLENGER: "text-yellow-300",
		};
		return colors[tier] || "text-gray-400";
	};

	const toggleMatchDetails = (matchIndex: number) => {
		setExpandedMatch(expandedMatch === matchIndex ? null : matchIndex);
	};

	return (
		<div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900 text-white">
			{/* Main Content */}
			<div className="container mx-auto px-4 pt-4 pb-10">
				{/* Header Section */}
				<div className="grid grid-cols-1 xl:grid-cols-4 gap-6 mb-8">
					{/* Player Card */}
					<div className="xl:col-span-1">
						<div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 shadow-xl rounded-lg h-full relative overflow-hidden">
							{/* Background Pattern */}
							<div className="absolute inset-0 opacity-5">
								<div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full -translate-y-16 translate-x-16"></div>
								<div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-cyan-500 to-blue-500 rounded-full translate-y-12 -translate-x-12"></div>
							</div>

							<div className="relative z-10">
								<div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 p-6 border-b border-slate-700/50 rounded-t-lg backdrop-blur-sm">
									<div className="flex items-center gap-4">
										<div className="relative">
											<div className="w-20 h-20 border-3 border-gradient-to-r from-blue-500 to-purple-500 rounded-full overflow-hidden bg-slate-700 ring-2 ring-blue-500/30 ring-offset-2 ring-offset-slate-800">
												<Image
													src={getProfileIconImage(
														playerProfile.profileIcon,
													)}
													alt="Profile Icon"
													width={80}
													height={80}
													className="w-full h-full object-cover"
												/>
											</div>
											<div className="absolute -bottom-1 -right-1 bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xs px-2 py-1 rounded-full font-bold shadow-lg">
												{playerProfile.level}
											</div>
											<div className="absolute -top-1 -left-1 bg-yellow-500 text-black text-xs px-1.5 py-0.5 rounded-full font-bold shadow-lg">
												H{playerProfile.honorLevel}
											</div>
										</div>
										<div className="flex-1">
											<h1 className="text-xl font-bold text-white mb-1">
												{playerProfile.summonerName}
											</h1>
											<div className="flex items-center gap-2 text-sm text-blue-300 mb-1">
												<MapPin size={14} />
												<span>{playerProfile.region}</span>
												<span>•</span>
												<span>{playerProfile.currentSeason}</span>
											</div>
											<div className="flex items-center gap-3 text-xs text-slate-400">
												<div className="flex items-center gap-1">
													{getRoleIcon(playerProfile.mainRole)}
													<span>{playerProfile.mainRole}</span>
												</div>
												<span>/</span>
												<div className="flex items-center gap-1">
													{getRoleIcon(playerProfile.secondaryRole)}
													<span>{playerProfile.secondaryRole}</span>
												</div>
											</div>
										</div>
									</div>
								</div>

								<div className="p-6 space-y-4">
									{/* Status */}
									<div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-lg p-3">
										<div className="flex items-center justify-between text-sm">
											<div className="flex items-center gap-2 text-slate-300">
												<Activity size={14} />
												<span>Status</span>
											</div>
											<span className="text-green-400 flex items-center gap-1 font-medium">
												<div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
												Online • {playerProfile.lastActivity}
											</span>
										</div>
									</div>

									{/* Account Info Grid */}
									<div className="grid grid-cols-2 gap-3">
										<div className="bg-slate-900/40 border border-slate-700/30 rounded-lg p-3">
											<div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
												<Trophy size={12} />
												Peak Rank
											</div>
											<div className="text-yellow-400 font-semibold text-sm">
												{playerProfile.peakRank}
											</div>
										</div>
										<div className="bg-slate-900/40 border border-slate-700/30 rounded-lg p-3">
											<div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
												<Calendar size={12} />
												Member Since
											</div>
											<div className="text-blue-400 font-semibold text-sm">
												{new Date(
													playerProfile.accountCreated,
												).getFullYear()}
											</div>
										</div>
									</div>

									{/* Currency */}
									<div className="space-y-2">
										<div className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/20 rounded-lg p-3">
											<div className="flex items-center justify-between">
												<div className="flex items-center gap-2 text-cyan-300 text-sm">
													<Gem size={14} />
													<span>Blue Essence</span>
												</div>
												<span className="text-cyan-400 font-bold">
													{playerProfile.blueEssence.toLocaleString()}
												</span>
											</div>
										</div>
										<div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 rounded-lg p-3">
											<div className="flex items-center justify-between">
												<div className="flex items-center gap-2 text-orange-300 text-sm">
													<Crown size={14} />
													<span>Riot Points</span>
												</div>
												<span className="text-orange-400 font-bold">
													{playerProfile.rpBalance.toLocaleString()}
												</span>
											</div>
										</div>
									</div>

									{/* Premade Partners */}
									<div>
										<div className="flex items-center gap-2 text-slate-400 text-sm mb-3">
											<Users size={14} />
											<span>Frequent Duo Partners</span>
										</div>
										<div className="space-y-2">
											{playerProfile.premadeWith.map((player, idx) => (
												<div
													key={idx}
													className="flex items-center gap-2 text-blue-300 text-sm bg-gradient-to-r from-slate-900/40 to-slate-800/40 border border-slate-700/30 px-3 py-2 rounded-md hover:bg-slate-800/50 transition-colors"
												>
													<Users size={12} />
													<span>{player}</span>
													<div className="ml-auto w-2 h-2 bg-green-400 rounded-full"></div>
												</div>
											))}
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>

					{/* Ranked Stats */}
					<div className="xl:col-span-2">
						<div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 shadow-xl rounded-lg h-full relative overflow-hidden">
							{/* Background Elements */}
							<div className="absolute inset-0 opacity-10">
								<div className="absolute top-0 left-1/4 w-40 h-40 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-full -translate-y-20"></div>
								<div className="absolute bottom-0 right-1/4 w-32 h-32 bg-gradient-to-tl from-blue-500 to-purple-500 rounded-full translate-y-16"></div>
								<div className="absolute top-1/2 right-0 w-24 h-24 bg-gradient-to-l from-cyan-500 to-blue-500 rounded-full translate-x-12"></div>
							</div>

							<div className="relative z-10">
								<div className="bg-gradient-to-r from-yellow-600/20 via-blue-600/20 to-purple-600/20 p-6 border-b border-slate-700/50 rounded-t-lg backdrop-blur-sm">
									<div className="flex items-center justify-between">
										<h2 className="text-xl font-bold text-white flex items-center gap-3">
											<div className="bg-gradient-to-r from-yellow-400 to-orange-400 p-2 rounded-lg">
												<Crown className="text-black" size={20} />
											</div>
											RANKED STATISTICS
										</h2>
										<div className="flex items-center gap-3">
											<div className="text-xs text-slate-400">
												Queue Type:
											</div>
											<select
												value={selectedQueue}
												onChange={(e) => setSelectedQueue(e.target.value)}
												className="bg-slate-800/80 border border-slate-600 text-white text-sm px-4 py-2 rounded-lg focus:border-blue-500 focus:outline-none transition-colors backdrop-blur-sm"
											>
												<option
													value="RANKED_SOLO_5x5"
													className="bg-slate-900"
												>
													Solo/Duo Queue
												</option>
												<option
													value="RANKED_FLEX_SR"
													className="bg-slate-900"
												>
													Flex 5v5 Queue
												</option>
											</select>
										</div>
									</div>
								</div>

								<div className="p-6">
									{(() => {
										const rank =
											rankedData[selectedQueue as keyof typeof rankedData];
										return (
											<div className="space-y-6">
												{/* Main Rank Display */}
												<div className="bg-gradient-to-br from-slate-900/80 to-slate-800/80 border border-slate-700/50 rounded-xl p-6 backdrop-blur-sm">
													<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
														{/* Rank Emblem */}
														<div className="text-center">
															<div className="relative inline-block">
																<div
																	className={`w-24 h-24 rounded-full bg-gradient-to-br ${
																		rank.tier === "DIAMOND"
																			? "from-blue-400 to-blue-600"
																			: rank.tier ===
																				  "PLATINUM"
																				? "from-cyan-400 to-cyan-600"
																				: rank.tier ===
																					  "GOLD"
																					? "from-yellow-400 to-yellow-600"
																					: "from-slate-400 to-slate-600"
																	} 
                                  flex items-center justify-center mx-auto mb-3 shadow-lg ring-4 ring-slate-700/50`}
																>
																	<Crown
																		className="text-white"
																		size={32}
																	/>
																</div>
																<div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-slate-800 border border-slate-600 rounded-full px-3 py-1">
																	<span className="text-xs text-slate-300">
																		{rank.rank}
																	</span>
																</div>
															</div>
															<div
																className={`text-2xl font-bold ${getRankColor(
																	rank.tier,
																)} mb-1`}
															>
																{rank.tier}
															</div>
															<div className="text-lg text-white flex items-center justify-center gap-2">
																<Trophy
																	size={16}
																	className="text-yellow-400"
																/>
																<span className="font-bold">
																	{rank.leaguePoints}
																</span>
																<span className="text-slate-400 text-sm">
																	LP
																</span>
															</div>
														</div>

														{/* Rank Progress */}
														<div className="lg:col-span-2 space-y-4">
															{/* LP Progress Bar */}
															<div>
																<div className="flex justify-between items-center mb-2">
																	<span className="text-sm text-slate-400">
																		League Points Progress
																	</span>
																	<span className="text-sm text-blue-400">
																		{rank.leaguePoints}
																		/100 LP
																	</span>
																</div>
																<div className="w-full bg-slate-700/50 h-3 rounded-full overflow-hidden">
																	<div
																		className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-500"
																		style={{
																			width: `${rank.leaguePoints}%`,
																		}}
																	></div>
																</div>
															</div>

															{/* Status Badges */}
															<div className="flex flex-wrap gap-2">
																{rank.hotStreak && (
																	<div className="flex items-center gap-1 bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-500/30 text-orange-400 text-xs px-3 py-1 rounded-full">
																		<Flame size={12} />
																		Hot Streak
																	</div>
																)}
																{rank.veteran && (
																	<div className="flex items-center gap-1 bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-purple-500/30 text-purple-400 text-xs px-3 py-1 rounded-full">
																		<Medal size={12} />
																		Veteran
																	</div>
																)}
																{rank.promoSeries && (
																	<div className="flex items-center gap-1 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-blue-500/30 text-blue-400 text-xs px-3 py-1 rounded-full">
																		<TrendingUp size={12} />
																		Promos:{" "}
																		{rank.promoSeries.wins}
																		W-
																		{rank.promoSeries.losses}L
																	</div>
																)}
															</div>

															{/* Detailed Stats Grid */}
															<div className="grid grid-cols-2 gap-3">
																<div className="bg-slate-800/50 border border-slate-700/30 rounded-lg p-3">
																	<div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
																		<Gamepad2 size={12} />
																		Total Games
																	</div>
																	<div className="text-white text-lg font-bold">
																		{rank.wins + rank.losses}
																	</div>
																</div>
																<div className="bg-slate-800/50 border border-slate-700/30 rounded-lg p-3">
																	<div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
																		<TrendingUp size={12} />
																		Win Rate
																	</div>
																	<div
																		className={`text-lg font-bold ${
																			rank.winRate >= 50
																				? "text-green-400"
																				: "text-red-400"
																		}`}
																	>
																		{rank.winRate.toFixed(1)}%
																	</div>
																</div>
															</div>
														</div>
													</div>
												</div>

												{/* Detailed Statistics */}
												<div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
													<div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-lg p-4">
														<div className="flex items-center gap-2 text-green-400 text-sm mb-2">
															<TrendingUp size={14} />
															Victories
														</div>
														<div className="text-green-400 text-2xl font-bold">
															{rank.wins}
														</div>
														<div className="text-xs text-slate-400 mt-1">
															{(
																(rank.wins /
																	(rank.wins + rank.losses)) *
																100
															).toFixed(1)}
															% of games
														</div>
													</div>

													<div className="bg-gradient-to-br from-red-500/10 to-rose-500/10 border border-red-500/20 rounded-lg p-4">
														<div className="flex items-center gap-2 text-red-400 text-sm mb-2">
															<TrendingUp
																size={14}
																className="rotate-180"
															/>
															Defeats
														</div>
														<div className="text-red-400 text-2xl font-bold">
															{rank.losses}
														</div>
														<div className="text-xs text-slate-400 mt-1">
															{(
																(rank.losses /
																	(rank.wins + rank.losses)) *
																100
															).toFixed(1)}
															% of games
														</div>
													</div>

													<div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20 rounded-lg p-4">
														<div className="flex items-center gap-2 text-blue-400 text-sm mb-2">
															<Activity size={14} />
															LP Gained
														</div>
														<div className="text-blue-400 text-2xl font-bold">
															+{Math.floor(rank.wins * 18.5)}
														</div>
														<div className="text-xs text-slate-400 mt-1">
															~
															{(
																(rank.wins * 18.5) /
																rank.wins
															).toFixed(1)}{" "}
															avg per win
														</div>
													</div>

													<div className="bg-gradient-to-br from-purple-500/10 to-violet-500/10 border border-purple-500/20 rounded-lg p-4">
														<div className="flex items-center gap-2 text-purple-400 text-sm mb-2">
															<Clock size={14} />
															Recent Form
														</div>
														<div className="text-purple-400 text-2xl font-bold">
															{rank.hotStreak
																? "W"
																: Math.random() > 0.5
																	? "W"
																	: "L"}
															{Math.random() > 0.5 ? "W" : "L"}
															{Math.random() > 0.5 ? "W" : "L"}
														</div>
														<div className="text-xs text-slate-400 mt-1">
															Last 3 games
														</div>
													</div>
												</div>
											</div>
										);
									})()}
								</div>
							</div>
						</div>
					</div>

					{/* Quick Stats */}
					<div className="xl:col-span-1 flex flex-col space-y-6">
						{/* Refresh Button Box */}
						<div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 shadow-xl rounded-lg w-full bg-gradient-to-r from-blue-600/80 to-purple-600/80 hover:from-blue-500/80 hover:to-purple-500/80 border border-blue-500/50 hover:border-blue-400/70 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 backdrop-blur-sm">
							<Activity size={16} />
							Refresh Stats
						</div>

						<div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 shadow-xl rounded-lg flex-1 flex flex-col">
							<div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 p-6 border-b border-slate-700/50 rounded-t-lg">
								<h3 className="text-lg font-bold text-white flex items-center gap-2">
									<Target className="text-blue-400" size={20} />
									CAREER STATS
								</h3>
							</div>
							<div className="p-6 space-y-4 flex-1 flex flex-col justify-center">
								<div className="bg-slate-900/30 p-4 rounded-lg border border-slate-700/30">
									<div className="flex items-center gap-2 text-slate-400 text-sm mb-1">
										<Gamepad2 size={14} />
										Total Games
									</div>
									<div className="text-white text-2xl font-bold">
										{careerStats.totalGames.toLocaleString()}
									</div>
								</div>
								<div className="bg-slate-900/30 p-4 rounded-lg border border-slate-700/30">
									<div className="flex items-center gap-2 text-slate-400 text-sm mb-1">
										<TrendingUp size={14} />
										Win Rate
									</div>
									<div className="text-green-400 text-2xl font-bold">
										{careerStats.overallWinRate}%
									</div>
								</div>
								<div className="bg-slate-900/30 p-4 rounded-lg border border-slate-700/30">
									<div className="flex items-center gap-2 text-slate-400 text-sm mb-1">
										<Swords size={14} />
										Average KDA
									</div>
									<div className="text-blue-400 text-2xl font-bold">
										{careerStats.averageKDA}
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>

				{/* Main Grid */}
				<div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
					{/* Left Column */}
					<div className="xl:col-span-2 space-y-6">
						{/* Recent Matches */}
						<div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 shadow-xl rounded-lg">
							<div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 p-6 border-b border-slate-700/50 rounded-t-lg flex items-center justify-between">
								<h2 className="text-lg font-bold text-white flex items-center gap-2">
									<Clock className="text-blue-400" size={20} />
									RECENT MATCHES
								</h2>
								<motion.button
									whileHover={{ scale: 1.05 }}
									whileTap={{ scale: 0.95 }}
									onClick={() => {
										// Refresh functionality can be added here
										console.log("Refreshing recent matches...");
									}}
									className="p-2 bg-gradient-to-r from-blue-600/80 to-purple-600/80 hover:from-blue-500/80 hover:to-purple-500/80 border border-blue-500/50 hover:border-blue-400/70 text-white rounded-md transition-all duration-200 flex items-center justify-center backdrop-blur-sm"
								>
									<Activity size={16} />
								</motion.button>
							</div>
							<div className="p-6">
								<div className="space-y-4">
									{recentMatches.map((match, index) => (
										<motion.div
											key={match.matchId}
											initial={{ opacity: 0, y: 20 }}
											animate={{ opacity: 1, y: 0 }}
											transition={{ delay: index * 0.1 }}
											className={`bg-slate-900/50 border border-slate-700/50 rounded-lg overflow-hidden hover:bg-slate-800/50 transition-all duration-200 ${
												match.participant.win
													? "border-l-4 border-l-green-500 shadow-green-500/20"
													: "border-l-4 border-l-red-500 shadow-red-500/20"
											}`}
										>
											<div
												className="p-6 cursor-pointer"
												onClick={() => toggleMatchDetails(index)}
											>
												<div className="flex items-center justify-between">
													<div className="flex items-center gap-4">
														<div className="relative">
															<div className="w-14 h-14 border-2 border-slate-600 rounded-lg overflow-hidden">
																<Image
																	src={getChampionImage(
																		match.participant
																			.championName,
																	)}
																	alt={
																		match.participant
																			.championName
																	}
																	width={56}
																	height={56}
																	className="w-full h-full object-cover"
																/>
															</div>
															<div className="absolute -bottom-1 -right-1 bg-slate-800 border border-slate-600 rounded px-1">
																{getRoleIcon(
																	match.participant.role,
																)}
															</div>
														</div>
														<div>
															<div className="text-white font-semibold text-lg">
																{match.participant.championName}
															</div>
															<div className="flex items-center gap-2 text-slate-400 text-sm">
																<Gamepad2 size={12} />
																<span>
																	{match.queueId === 420
																		? "Ranked Solo"
																		: "Ranked Flex"}
																</span>
																<span>•</span>
																<Calendar size={12} />
																<span>
																	{formatTimeAgo(
																		match.gameCreation,
																	)}
																</span>
															</div>
														</div>
													</div>
													<div className="text-right">
														<div
															className={`font-bold text-lg flex items-center gap-2 ${
																match.participant.win
																	? "text-green-400"
																	: "text-red-400"
															}`}
														>
															{match.participant.win ? (
																<TrendingUp size={16} />
															) : (
																<TrendingUp
																	size={16}
																	className="rotate-180"
																/>
															)}
															{match.participant.win
																? "VICTORY"
																: "DEFEAT"}
														</div>
														<div className="flex items-center gap-1 text-slate-400 text-sm">
															<Timer size={12} />
															{formatDuration(match.gameDuration)}
														</div>
													</div>
													<div className="text-center bg-slate-800/50 px-4 py-2 rounded-lg">
														<div className="text-white font-bold text-lg">
															{match.participant.kills}/
															{match.participant.deaths}/
															{match.participant.assists}
														</div>
														<div className="text-blue-400 text-sm font-medium">
															{match.participant.kda.toFixed(2)} KDA
														</div>
													</div>
													<div className="text-center bg-slate-800/50 px-4 py-2 rounded-lg">
														<div className="text-white font-bold">
															{match.participant.totalMinionsKilled}{" "}
															CS
														</div>
														<div className="text-slate-400 text-sm">
															{(
																match.participant
																	.totalMinionsKilled /
																(match.gameDuration / 60)
															).toFixed(1)}
															/min
														</div>
													</div>
													<div className="text-slate-400">
														{expandedMatch === index ? (
															<ChevronUp size={20} />
														) : (
															<ChevronDown size={20} />
														)}
													</div>
												</div>
											</div>

											{/* Expanded Match Details */}
											{expandedMatch === index && (
												<motion.div
													initial={{
														height: 0,
														opacity: 0,
													}}
													animate={{
														height: "auto",
														opacity: 1,
													}}
													exit={{
														height: 0,
														opacity: 0,
													}}
													className="border-t border-slate-700/50 bg-slate-900/30"
												>
													<div className="p-6 space-y-6">
														{/* Items Build */}
														<div className="bg-slate-800/50 p-4 rounded-lg">
															<div className="flex items-center gap-2 text-slate-400 mb-4 text-sm">
																<Gem size={14} />
																Items Build
															</div>
															<div className="flex items-center gap-2 flex-wrap">
																{match.participant.items.map(
																	(itemId, idx) => (
																		<div
																			key={idx}
																			className="w-12 h-12 bg-slate-700/50 border border-slate-600 rounded-lg flex items-center justify-center text-xs font-bold text-slate-300"
																		>
																			{itemId}
																		</div>
																	),
																)}
															</div>
														</div>

														{/* Enhanced Stats Grid */}
														<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
															<div className="bg-slate-800/50 p-4 rounded-lg">
																<div className="flex items-center gap-2 text-slate-400 mb-2 text-sm">
																	<Sword size={14} />
																	Damage Dealt
																</div>
																<div className="text-white font-medium text-lg">
																	{match.participant.totalDamageDealtToChampions.toLocaleString()}
																</div>
																<div className="text-xs text-slate-400 mt-1">
																	{Math.round(
																		match.participant
																			.totalDamageDealtToChampions /
																			(match.gameDuration /
																				60),
																	)}{" "}
																	DPM
																</div>
															</div>
															<div className="bg-slate-800/50 p-4 rounded-lg">
																<div className="flex items-center gap-2 text-slate-400 mb-2 text-sm">
																	<Shield size={14} />
																	Damage Taken
																</div>
																<div className="text-red-400 font-medium text-lg">
																	{match.participant.totalDamageTaken.toLocaleString()}
																</div>
																<div className="text-xs text-slate-400 mt-1">
																	{match.participant.damageSelfMitigated.toLocaleString()}{" "}
																	mitigated
																</div>
															</div>
															<div className="bg-slate-800/50 p-4 rounded-lg">
																<div className="flex items-center gap-2 text-slate-400 mb-2 text-sm">
																	<Trophy size={14} />
																	Gold Earned
																</div>
																<div className="text-yellow-400 font-medium text-lg">
																	{match.participant.goldEarned.toLocaleString()}
																</div>
																<div className="text-xs text-slate-400 mt-1">
																	{Math.round(
																		match.participant
																			.goldEarned /
																			(match.gameDuration /
																				60),
																	)}{" "}
																	GPM
																</div>
															</div>
															<div className="bg-slate-800/50 p-4 rounded-lg">
																<div className="flex items-center gap-2 text-slate-400 mb-2 text-sm">
																	<Eye size={14} />
																	Vision Control
																</div>
																<div className="text-blue-400 font-medium text-lg">
																	{match.participant.visionScore}
																</div>
																<div className="text-xs text-slate-400 mt-1">
																	{match.participant.wardsPlaced}
																	👁️{" "}
																	{match.participant.wardsKilled}
																	🗑️
																</div>
															</div>
														</div>

														{/* Performance Metrics */}
														<div className="grid grid-cols-2 md:grid-cols-3 gap-4">
															<div className="bg-slate-800/50 p-4 rounded-lg">
																<div className="flex items-center gap-2 text-slate-400 mb-2 text-sm">
																	<Sparkles size={14} />
																	Multi-Kills
																</div>
																<div className="space-y-1">
																	{match.participant.pentaKills >
																		0 && (
																		<div className="text-purple-400 font-bold">
																			🏆{" "}
																			{
																				match.participant
																					.pentaKills
																			}{" "}
																			Penta
																		</div>
																	)}
																	{match.participant.quadraKills >
																		0 && (
																		<div className="text-pink-400 font-bold">
																			💎{" "}
																			{
																				match.participant
																					.quadraKills
																			}{" "}
																			Quadra
																		</div>
																	)}
																	{match.participant.tripleKills >
																		0 && (
																		<div className="text-orange-400 font-bold">
																			🔥{" "}
																			{
																				match.participant
																					.tripleKills
																			}{" "}
																			Triple
																		</div>
																	)}
																	{match.participant.doubleKills >
																		0 && (
																		<div className="text-blue-400 font-bold">
																			⚡{" "}
																			{
																				match.participant
																					.doubleKills
																			}{" "}
																			Double
																		</div>
																	)}
																	{match.participant
																		.largestMultiKill <= 1 && (
																		<div className="text-slate-400">
																			No multi-kills
																		</div>
																	)}
																</div>
															</div>
															<div className="bg-slate-800/50 p-4 rounded-lg">
																<div className="flex items-center gap-2 text-slate-400 mb-2 text-sm">
																	<Flame size={14} />
																	Kill Streak
																</div>
																<div className="text-orange-400 font-medium text-lg">
																	{
																		match.participant
																			.largestKillingSpree
																	}
																</div>
																<div className="text-xs text-slate-400 mt-1">
																	Largest spree
																</div>
															</div>
															<div className="bg-slate-800/50 p-4 rounded-lg">
																<div className="flex items-center gap-2 text-slate-400 mb-2 text-sm">
																	<Coffee size={14} />
																	Healing
																</div>
																<div className="text-green-400 font-medium text-lg">
																	{match.participant.totalHeal.toLocaleString()}
																</div>
																<div className="text-xs text-slate-400 mt-1">
																	Total healed
																</div>
															</div>
														</div>
														<div className="col-span-2 md:col-span-4 bg-slate-800/50 p-4 rounded-lg">
															<div className="flex items-center gap-2 text-slate-400 mb-3 text-sm">
																<Activity size={14} />
																Team Performance
															</div>
															<div className="grid grid-cols-2 gap-4 text-sm">
																<div
																	className={`p-3 rounded border ${
																		match.participant.team ===
																		100
																			? "border-blue-500/50 bg-blue-500/10"
																			: "border-slate-600 bg-slate-700/30"
																	}`}
																>
																	<div className="font-medium mb-2">
																		Blue Team
																	</div>
																	<div className="space-y-1">
																		<div>
																			KDA:{" "}
																			{
																				match.teamStats.blue
																					.kills
																			}
																			/
																			{
																				match.teamStats.blue
																					.deaths
																			}
																			/
																			{
																				match.teamStats.blue
																					.assists
																			}
																		</div>
																		<div className="flex items-center gap-4 text-xs text-slate-400">
																			<span>
																				🐉{" "}
																				{
																					match.teamStats
																						.blue
																						.dragons
																				}
																			</span>
																			<span>
																				🦀{" "}
																				{
																					match.teamStats
																						.blue.barons
																				}
																			</span>
																			<span>
																				🏗️{" "}
																				{
																					match.teamStats
																						.blue.towers
																				}
																			</span>
																		</div>
																	</div>
																</div>
																<div
																	className={`p-3 rounded border ${
																		match.participant.team ===
																		200
																			? "border-red-500/50 bg-red-500/10"
																			: "border-slate-600 bg-slate-700/30"
																	}`}
																>
																	<div className="font-medium mb-2">
																		Red Team
																	</div>
																	<div className="space-y-1">
																		<div>
																			KDA:{" "}
																			{
																				match.teamStats.red
																					.kills
																			}
																			/
																			{
																				match.teamStats.red
																					.deaths
																			}
																			/
																			{
																				match.teamStats.red
																					.assists
																			}
																		</div>
																		<div className="flex items-center gap-4 text-xs text-slate-400">
																			<span>
																				🐉{" "}
																				{
																					match.teamStats
																						.red.dragons
																				}
																			</span>
																			<span>
																				🦀{" "}
																				{
																					match.teamStats
																						.red.barons
																				}
																			</span>
																			<span>
																				🏗️{" "}
																				{
																					match.teamStats
																						.red.towers
																				}
																			</span>
																		</div>
																	</div>
																</div>
															</div>
														</div>
													</div>
												</motion.div>
											)}
										</motion.div>
									))}
								</div>
							</div>
						</div>

						{/* Champion Performance */}
						<div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 shadow-xl rounded-lg">
							<div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 p-6 border-b border-slate-700/50 rounded-t-lg">
								<h2 className="text-lg font-bold text-white flex items-center gap-2">
									<Star className="text-blue-400" size={20} />
									PERFORMANCE ANALYSIS
								</h2>
							</div>
							<div className="p-6">
								<div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
									<div className="text-center bg-slate-900/30 p-6 rounded-lg border border-slate-700/30">
										<div className="flex items-center justify-center gap-2 mb-2">
											<Swords className="text-blue-400" size={20} />
										</div>
										<div className="text-3xl font-bold text-blue-400 mb-1">
											{(
												(careerStats.totalKills +
													careerStats.totalAssists) /
												careerStats.totalDeaths
											).toFixed(2)}
										</div>
										<div className="text-slate-400 text-sm">
											Kill Participation
										</div>
									</div>
									<div className="text-center bg-slate-900/30 p-6 rounded-lg border border-slate-700/30">
										<div className="flex items-center justify-center gap-2 mb-2">
											<TargetIcon className="text-green-400" size={20} />
										</div>
										<div className="text-3xl font-bold text-green-400 mb-1">
											{(
												careerStats.totalMinionKills /
												careerStats.totalGames
											).toFixed(1)}
										</div>
										<div className="text-slate-400 text-sm">
											Avg CS per Game
										</div>
									</div>
									<div className="text-center bg-slate-900/30 p-6 rounded-lg border border-slate-700/30">
										<div className="flex items-center justify-center gap-2 mb-2">
											<Eye className="text-purple-400" size={20} />
										</div>
										<div className="text-3xl font-bold text-purple-400 mb-1">
											{careerStats.averageVisionScore}
										</div>
										<div className="text-slate-400 text-sm">
											Avg Vision Score
										</div>
									</div>
								</div>

								<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
									<div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700/50">
										<div className="flex items-center gap-2 text-slate-400 mb-2 text-sm">
											<Zap size={14} />
											Total Damage
										</div>
										<div className="text-white font-semibold text-lg">
											{(careerStats.totalDamageDealt / 1000000).toFixed(1)}M
										</div>
									</div>
									<div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700/50">
										<div className="flex items-center gap-2 text-slate-400 mb-2 text-sm">
											<Trophy size={14} />
											Gold Earned
										</div>
										<div className="text-yellow-400 font-semibold text-lg">
											{(careerStats.totalGoldEarned / 1000000).toFixed(1)}M
										</div>
									</div>
									<div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700/50">
										<div className="flex items-center gap-2 text-slate-400 mb-2 text-sm">
											<Clock size={14} />
											Time Played
										</div>
										<div className="text-blue-400 font-semibold text-lg">
											{Math.floor(careerStats.totalTimeSpent / 60)}h
										</div>
									</div>
									<div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700/50">
										<div className="flex items-center gap-2 text-slate-400 mb-2 text-sm">
											<Eye size={14} />
											Wards Placed
										</div>
										<div className="text-blue-400 font-semibold text-lg">
											{careerStats.totalWardsPurchased.toLocaleString()}
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>

					{/* Right Column */}
					<div className="space-y-6">
						{/* Champion Mastery */}
						<div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 shadow-xl rounded-lg">
							<div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 p-6 border-b border-slate-700/50 rounded-t-lg">
								<div className="flex items-center justify-between">
									<h2 className="text-lg font-bold text-white flex items-center gap-2">
										<Medal className="text-blue-400" size={20} />
										CHAMPION MASTERY
									</h2>
									<button
										onClick={() => setMasteryMinimized(!masteryMinimized)}
										className="text-slate-400 hover:text-white transition-colors p-1 rounded-md hover:bg-slate-700/50"
									>
										{masteryMinimized ? (
											<Plus size={20} />
										) : (
											<Minus size={20} />
										)}
									</button>
								</div>
							</div>
							{!masteryMinimized && (
								<div className="p-6">
									<div className="space-y-3">
										{championMastery.map((champ, index) => (
											<motion.div
												key={champ.championId}
												initial={{ opacity: 0, x: 20 }}
												animate={{ opacity: 1, x: 0 }}
												transition={{
													delay: index * 0.1,
												}}
												className="bg-slate-900/50 border border-slate-700/50 p-4 rounded-lg hover:bg-slate-800/50 transition-colors"
											>
												<div className="flex items-center gap-3">
													<div className="relative">
														<div className="w-12 h-12 border border-slate-600 rounded-lg overflow-hidden">
															<Image
																src={getChampionImage(
																	champ.championName,
																)}
																alt={champ.championName}
																width={48}
																height={48}
																className="w-full h-full object-cover"
															/>
														</div>
														<div className="absolute -bottom-1 -right-1">
															{getRoleIcon(champ.role)}
														</div>
													</div>
													<div className="flex-1">
														<div className="flex items-center justify-between">
															<span className="text-white font-medium">
																{champ.championName}
															</span>
															<div className="flex items-center gap-2">
																<span
																	className={`text-xs px-2 py-1 rounded border font-medium ${
																		champ.championLevel === 7
																			? "border-blue-400 text-blue-400 bg-blue-400/10"
																			: champ.championLevel ===
																				  6
																				? "border-purple-400 text-purple-400 bg-purple-400/10"
																				: "border-slate-600 text-slate-400 bg-slate-600/10"
																	}`}
																>
																	M{champ.championLevel}
																</span>
																{champ.chestGranted && (
																	<div className="text-blue-400 bg-blue-400/10 p-1 rounded">
																		<Trophy size={12} />
																	</div>
																)}
															</div>
														</div>
														<div className="flex justify-between text-xs text-slate-400 mt-2">
															<div className="flex items-center gap-1">
																<Star size={10} />
																<span>
																	{champ.championPoints.toLocaleString()}{" "}
																	pts
																</span>
															</div>
															<div className="flex items-center gap-2">
																<span className="text-green-400">
																	{champ.winRate}% WR
																</span>
																<span>•</span>
																<span>
																	{champ.gamesPlayed} games
																</span>
															</div>
														</div>
														<div className="flex items-center justify-between text-xs mt-2">
															<div className="flex items-center gap-1 text-blue-400">
																<Activity size={10} />
																<span>
																	{champ.averageKDA} avg KDA
																</span>
															</div>
															<div className="flex items-center gap-1">
																{getRoleIcon(champ.role)}
																<span className="text-slate-400">
																	{champ.role}
																</span>
															</div>
														</div>
													</div>
												</div>
											</motion.div>
										))}
									</div>
								</div>
							)}
						</div>

						{/* Achievements */}
						<div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 shadow-xl rounded-lg">
							<div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 p-6 border-b border-slate-700/50 rounded-t-lg">
								<div className="flex items-center justify-between">
									<h2 className="text-lg font-bold text-white flex items-center gap-2">
										<Trophy className="text-yellow-400" size={20} />
										ACHIEVEMENTS
									</h2>
									<button
										onClick={() =>
											setAchievementsMinimized(!achievementsMinimized)
										}
										className="text-slate-400 hover:text-white transition-colors p-1 rounded-md hover:bg-slate-700/50"
									>
										{achievementsMinimized ? (
											<Plus size={20} />
										) : (
											<Minus size={20} />
										)}
									</button>
								</div>
							</div>
							{!achievementsMinimized && (
								<div className="p-6">
									<div className="space-y-3">
										{achievements.map((achievement, index) => (
											<motion.div
												key={achievement.id}
												initial={{
													opacity: 0,
													scale: 0.9,
												}}
												animate={{
													opacity: 1,
													scale: 1,
												}}
												transition={{
													delay: index * 0.1,
												}}
												className="bg-slate-900/50 border border-slate-700/50 p-4 rounded-lg hover:bg-slate-800/50 transition-colors"
											>
												<div className="flex items-start gap-3">
													<div className="text-3xl bg-slate-800/50 p-2 rounded-lg">
														{achievement.icon}
													</div>
													<div className="flex-1">
														<div className="flex items-start justify-between">
															<div>
																<div className="text-white font-medium">
																	{achievement.title}
																</div>
																<div className="text-slate-400 text-sm">
																	{achievement.description}
																</div>
															</div>
															<div className="flex items-center gap-1">
																{getRarityIcon(achievement.rarity)}
															</div>
														</div>
														<div className="flex items-center gap-2 text-xs text-slate-500 mt-2">
															<Calendar size={10} />
															<span>
																Unlocked {achievement.unlockedDate}
															</span>
														</div>
														{achievement.progress.current <
															achievement.progress.max && (
															<div className="mt-3">
																<div className="w-full bg-slate-700 h-2 rounded-full overflow-hidden">
																	<div
																		className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 transition-all duration-300"
																		style={{
																			width: `${Math.min(
																				100,
																				(achievement
																					.progress
																					.current /
																					achievement
																						.progress
																						.max) *
																					100,
																			)}%`,
																		}}
																	/>
																</div>
																<div className="text-xs text-slate-400 mt-1">
																	{achievement.progress.current} /{" "}
																	{achievement.progress.max}
																</div>
															</div>
														)}
													</div>
												</div>
											</motion.div>
										))}
									</div>
								</div>
							)}
						</div>

						{/* Live Game Status */}
						<div
							className={`bg-slate-800/50 backdrop-blur-sm border shadow-xl rounded-lg ${
								liveGame
									? "border-green-500/50 shadow-green-500/20"
									: "border-slate-700/50"
							}`}
						>
							<div
								className={`p-6 border-b border-slate-700/50 rounded-t-lg ${
									liveGame
										? "bg-gradient-to-r from-green-600/20 to-blue-600/20"
										: "bg-gradient-to-r from-blue-600/20 to-purple-600/20"
								}`}
							>
								<div className="flex items-center justify-between">
									<h2 className="text-lg font-bold text-white flex items-center gap-2">
										{liveGame ? (
											<>
												<Play className="text-green-400" size={20} />
												LIVE GAME
											</>
										) : (
											<>
												<Pause className="text-slate-400" size={20} />
												GAME STATUS
											</>
										)}
									</h2>
									<button
										onClick={() => setGameStatusMinimized(!gameStatusMinimized)}
										className="text-slate-400 hover:text-white transition-colors p-1 rounded-md hover:bg-slate-700/50"
									>
										{gameStatusMinimized ? (
											<Plus size={20} />
										) : (
											<Minus size={20} />
										)}
									</button>
								</div>
							</div>
							{!gameStatusMinimized && (
								<div className="p-6">
									{liveGame ? (
										<div className="space-y-4">
											<div className="text-center bg-gradient-to-r from-green-500/10 to-blue-500/10 p-4 rounded-lg border border-green-500/30">
												<div className="flex items-center justify-center gap-2 text-green-400 font-semibold text-lg mb-2">
													<div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
													Currently In Game
												</div>
												<div className="flex items-center justify-center gap-1 text-slate-300 text-sm mb-3">
													<Gamepad2 size={14} />
													<span>
														{liveGame.queueId === 420
															? "Ranked Solo/Duo"
															: "Normal Game"}
													</span>
												</div>
												<div className="flex items-center justify-center gap-2 text-green-400 font-mono text-2xl">
													<Timer size={20} />
													{formatGameTime(liveGame.gameStartTime)}
												</div>
											</div>

											<div className="bg-slate-900/50 border border-slate-700/50 p-4 rounded-lg">
												<div className="flex items-center gap-3 mb-4">
													<div className="w-10 h-10 border border-slate-600 rounded-lg overflow-hidden">
														<Image
															src={getChampionImage(
																liveGame.participant.championName,
															)}
															alt={liveGame.participant.championName}
															width={40}
															height={40}
															className="w-full h-full object-cover"
														/>
													</div>
													<div>
														<div className="text-white font-medium">
															{liveGame.participant.championName}
														</div>
														<div className="flex items-center gap-1 text-blue-300 text-sm">
															{getRoleIcon(
																liveGame.participant.position,
															)}
															<span>
																{liveGame.participant.position}
															</span>
														</div>
													</div>
												</div>

												<div className="space-y-4">
													<div>
														<div className="flex items-center gap-2 text-blue-400 text-sm font-medium mb-3">
															<Shield size={14} />
															Blue Team
														</div>
														<div className="space-y-2">
															{liveGame.teams.blue.map(
																(player, idx) => (
																	<div
																		key={idx}
																		className="flex justify-between items-center text-xs bg-blue-500/10 px-3 py-2 rounded border border-blue-500/20"
																	>
																		<div className="flex items-center gap-2">
																			{getRoleIcon(
																				player.position,
																			)}
																			<span
																				className={
																					player.summonerName ===
																					playerProfile.summonerName
																						? "text-blue-400 font-medium"
																						: "text-slate-300"
																				}
																			>
																				{
																					player.championName
																				}
																			</span>
																		</div>
																		<span className="text-slate-400">
																			{player.rank}
																		</span>
																	</div>
																),
															)}
														</div>
													</div>

													<div>
														<div className="flex items-center gap-2 text-red-400 text-sm font-medium mb-3">
															<Sword size={14} />
															Red Team
														</div>
														<div className="space-y-2">
															{liveGame.teams.red.map(
																(player, idx) => (
																	<div
																		key={idx}
																		className="flex justify-between items-center text-xs bg-red-500/10 px-3 py-2 rounded border border-red-500/20"
																	>
																		<div className="flex items-center gap-2">
																			{getRoleIcon(
																				player.position,
																			)}
																			<span className="text-slate-300">
																				{
																					player.championName
																				}
																			</span>
																		</div>
																		<span className="text-slate-400">
																			{player.rank}
																		</span>
																	</div>
																),
															)}
														</div>
													</div>
												</div>

												<div className="mt-6 pt-4 border-t border-slate-700/50">
													<button className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-500 hover:to-blue-500 text-white py-3 font-medium transition-all duration-200 rounded-lg flex items-center justify-center gap-2">
														<Eye size={16} />
														Spectate Game
													</button>
												</div>
											</div>
										</div>
									) : (
										<div className="text-center text-slate-400 py-8">
											<div className="flex items-center justify-center gap-2 mb-2">
												<Coffee size={20} />
											</div>
											<div>Not currently in game</div>
											<div className="text-sm text-slate-500 mt-1">
												Waiting for next match...
											</div>
										</div>
									)}
								</div>
							)}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
