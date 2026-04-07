"use client";

import { AnimatePresence, motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import {
	Activity,
	Award,
	ChevronRight,
	Clock,
	Filter,
	Plus,
	Search,
	Star,
	TrendingUp,
	Users,
	X,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
	const router = useRouter();
	const containerRef = useRef<HTMLDivElement>(null);

	const virtualScrollY = useMotionValue(0); // Create a motion value to track virtual scroll
	// Use useSpring for smoother animations with physics-based damping
	const smoothScrollY = useSpring(virtualScrollY, {
		stiffness: 80, // Lower stiffness for smoother animation
		damping: 20, // Higher damping reduces oscillation
		mass: 1, // Mass affects momentum
	});

	const transitionStart = 0;
	const transitionEnd = 800; // Increased for smoother transition

	const handleWheel = useCallback(
		(e: WheelEvent) => {
			e.preventDefault(); // Prevent default browser scroll

			const currentY = virtualScrollY.get();
			// Scale the delta for smoother, more controlled scrolling
			let newY = currentY + e.deltaY * 0.5;

			// Clamp the virtual scroll value between start and end
			newY = Math.max(transitionStart, Math.min(newY, transitionEnd));

			virtualScrollY.set(newY); // Update the motion value directly
		},
		[virtualScrollY, transitionEnd], // Dependencies for useCallback
	);

	// Handle touch events for mobile devices
	const handleTouchStart = useRef({ y: 0, scrollY: 0 });

	const handleTouchMove = useCallback(
		(e: TouchEvent) => {
			e.preventDefault();
			const touchY = e.touches[0].clientY;
			const deltaY = handleTouchStart.current.y - touchY;

			const currentY = handleTouchStart.current.scrollY;
			// Scale deltaY for better touch control
			let newY = currentY + deltaY * 2;

			// Clamp the scroll value
			newY = Math.max(transitionStart, Math.min(newY, transitionEnd));

			virtualScrollY.set(newY);
		},
		[virtualScrollY, transitionEnd],
	);

	useEffect(() => {
		const container = containerRef.current;
		if (container) {
			// Add wheel event listener
			container.addEventListener("wheel", handleWheel, {
				passive: false,
			});

			// Add touch events for mobile
			container.addEventListener(
				"touchstart",
				(e) => {
					handleTouchStart.current = {
						y: e.touches[0].clientY,
						scrollY: virtualScrollY.get(),
					};
				},
				{ passive: false },
			);

			container.addEventListener("touchmove", handleTouchMove, {
				passive: false,
			});
		}

		return () => {
			if (container) {
				container.removeEventListener("wheel", handleWheel);
				container.removeEventListener("touchmove", handleTouchMove);
			}
		};
	}, [handleWheel, handleTouchMove, virtualScrollY]); // Re-attach if handlers change

	// Use smoothScrollY for all animations instead of virtualScrollY
	const headingOpacity = useTransform(
		smoothScrollY, // Use smooth scroll value
		[transitionStart, transitionEnd * 0.7],
		[1, 0],
	);
	const headingX = useTransform(
		smoothScrollY, // Use smooth scroll value
		[transitionStart, transitionEnd],
		[0, -300],
	);
	const contentOpacity = useTransform(
		smoothScrollY, // Use smooth scroll value
		[transitionStart + 150, transitionEnd],
		[0, 1],
	);
	const contentX = useTransform(
		smoothScrollY, // Use smooth scroll value
		[transitionStart + 150, transitionEnd],
		[300, 0],
	);

	const headingPointerEvents = useTransform(
		smoothScrollY,
		[transitionEnd * 0.7 - 1, transitionEnd * 0.7], // Trigger slightly before opacity hits 0
		["auto", "none"],
	);
	const contentPointerEvents = useTransform(
		smoothScrollY,
		[transitionStart + 149, transitionStart + 150], // Adjusted to match our new contentOpacity range
		["none", "auto"],
	);

	const [searchTerm, setSearchTerm] = useState("");
	const [userTeamSearchTerm, setUserTeamSearchTerm] = useState("");
	const [activeTab, setActiveTab] = useState("all");
	const [animatedIndex, setAnimatedIndex] = useState(-1);

	const allDrafts = [
		{
			name: "Tournament Lineup",
			tags: ["5v5", "Ranked"],
			gameIcon: "/api/placeholder/48/48",
			date: "Apr 26, 2025",
			versions: 3,
			active: true,
			players: 5,
			category: "competitive",
			lastEditedBy: "Toxicmaster96",
			starred: true,
		},
		{
			name: "Stealth Squad",
			tags: ["VALORANT", "Tactical"],
			gameIcon: "/api/placeholder/48/48",
			date: "Apr 25, 2025",
			versions: 4,
			active: false,
			players: 5,
			category: "casual",
			lastEditedBy: "SniperQueen",
			starred: false,
		},
		{
			name: "Team Obliteration",
			tags: ["CSGO", "Pro"],
			gameIcon: "/api/placeholder/48/48",
			date: "Apr 24, 2025",
			versions: 2,
			active: false,
			players: 5,
			category: "competitive",
			lastEditedBy: "HeadshotKing",
			starred: true,
		},
		{
			name: "Meta Breakers",
			tags: ["LoL", "Experimental"],
			gameIcon: "/api/placeholder/48/48",
			date: "Apr 22, 2025",
			versions: 5,
			active: false,
			players: 5,
			category: "experimental",
			lastEditedBy: "JungleGap",
			starred: false,
		},
		{
			name: "Strategy Plan Alpha",
			tags: ["LoL", "Strategy"],
			gameIcon: "/api/placeholder/48/48",
			date: "Apr 20, 2025",
			versions: 2,
			active: false,
			players: 5,
			category: "strategy",
			lastEditedBy: "MidDiff",
			starred: false,
		},
		{
			name: "Rocket Domination",
			tags: ["Rocket League", "3v3"],
			gameIcon: "/api/placeholder/48/48",
			date: "Apr 18, 2025",
			versions: 3,
			active: false,
			players: 3,
			category: "casual",
			lastEditedBy: "AerialMaster",
			starred: true,
		},
	];

	const teamStats = {
		winRate: "67%",
		totalMatches: 24,
		avgScore: "16:9",
		topPlayers: ["Toxicmaster96", "HeadshotKing", "MidDiff"],
	};

	const filteredDrafts = allDrafts.filter((draft) => {
		const matchesSearch =
			draft.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
			draft.tags.some((tag) => tag.toLowerCase().includes(searchTerm.toLowerCase()));

		if (activeTab === "all") return matchesSearch;
		if (activeTab === "starred") return matchesSearch && draft.starred;
		if (activeTab === "active") return matchesSearch && draft.active;
		return matchesSearch && draft.category === activeTab;
	});

	useEffect(() => {
		const currentContentOpacity = contentOpacity.get();
		if (currentContentOpacity > 0.1 && animatedIndex < filteredDrafts.length - 1) {
			const timer = setTimeout(() => {
				setAnimatedIndex((prev) => prev + 1);
			}, 80);
			return () => clearTimeout(timer);
		}
		// else if (currentContentOpacity <= 0.1 && animatedIndex !== -1) {
		// 	setAnimatedIndex(-1);
		// }
	}, [animatedIndex, filteredDrafts.length, contentOpacity]);

	useEffect(() => {
		setAnimatedIndex(filteredDrafts.length);
		const timer = setTimeout(() => {
			if (contentOpacity.get() > 0.1) {
				setAnimatedIndex(0);
			}
		}, 50);
		return () => clearTimeout(timer);
	}, [activeTab, searchTerm, contentOpacity, filteredDrafts.length]);

	return (
		<div
			ref={containerRef}
			className="relative isolate w-full h-full flex pr-[6px]" // Main scroll container
		>
			{/* Background Elements (Fixed) */}
			<div
				aria-hidden="true"
				className="fixed inset-0 overflow-hidden pointer-events-none z-0"
			>
				<div className="absolute inset-0 bg-[linear-gradient(to_right,#222_1px,transparent_1px),linear-gradient(to_bottom,#222_1px,transparent_1px)] bg-[size:40px_40px] opacity-10" />
				{/* Animated Blobs */}
				<div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-cyan-500/5 blur-3xl animate-pulse" />
				<div
					className="absolute bottom-1/3 right-1/3 w-64 h-64 rounded-full bg-blue-600/5 blur-3xl animate-pulse"
					style={{ animationDelay: "1s" }}
				/>
				<div
					className="absolute top-1/2 right-1/4 w-80 h-80 rounded-full bg-indigo-500/5 blur-3xl animate-pulse"
					style={{ animationDelay: "2s" }}
				/>
			</div>

			{/* Container for the transitioning elements */}
			<div className="relative min-h-full w-full">
				<motion.div
					style={{
						opacity: headingOpacity,
						x: headingX,
						pointerEvents: headingPointerEvents,
					}}
					className="absolute inset-0 flex flex-col justify-center items-center px-6 py-20 sm:px-10 lg:px-20 text-center z-10"
				>
					<div className="max-w-4xl mx-auto relative">
						{/* Title */}
						<div className="relative mb-6">
							<h1 className="text-6xl sm:text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-blue-500">
								Competitive E-Sports Network
							</h1>
							<div className="absolute -inset-1 bg-cyan-500/10 blur-lg -z-10 rounded-full"></div>
						</div>
						{/* Divider */}
						<div className="w-32 h-1 bg-gradient-to-r from-cyan-500 to-blue-600 mx-auto mb-6"></div>
						{/* Subtitle */}
						<p className="text-lg text-gray-300 mb-6 max-w-2xl mx-auto">
							<span className="text-cyan-400 font-medium">Level up</span> your
							strategy with the ultimate drafting tool for competitive gaming
						</p>
						{/* Quick Stats */}
						<div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto mb-8">
							{/* Stats Items - using simple divs as motion is handled by parent */}
							<div className="bg-gray-800/50 backdrop-blur-sm border  rounded-lg p-3 text-center">
								<div className="text-cyan-400 text-xl font-bold">24</div>
								<div className="text-gray-400 text-sm">Active Drafts</div>
							</div>
							<div className="bg-gray-800/50 backdrop-blur-sm border  rounded-lg p-3 text-center">
								<div className="text-cyan-400 text-xl font-bold">143</div>
								<div className="text-gray-400 text-sm">Matches Played</div>
							</div>
							<div className="bg-gray-800/50 backdrop-blur-sm border  rounded-lg p-3 text-center">
								<div className="text-cyan-400 text-xl font-bold">7</div>
								<div className="text-gray-400 text-sm">Team Members</div>
							</div>
							<div className="bg-gray-800/50 backdrop-blur-sm border  rounded-lg p-3 text-center">
								<div className="text-cyan-400 text-xl font-bold">67%</div>
								<div className="text-gray-400 text-sm">Win Rate</div>
							</div>
						</div>
						{/* Search */}
						<div className="mb-8 max-w-2xl mx-auto">
							<div className="relative p-1 border border-cyan-500/30 rounded-lg bg-gray-900/60 backdrop-blur-md shadow-lg shadow-cyan-500/5 group transition-all duration-300 hover:shadow-cyan-500/10">
								<div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
								<div className="flex items-center">
									<Search className="ml-3 text-gray-400" size={20} />
									<input
										type="text"
										placeholder="Search drafts, teams, or players..."
										value={userTeamSearchTerm}
										onChange={(e) => setUserTeamSearchTerm(e.target.value)}
										className="w-full px-3 py-3 bg-transparent border-none rounded-md text-gray-200 placeholder-gray-500 focus:outline-none transition-colors"
									/>
									{userTeamSearchTerm && (
										<button
											onClick={() => setUserTeamSearchTerm("")}
											className="mr-3 text-gray-400 hover:text-gray-200"
										>
											<X size={18} />
										</button>
									)}
								</div>
							</div>
						</div>
						{/* CTA Button */}

						<motion.button
							whileHover={{ scale: 1.05 }}
							whileTap={{ scale: 0.95 }}
							className="relative group overflow-hidden hover:cursor-pointer"
							onClick={() => {
								router.push("/draft");
							}}
						>
							<span className="absolute inset-0 bg-gradient-to-r from-cyan-600 to-blue-700 rounded-md"></span>
							<span className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
							<span className="absolute inset-0 bg-gradient-to-r from-cyan-400/20 to-blue-400/20 blur-xl rounded-md opacity-0 group-hover:opacity-100 transition-opacity"></span>
							<span className="relative block bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold rounded-md px-10 py-4 text-lg transition-all duration-300 shadow-[0_0_20px_rgba(96,204,247,0.3)] hover:shadow-[0_0_30px_rgba(96,204,247,0.5)]">
								START DRAFTING
							</span>
						</motion.button>
					</div>
				</motion.div>
				{/* Main Content Section (Absolutely Positioned) */}
				<motion.main
					style={{
						opacity: contentOpacity,
						x: contentX,
						pointerEvents: contentPointerEvents,
					}}
					className="absolute inset-0 grid grid-cols-1 lg:grid-cols-3 gap-6 px-6 sm:px-10 lg:px-20 py-6 lg:py-10 z-20 overflow-y-auto mb-1"
				>
					{/* Draft History Section */}
					<div className="lg:col-span-2 h-full flex">
						{/* Card Styling */}
						<div className="rounded-xl bg-gray-900/60 backdrop-blur-md border  shadow-lg transition-all duration-300 overflow-hidden relative group hover:shadow-[0_0_20px_rgba(96,204,247,0.2)] h-full flex flex-col w-full">
							{/* Added h-full, flex, flex-col */}
							{/* Header */}
							<div className="bg-gradient-to-r from-cyan-900/80 to-blue-900/80 p-4 flex items-center justify-between relative flex-shrink-0">
								{/* Added flex-shrink-0 */}
								<div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:4px_4px]"></div>
								<div className="flex items-center space-x-3">
									<TrendingUp className="text-cyan-400" size={20} />
									<h2 className="text-white font-bold text-lg">DRAFT LIBRARY</h2>
								</div>
								<div className="flex space-x-2">
									<div className="w-3 h-3 rounded-full bg-cyan-400/80"></div>
									<div className="w-3 h-3 rounded-full bg-blue-500/60"></div>
									<div className="w-3 h-3 rounded-full bg-gray-400/50"></div>
								</div>
							</div>
							{/* Tabs & Search */}
							<div className="flex flex-col sm:flex-row sm:items-center justify-between border-b  p-4 gap-4 flex-shrink-0">
								{/* Added flex-shrink-0 */}
								{/* Tabs */}
								<div className="flex space-x-1 overflow-x-auto scrollbar-hide pb-1 relative">
									{[
										{ id: "all", label: "All Drafts" },
										{ id: "active", label: "Active" },
										{ id: "starred", label: "Starred" },
										{
											id: "competitive",
											label: "Competitive",
										},
										{ id: "casual", label: "Casual" },
										{ id: "strategy", label: "Strategy" },
									].map((tab) => (
										<button
											key={tab.id}
											onClick={() => setActiveTab(tab.id)}
											className={`px-4 py-2 rounded-md relative transition-all duration-300 whitespace-nowrap ${
												activeTab === tab.id
													? "text-cyan-300 bg-cyan-900/30"
													: "text-gray-400 hover:text-gray-200 hover:bg-gray-800/30"
											}`}
										>
											{tab.label}
											{activeTab === tab.id && (
												<motion.div
													layoutId="activeTabIndicator"
													className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-400"
												/>
											)}
										</button>
									))}
								</div>
								{/* Search */}
								<div className="flex gap-2">
									<div className="relative flex-grow">
										<input
											type="text"
											placeholder="Search drafts..."
											value={searchTerm}
											onChange={(e) => setSearchTerm(e.target.value)}
											className="w-full px-3 py-2 bg-gray-800/80 border border-gray-700 rounded-md text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 transition-colors"
										/>
										<Search
											className="absolute right-3 top-2.5 text-gray-500"
											size={16}
										/>
									</div>
									<button className="p-2 bg-gray-800/80 border border-gray-700 rounded-md text-gray-300 hover:text-cyan-400 hover:border-cyan-500/50 transition-colors">
										<Filter size={18} />
									</button>
								</div>
							</div>
							{/* Draft list */}
							<div className="p-4 space-y-3 overflow-y-auto custom-scrollbar flex-1">
								{/* Added max-height with calc for better fit */}
								<AnimatePresence mode="sync">
									{/* Added mode="wait" */}
									{filteredDrafts.length > 0 &&
										filteredDrafts.map((draft, index) => (
											<motion.div
												key={`${activeTab}-${searchTerm}-${draft.name}`} // More specific key for AnimatePresence
												initial={{
													opacity: 0,
													// y: 20
												}}
												animate={{
													opacity: index <= animatedIndex ? 1 : 0,
													// y:
													// 	index <= animatedIndex
													// 		? 0
													// 		: 20,
												}}
												exit={{
													opacity: 0,
													// y: -10
												}} // Slightly different exit
												transition={{ duration: 0.25 }} // Faster item transition
												whileHover={{
													scale: 1.015,
													backgroundColor: draft.active
														? "rgba(6, 182, 212, 0.15)"
														: "rgba(96, 204, 247, 0.05)",
												}}
												className={`flex items-center p-3 rounded-lg cursor-pointer transition-all duration-200 ${
													draft.active
														? "bg-cyan-900/30 border-l-4 border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.1)]"
														: "bg-gray-800/30 hover:bg-gray-800/50"
												}`}
											>
												{/* Icon */}
												<div className="mr-4 relative flex-shrink-0">
													{/* <Image
														src={draft.gameIcon}
														alt="Game icon"
														width={40}
														height={40}
														className="rounded-md"
													/> */}
													{draft.starred && (
														<div className="absolute -top-1.5 -right-1.5 bg-yellow-500 rounded-full p-0.5 shadow-md">
															<Star
																size={10}
																className="text-gray-900"
																fill="currentColor"
															/>
														</div>
													)}
												</div>
												{/* Info */}
												<div className="flex-grow min-w-0">
													{/* Added min-w-0 for flex truncation */}
													<div className="flex items-center flex-wrap gap-x-2">
														<h3
															className={`font-medium truncate ${
																draft.active
																	? "text-cyan-300"
																	: "text-gray-200"
															}`}
														>
															{draft.name}
														</h3>
														{draft.active && (
															<span className="flex-shrink-0 ml-auto sm:ml-2 bg-cyan-500/20 text-cyan-400 text-xs px-2 py-0.5 rounded-full inline-flex items-center">
																<Activity
																	size={10}
																	className="mr-1"
																/>{" "}
																Active
															</span>
														)}
													</div>
													<div className="flex gap-1.5 mt-1 flex-wrap">
														{draft.tags.map((tag, idx) => (
															<span
																key={idx}
																className={`text-xs px-1.5 py-0.5 rounded ${
																	draft.active
																		? "bg-cyan-800/50 text-cyan-200"
																		: "bg-gray-700/70 text-gray-300"
																}`}
															>
																{tag}
															</span>
														))}
													</div>
													<div className="flex items-center mt-1.5 text-xs text-gray-400 truncate">
														<span className="flex items-center flex-shrink-0">
															<Users size={12} className="mr-1" />
															{draft.players}p
														</span>
														<span className="mx-1.5">•</span>
														<span className="truncate">
															Edited by {draft.lastEditedBy}
														</span>
													</div>
												</div>
												{/* Date/Version/Action */}
												<div className="text-right ml-3 flex-shrink-0">
													<div
														className={`text-sm font-medium ${
															draft.active
																? "text-cyan-400"
																: "text-gray-300"
														}`}
													>
														{draft.date}
													</div>
													<div className="text-xs text-gray-500 mt-1">
														v{draft.versions}
													</div>
													<div className="mt-2 flex justify-end">
														<ChevronRight
															size={18}
															className="text-gray-500 group-hover:text-cyan-400 transition-colors"
														/>
													</div>
												</div>
											</motion.div>
										))}
									{filteredDrafts.length === 0 && (
										<motion.div
											key="no-results"
											initial={{ opacity: 0 }}
											animate={{ opacity: 1 }}
											exit={{ opacity: 0 }}
											className="text-center py-16 flex flex-col items-center"
										>
											<div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-800/50 mb-4 border border-gray-700">
												<Search size={28} className="text-gray-500" />
											</div>
											<p className="text-gray-400 font-medium">
												No drafts found.
											</p>
											<p className="text-gray-500 text-sm mt-1">
												Try adjusting your search or filters.
											</p>
											<button
												onClick={() => {
													setSearchTerm("");
													setActiveTab("all");
												}}
												className="mt-4 text-cyan-400 hover:text-cyan-300 text-sm font-medium"
											>
												Clear Filters
											</button>
										</motion.div>
									)}
								</AnimatePresence>
							</div>
							{/* Action Button Footer */}
							<div className="p-4 border-t  flex-shrink-0">
								{/* Added flex-shrink-0 */}
								<motion.button
									whileHover={{ scale: 1.03 }}
									whileTap={{ scale: 0.97 }}
									className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold rounded-md px-5 py-2.5 flex items-center shadow-[0_0_15px_rgba(6,182,212,0.2)] hover:shadow-[0_0_20px_rgba(6,182,212,0.3)] transition-all duration-200"
								>
									<Plus size={18} className="mr-1.5" /> NEW DRAFT
								</motion.button>
							</div>
						</div>
					</div>

					{/* Side Panel - Stats & Activity */}
					<div className="space-y-6">
						{/* Team Stats Panel */}
						<div className="rounded-xl bg-gray-900/60 backdrop-blur-md border  shadow-lg transition-all duration-300 overflow-hidden">
							{/* Header */}
							<div className="bg-gradient-to-r from-blue-900/80 to-indigo-900/80 p-4 flex items-center justify-between relative">
								<div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:4px_4px]"></div>
								<div className="flex items-center space-x-3 z-10">
									<Award className="text-blue-400" size={20} />
									<h2 className="text-white font-bold text-lg">TEAM STATS</h2>
								</div>
								<div className="w-3 h-3 rounded-full bg-blue-400/80 z-10"></div>
							</div>
							{/* Content */}
							<div className="p-5 space-y-4">
								<div className="grid grid-cols-2 gap-4">
									<div className="bg-gray-800/40 backdrop-blur-sm rounded-lg p-3 border border-gray-700/50">
										<div className="text-gray-400 text-xs mb-1 uppercase tracking-wider">
											Win Rate
										</div>
										<div className="text-blue-400 text-2xl font-bold">
											{teamStats.winRate}
										</div>
									</div>
									<div className="bg-gray-800/40 backdrop-blur-sm rounded-lg p-3 border border-gray-700/50">
										<div className="text-gray-400 text-xs mb-1 uppercase tracking-wider">
											Matches
										</div>
										<div className="text-blue-400 text-2xl font-bold">
											{teamStats.totalMatches}
										</div>
									</div>
									<div className="bg-gray-800/40 backdrop-blur-sm rounded-lg p-3 border border-gray-700/50">
										<div className="text-gray-400 text-xs mb-1 uppercase tracking-wider">
											Avg Score
										</div>
										<div className="text-blue-400 text-2xl font-bold">
											{teamStats.avgScore}
										</div>
									</div>
									<div className="bg-gray-800/40 backdrop-blur-sm rounded-lg p-3 border border-gray-700/50">
										<div className="text-gray-400 text-xs mb-1 uppercase tracking-wider">
											Ranking
										</div>
										<div className="text-blue-400 text-2xl font-bold">
											Top 5%
										</div>
									</div>
								</div>
								<div className="bg-gray-800/40 backdrop-blur-sm rounded-lg p-4 border border-gray-700/50">
									<div className="text-gray-300 font-medium mb-3 text-sm">
										Top Performers
									</div>
									<div className="space-y-2.5">
										{teamStats.topPlayers.map((player, idx) => (
											<div
												key={idx}
												className="flex items-center justify-between text-sm"
											>
												<div className="flex items-center">
													<div
														className={`w-6 h-6 rounded-full flex items-center justify-center mr-2.5 text-xs font-bold ${
															idx === 0
																? "bg-yellow-500/80 text-yellow-900"
																: idx === 1
																	? "bg-gray-400/80 text-gray-900"
																	: "bg-yellow-800/60 text-yellow-200"
														}`}
													>
														{idx + 1}
													</div>
													<span className="text-gray-200">{player}</span>
												</div>
												<div className="text-blue-400 font-medium">
													{90 - idx * 5}%
													<span className="text-xs text-gray-400">
														WR
													</span>
												</div>
											</div>
										))}
									</div>
								</div>
							</div>
						</div>

						{/* Upcoming Events Panel */}
						<motion.div
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							transition={{ duration: 0.4, delay: 0.1 }} // Slight delay after parent
							className="rounded-xl bg-gray-900/60 backdrop-blur-md border  shadow-lg overflow-hidden"
						>
							{/* Header */}
							<div className="bg-gradient-to-r from-indigo-900/80 to-blue-900/80 p-4 flex items-center justify-between relative">
								<div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:4px_4px]"></div>
								<div className="flex items-center space-x-3 z-10">
									<Clock className="text-indigo-400" size={20} />
									<h2 className="text-white font-bold text-lg">
										UPCOMING EVENTS
									</h2>
								</div>
								<div className="w-3 h-3 rounded-full bg-indigo-400/80 z-10"></div>
							</div>
							{/* Content */}
							<div className="p-4">
								<div className="space-y-3">
									{[
										{
											name: "Weekend Tournament",
											game: "League of Legends",
											date: "May 2, 2025",
											time: "18:00",
										},
										{
											name: "Team Practice",
											game: "VALORANT",
											date: "May 5, 2025",
											time: "20:00",
										},
										{
											name: "Regional Qualifier",
											game: "Rocket League",
											date: "May 12, 2025",
											time: "13:00",
										},
									].map((event, idx) => (
										<motion.div
											key={idx}
											initial={{ opacity: 0, y: 10 }}
											animate={{ opacity: 1, y: 0 }}
											transition={{
												duration: 0.3,
												delay: idx * 0.1 + 0.2,
											}} // Stagger + Parent delay
											className="p-3 rounded-lg bg-gray-800/40 hover:bg-gray-800/60 transition-colors border border-gray-700/50"
										>
											<div className="flex justify-between items-start gap-2">
												<h3 className="text-indigo-300 font-medium text-sm">
													{event.name}
												</h3>
												<div className="text-xs bg-indigo-900/60 text-indigo-200 rounded px-1.5 py-0.5 flex-shrink-0">
													{event.game}
												</div>
											</div>
											<div className="flex items-center mt-2 text-gray-400 text-xs">
												<div className="w-1.5 h-1.5 rounded-full bg-indigo-400 mr-2"></div>
												{event.date} <span className="mx-1">•</span>
												{event.time}
											</div>
										</motion.div>
									))}
									{/* Add a placeholder if no events */}
									{/* <p className="text-center text-gray-500 py-4 text-sm">No upcoming events scheduled.</p> */}
								</div>
							</div>
						</motion.div>
					</div>
				</motion.main>
			</div>

			{/* ****** ADD THIS SPACER ****** */}
			{/* This div adds height *to the scroll container's flow*, enabling scrolling */}
			{/* Make its height at least `transitionEnd` pixels, maybe more for comfort */}
			{/* <div className="h-[1400px]" /> */}
			{/* You could also use viewport units like h-[50vh] or h-[100vh] */}
			{/* **************************** */}
		</div>
	);
}
