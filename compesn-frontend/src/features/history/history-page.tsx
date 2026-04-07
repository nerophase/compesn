"use client";

import { motion, useMotionValue, useSpring } from "framer-motion";
import {
	Activity,
	ArrowLeft,
	ArrowRight,
	Search,
	Sliders,
	Plus,
	X,
	Trophy,
	Target,
	Clock,
	BarChart2,
	MousePointer2,
	Move,
	ChevronLeft,
	ChevronRight,
	Minimize2,
	Maximize2,
} from "lucide-react";
import { useEffect, useState, useRef, useCallback } from "react";

// Only League of Legends stats
const statConfig = {
	"League of Legends": [
		{ key: "kda", label: "KDA", higherIsBetter: true, type: "kda" },
		{ key: "cs", label: "CS", higherIsBetter: true },
		{ key: "damage", label: "Damage", higherIsBetter: true },
		{ key: "gold", label: "Gold", higherIsBetter: true },
		{ key: "vision", label: "Vision Score", higherIsBetter: true },
	],
};

const parseKDA = (kda: string) => {
	const parts = kda.split("/").map(Number);
	if (parts.length !== 3) return 0;
	const [k, d, a] = parts;
	if (d === 0) return k + a;
	return (k + a) / d;
};

const CrossReferencedStats = ({ match1, match2 }: { match1: any; match2: any }) => {
	const gameStats = statConfig["League of Legends"];

	const StatRow = ({
		stat,
	}: {
		stat: {
			key: string;
			label: string;
			higherIsBetter: boolean;
			type?: string;
		};
	}) => {
		const rawValue1 = match1[stat.key] || "0";
		const rawValue2 = match2[stat.key] || "0";

		let v1, v2;
		if (stat.type === "kda") {
			v1 = parseKDA(rawValue1);
			v2 = parseKDA(rawValue2);
		} else {
			v1 = parseFloat(rawValue1.toString().replace(/,|%/g, ""));
			v2 = parseFloat(rawValue2.toString().replace(/,|%/g, ""));
		}

		const total = v1 + v2;
		const percentage1 = total > 0 ? (v1 / total) * 100 : 50;
		const percentage2 = total > 0 ? (v2 / total) * 100 : 50;

		const isV1Better = stat.higherIsBetter ? v1 > v2 : v1 < v2;
		const isV2Better = stat.higherIsBetter ? v2 > v1 : v2 < v1;

		return (
			<div className="flex flex-col gap-2 py-3 border-b border-gray-700/50 last:border-b-0">
				<div className="grid grid-cols-3 items-center text-center">
					<span
						className={`font-bold text-lg ${
							isV1Better ? "text-green-400" : "text-white"
						}`}
					>
						{rawValue1}
					</span>
					<span className="text-sm text-gray-400 font-medium uppercase tracking-wider">
						{stat.label}
					</span>
					<span
						className={`font-bold text-lg ${
							isV2Better ? "text-green-400" : "text-white"
						}`}
					>
						{rawValue2}
					</span>
				</div>
				<div className="flex items-center gap-1 w-full h-2 rounded-full overflow-hidden bg-gray-700">
					<motion.div
						className="h-full bg-blue-500"
						initial={{ width: "50%" }}
						animate={{ width: `${percentage1}%` }}
						transition={{ duration: 0.5, ease: "circOut" }}
					/>
					<motion.div
						className="h-full bg-red-500"
						initial={{ width: "50%" }}
						animate={{ width: `${percentage2}%` }}
						transition={{ duration: 0.5, ease: "circOut" }}
					/>
				</div>
			</div>
		);
	};

	return (
		<motion.div
			initial={{ opacity: 0, height: 0 }}
			animate={{ opacity: 1, height: "auto" }}
			className="mt-6 p-6 bg-gray-800/20 rounded-lg border border-gray-700 backdrop-blur-sm"
		>
			<div className="flex items-center justify-center gap-3 mb-4">
				<BarChart2 className="text-cyan-400" size={24} />
				<h4 className="text-cyan-300 font-bold text-xl text-center uppercase tracking-widest">
					Statistical Showdown
				</h4>
			</div>

			<div className="grid grid-cols-3 items-center text-center mb-4 px-4">
				<div className="font-bold text-lg text-blue-400">{match1.champion}</div>
				<div className="text-sm text-gray-500">vs</div>
				<div className="font-bold text-lg text-red-400">{match2.champion}</div>
			</div>

			<div>
				{gameStats.map((stat) => (
					<StatRow key={stat.key} stat={stat} />
				))}
			</div>
		</motion.div>
	);
};

export default function History() {
	// Pagination state
	const [currentPage, setCurrentPage] = useState(1);
	const [itemsPerPage] = useState(12);

	// Filter state
	const [searchTerm, setSearchTerm] = useState("");
	const [resultFilter, setResultFilter] = useState("all");
	const [dateFilter, setDateFilter] = useState({
		from: "",
		to: "",
	});
	const [showFilters, setShowFilters] = useState(false);
	const [expandedMatch, setExpandedMatch] = useState<number | null>(null);

	// Comparison state
	const [comparisonSlots, setComparisonSlots] = useState<[any | null, any | null]>([null, null]);
	const [showingComparison, setShowingComparison] = useState(false);
	const [isDragging, setIsDragging] = useState(false);
	const [draggedMatch, setDraggedMatch] = useState<any | null>(null);
	const [hoveredSlot, setHoveredSlot] = useState<number | null>(null);

	// Horizontal scrolling state for recent matches
	const scrollContainerRef = useRef<HTMLDivElement>(null);
	const virtualScrollX = useMotionValue(0);
	const smoothScrollX = useSpring(virtualScrollX, {
		stiffness: 100,
		damping: 30,
		mass: 1,
	});

	// Dynamic card width calculation
	const [cardWidth, setCardWidth] = useState(1000);

	// Match card view modes: 'minimized' | 'normal' | 'maximized'
	const [matchViewModes, setMatchViewModes] = useState<
		Record<string, "minimized" | "normal" | "maximized">
	>({});

	useEffect(() => {
		const updateCardWidth = () => {
			if (scrollContainerRef.current) {
				const containerWidth = scrollContainerRef.current.offsetWidth;
				setCardWidth(Math.max(800, containerWidth - 48)); // Full width minus padding
			}
		};

		updateCardWidth();
		window.addEventListener("resize", updateCardWidth);
		return () => window.removeEventListener("resize", updateCardWidth);
	}, []);

	// Helper functions for match view modes
	const getMatchViewMode = (matchId: string): "minimized" | "normal" | "maximized" => {
		return matchViewModes[matchId] || "minimized";
	};

	const toggleMatchViewMode = (matchId: string) => {
		const currentMode = getMatchViewMode(matchId);
		const nextMode =
			currentMode === "minimized"
				? "normal"
				: currentMode === "normal"
					? "maximized"
					: "minimized";
		setMatchViewModes((prev) => ({ ...prev, [matchId]: nextMode }));
	};

	const setMatchViewMode = (matchId: string, mode: "minimized" | "normal" | "maximized") => {
		setMatchViewModes((prev) => ({ ...prev, [matchId]: mode }));
	};

	// League of Legends only match history data
	const matchHistory = [
		{
			id: 1,
			game: "League of Legends",
			mode: "Ranked Solo/Duo",
			result: "Victory",
			duration: "28:34",
			date: "2025-05-10T14:30:00Z",
			champion: "Jinx",
			kda: "12/3/8",
			rank: "Diamond I",
			lpChange: "+18",
			cs: "234",
			damage: "32,450",
			gold: "16,234",
			vision: "42",
			items: [
				"Kraken Slayer",
				"Phantom Dancer",
				"Infinity Edge",
				"Guardian Angel",
				"Lord Dominik's Regards",
				"Berserker's Greaves",
			],
			blueTeam: {
				name: "Blue Team",
				players: [
					{ champion: "Garen", player: "TopLaner1", kda: "3/4/7" },
					{ champion: "Graves", player: "JungleKing", kda: "8/2/9" },
					{ champion: "Yasuo", player: "MidLaner99", kda: "7/5/6" },
					{ champion: "Jinx", player: "You", kda: "12/3/8" },
					{ champion: "Thresh", player: "Support1", kda: "2/4/18" },
				],
				stats: {
					kills: 32,
					deaths: 18,
					assists: 48,
					dragons: 3,
					barons: 1,
					towers: 8,
				},
			},
			redTeam: {
				name: "Red Team",
				players: [
					{ champion: "Darius", player: "TopPlayer2", kda: "4/6/3" },
					{ champion: "Hecarim", player: "JunglePro", kda: "2/7/5" },
					{ champion: "Zed", player: "MidPlayer", kda: "6/8/4" },
					{ champion: "Kai'Sa", player: "ADCMain", kda: "4/7/6" },
					{ champion: "Leona", player: "SupportGod", kda: "2/4/11" },
				],
				stats: {
					kills: 18,
					deaths: 32,
					assists: 29,
					dragons: 1,
					barons: 0,
					towers: 3,
				},
			},
			gameStats: {
				totalKills: 50,
				gameDuration: "28:34",
				firstBlood: "Blue",
				firstTower: "Blue",
				firstDragon: "Blue",
			},
		},
		{
			id: 2,
			game: "League of Legends",
			mode: "Ranked Solo/Duo",
			result: "Victory",
			duration: "31:45",
			date: "2025-05-09T16:45:00Z",
			champion: "Azir",
			kda: "8/2/12",
			rank: "Diamond I",
			lpChange: "+19",
			cs: "287",
			damage: "28,932",
			gold: "15,432",
			vision: "38",
			items: [
				"Liandry's Anguish",
				"Nashor's Tooth",
				"Zhonya's Hourglass",
				"Rabadon's Deathcap",
				"Void Staff",
				"Sorcerer's Shoes",
			],
			blueTeam: {
				name: "Blue Team",
				players: [
					{ champion: "Ornn", player: "TopMain", kda: "2/3/14" },
					{ champion: "Viego", player: "JungleMain", kda: "6/4/11" },
					{ champion: "Azir", player: "You", kda: "8/2/12" },
					{ champion: "Aphelios", player: "ADCPro", kda: "9/1/8" },
					{
						champion: "Nautilus",
						player: "SupportMain",
						kda: "1/2/19",
					},
				],
				stats: {
					kills: 26,
					deaths: 12,
					assists: 64,
					dragons: 4,
					barons: 2,
					towers: 9,
				},
			},
			redTeam: {
				name: "Red Team",
				players: [
					{ champion: "Fiora", player: "TopPlayer", kda: "3/5/2" },
					{ champion: "Kindred", player: "JungleGod", kda: "4/6/3" },
					{ champion: "Syndra", player: "MidMain", kda: "2/7/4" },
					{ champion: "Ezreal", player: "EzMain", kda: "2/4/6" },
					{ champion: "Lulu", player: "SupMain", kda: "1/4/7" },
				],
				stats: {
					kills: 12,
					deaths: 26,
					assists: 22,
					dragons: 0,
					barons: 0,
					towers: 2,
				},
			},
			gameStats: {
				totalKills: 38,
				gameDuration: "31:45",
				firstBlood: "Red",
				firstTower: "Blue",
				firstDragon: "Blue",
			},
		},
		{
			id: 3,
			game: "League of Legends",
			mode: "Ranked Solo/Duo",
			result: "Defeat",
			duration: "42:18",
			date: "2025-05-08T11:20:00Z",
			champion: "Yasuo",
			kda: "6/8/4",
			rank: "Diamond I",
			lpChange: "-21",
			cs: "198",
			damage: "24,234",
			gold: "13,150",
			vision: "22",
			items: [
				"Immortal Shieldbow",
				"Navori Quickblades",
				"Infinity Edge",
				"Death's Dance",
				"Bloodthirster",
				"Berserker's Greaves",
			],
			blueTeam: {
				name: "Blue Team",
				players: [
					{ champion: "Malphite", player: "TopLaner", kda: "2/7/8" },
					{ champion: "Udyr", player: "JungleKing", kda: "3/6/7" },
					{ champion: "Yasuo", player: "You", kda: "6/8/4" },
					{ champion: "Sivir", player: "ADCMain", kda: "4/5/9" },
					{ champion: "Soraka", player: "HealBot", kda: "1/6/14" },
				],
				stats: {
					kills: 16,
					deaths: 32,
					assists: 42,
					dragons: 2,
					barons: 0,
					towers: 4,
				},
			},
			redTeam: {
				name: "Red Team",
				players: [
					{ champion: "Camille", player: "TopMain", kda: "8/3/12" },
					{ champion: "Graves", player: "JunglePro", kda: "7/2/15" },
					{ champion: "Viktor", player: "MidGod", kda: "9/4/11" },
					{ champion: "Jhin", player: "JhinMain", kda: "6/3/14" },
					{ champion: "Thresh", player: "HookGod", kda: "2/4/20" },
				],
				stats: {
					kills: 32,
					deaths: 16,
					assists: 72,
					dragons: 3,
					barons: 2,
					towers: 11,
				},
			},
			gameStats: {
				totalKills: 48,
				gameDuration: "42:18",
				firstBlood: "Red",
				firstTower: "Red",
				firstDragon: "Red",
			},
		},
		{
			id: 4,
			game: "League of Legends",
			mode: "Ranked Solo/Duo",
			result: "Victory",
			duration: "35:12",
			date: "2025-05-07T09:15:00Z",
			champion: "Thresh",
			kda: "2/4/18",
			rank: "Diamond I",
			lpChange: "+17",
			cs: "89",
			damage: "8,120",
			gold: "11,456",
			vision: "58",
			items: [
				"Locket of the Iron Solari",
				"Zeke's Convergence",
				"Knight's Vow",
				"Redemption",
				"Mobility Boots",
				"Control Ward",
			],
			blueTeam: {
				name: "Blue Team",
				players: [
					{ champion: "Sett", player: "TopBoss", kda: "7/3/11" },
					{ champion: "Hecarim", player: "FastHorse", kda: "9/2/13" },
					{ champion: "Ahri", player: "FoxMain", kda: "8/4/12" },
					{ champion: "Caitlyn", player: "Sniper", kda: "11/1/9" },
					{ champion: "Thresh", player: "You", kda: "2/4/18" },
				],
				stats: {
					kills: 37,
					deaths: 14,
					assists: 63,
					dragons: 3,
					barons: 2,
					towers: 10,
				},
			},
			redTeam: {
				name: "Red Team",
				players: [
					{ champion: "Aatrox", player: "DarkLord", kda: "4/8/6" },
					{ champion: "Kha'Zix", player: "BugHunter", kda: "3/7/5" },
					{ champion: "Yone", player: "YoneMain", kda: "5/9/4" },
					{ champion: "Xayah", player: "FeatherStorm", kda: "2/6/8" },
					{ champion: "Rakan", player: "CharmGod", kda: "0/7/10" },
				],
				stats: {
					kills: 14,
					deaths: 37,
					assists: 33,
					dragons: 1,
					barons: 0,
					towers: 3,
				},
			},
			gameStats: {
				totalKills: 51,
				gameDuration: "35:12",
				firstBlood: "Blue",
				firstTower: "Blue",
				firstDragon: "Blue",
			},
		},
		{
			id: 5,
			game: "League of Legends",
			mode: "Ranked Solo/Duo",
			result: "Victory",
			duration: "29:45",
			date: "2025-05-06T19:30:00Z",
			champion: "Graves",
			kda: "11/5/6",
			rank: "Diamond I",
			lpChange: "+20",
			cs: "156",
			damage: "19,567",
			gold: "14,234",
			vision: "28",
			items: [
				"Eclipse",
				"Collector",
				"Lord Dominik's Regards",
				"Death's Dance",
				"Guardian Angel",
				"Plated Steelcaps",
			],
			blueTeam: {
				name: "Blue Team",
				players: [
					{
						champion: "Gangplank",
						player: "PlayerGP",
						kda: "6/4/9",
					},
					{ champion: "Graves", player: "You", kda: "11/5/6" },
					{
						champion: "Kassadin",
						player: "VoidWalker",
						kda: "7/3/8",
					},
					{
						champion: "Lucian",
						player: "LightBringer",
						kda: "8/2/11",
					},
					{ champion: "Pyke", player: "AssassinSup", kda: "3/6/17" },
				],
				stats: {
					kills: 35,
					deaths: 20,
					assists: 51,
					dragons: 2,
					barons: 1,
					towers: 7,
				},
			},
			redTeam: {
				name: "Red Team",
				players: [
					{
						champion: "Mordekaiser",
						player: "IronRevenant",
						kda: "6/7/8",
					},
					{ champion: "Nidalee", player: "CougarHunt", kda: "4/8/6" },
					{ champion: "Talon", player: "BladeDancer", kda: "5/9/4" },
					{ champion: "Twitch", player: "RatKing", kda: "3/6/7" },
					{
						champion: "Bard",
						player: "ChimeCollector",
						kda: "2/5/12",
					},
				],
				stats: {
					kills: 20,
					deaths: 35,
					assists: 37,
					dragons: 1,
					barons: 0,
					towers: 4,
				},
			},
			gameStats: {
				totalKills: 55,
				gameDuration: "29:45",
				firstBlood: "Blue",
				firstTower: "Blue",
				firstDragon: "Red",
			},
		},
		{
			id: 6,
			game: "League of Legends",
			mode: "Ranked Solo/Duo",
			result: "Defeat",
			duration: "44:56",
			date: "2025-05-05T14:45:00Z",
			champion: "Caitlyn",
			kda: "9/7/8",
			rank: "Diamond I",
			lpChange: "-18",
			cs: "267",
			damage: "28,934",
			gold: "16,890",
			vision: "31",
			items: [
				"Galeforce",
				"Rapid Firecannon",
				"Infinity Edge",
				"Lord Dominik's Regards",
				"Guardian Angel",
				"Berserker's Greaves",
			],
			blueTeam: {
				name: "Blue Team",
				players: [
					{ champion: "Jayce", player: "HammerTime", kda: "4/8/7" },
					{ champion: "Elise", player: "SpiderQueen", kda: "3/9/9" },
					{
						champion: "Orianna",
						player: "ClockworkMain",
						kda: "6/6/11",
					},
					{ champion: "Caitlyn", player: "You", kda: "9/7/8" },
					{
						champion: "Alistar",
						player: "CowSupport",
						kda: "1/8/17",
					},
				],
				stats: {
					kills: 23,
					deaths: 38,
					assists: 52,
					dragons: 2,
					barons: 1,
					towers: 5,
				},
			},
			redTeam: {
				name: "Red Team",
				players: [
					{
						champion: "Irelia",
						player: "BladeDancer",
						kda: "12/5/14",
					},
					{ champion: "Lillia", player: "DreamEater", kda: "8/4/18" },
					{
						champion: "Katarina",
						player: "ResetQueen",
						kda: "11/6/12",
					},
					{
						champion: "Samira",
						player: "StylePoints",
						kda: "5/4/19",
					},
					{ champion: "Leona", player: "SunGoddess", kda: "2/4/24" },
				],
				stats: {
					kills: 38,
					deaths: 23,
					assists: 87,
					dragons: 4,
					barons: 2,
					towers: 11,
				},
			},
			gameStats: {
				totalKills: 61,
				gameDuration: "44:56",
				firstBlood: "Red",
				firstTower: "Red",
				firstDragon: "Blue",
			},
		},
		{
			id: 7,
			game: "League of Legends",
			mode: "Ranked Solo/Duo",
			result: "Victory",
			duration: "31:28",
			date: "2025-05-04T16:20:00Z",
			champion: "Riven",
			kda: "14/4/6",
			rank: "Diamond I",
			lpChange: "+19",
			cs: "189",
			damage: "31,892",
			gold: "15,543",
			vision: "25",
			items: [
				"Goredrinker",
				"Black Cleaver",
				"Death's Dance",
				"Sterak's Gage",
				"Guardian Angel",
				"Plated Steelcaps",
			],
			blueTeam: {
				name: "Blue Team",
				players: [
					{ champion: "Riven", player: "You", kda: "14/4/6" },
					{ champion: "Ekko", player: "TimeLord", kda: "8/3/12" },
					{ champion: "LeBlanc", player: "Deceiver", kda: "9/2/11" },
					{ champion: "Vayne", player: "NightHunter", kda: "10/1/7" },
					{ champion: "Lulu", player: "PolySupport", kda: "0/3/23" },
				],
				stats: {
					kills: 41,
					deaths: 13,
					assists: 59,
					dragons: 3,
					barons: 2,
					towers: 10,
				},
			},
			redTeam: {
				name: "Red Team",
				players: [
					{ champion: "Renekton", player: "CrocMain", kda: "3/9/4" },
					{ champion: "Sejuani", player: "IceQueen", kda: "2/8/7" },
					{ champion: "Xerath", player: "LongRange", kda: "4/8/5" },
					{
						champion: "Miss Fortune",
						player: "PirateADC",
						kda: "3/8/6",
					},
					{
						champion: "Morgana",
						player: "DarkBinding",
						kda: "1/8/8",
					},
				],
				stats: {
					kills: 13,
					deaths: 41,
					assists: 30,
					dragons: 1,
					barons: 0,
					towers: 2,
				},
			},
			gameStats: {
				totalKills: 54,
				gameDuration: "31:28",
				firstBlood: "Blue",
				firstTower: "Blue",
				firstDragon: "Blue",
			},
		},
		{
			id: 8,
			game: "League of Legends",
			mode: "Ranked Solo/Duo",
			result: "Defeat",
			duration: "38:18",
			date: "2025-05-03T12:10:00Z",
			champion: "Zed",
			kda: "12/9/5",
			rank: "Diamond I",
			lpChange: "-20",
			cs: "198",
			damage: "26,672",
			gold: "14,230",
			vision: "18",
			items: [
				"Prowler's Claw",
				"Youmuu's Ghostblade",
				"Edge of Night",
				"Serylda's Grudge",
				"Guardian Angel",
				"Ionian Boots",
			],
			blueTeam: {
				name: "Blue Team",
				players: [
					{ champion: "Maokai", player: "TreeHugger", kda: "2/8/12" },
					{ champion: "Warwick", player: "WolfPack", kda: "4/7/9" },
					{ champion: "Zed", player: "You", kda: "12/9/5" },
					{ champion: "Ashe", player: "FrostArcher", kda: "6/6/11" },
					{ champion: "Braum", player: "ShieldWall", kda: "1/8/16" },
				],
				stats: {
					kills: 25,
					deaths: 38,
					assists: 53,
					dragons: 1,
					barons: 1,
					towers: 4,
				},
			},
			redTeam: {
				name: "Red Team",
				players: [
					{ champion: "Gwen", player: "SeamStress", kda: "9/5/17" },
					{ champion: "Diana", player: "MoonAspect", kda: "8/6/19" },
					{ champion: "Akali", player: "NinjaMain", kda: "11/7/12" },
					{ champion: "Jinx", player: "ChaosADC", kda: "7/3/21" },
					{ champion: "Senna", player: "SoulReaper", kda: "3/4/24" },
				],
				stats: {
					kills: 38,
					deaths: 25,
					assists: 93,
					dragons: 3,
					barons: 1,
					towers: 9,
				},
			},
			gameStats: {
				totalKills: 63,
				gameDuration: "38:18",
				firstBlood: "Red",
				firstTower: "Red",
				firstDragon: "Red",
			},
		},
	];

	// Get recent matches for horizontal scroll (first 8 for more content)
	const recentMatches = matchHistory.slice(0, 8);

	// Get latest match (most recent by date)
	const latestMatch = matchHistory[0];

	// Calculate scroll bounds based on content - single match view
	const maxScroll = Math.max(0, (recentMatches.length - 1) * cardWidth);

	// Format date for display
	const formatDate = (dateString: string) => {
		const options: Intl.DateTimeFormatOptions = {
			year: "numeric",
			month: "short",
			day: "numeric",
			hour: "2-digit",
			minute: "2-digit",
		};
		return new Date(dateString).toLocaleDateString(undefined, options);
	};

	// Filter match history based on search and result (excluding first match)
	const filteredMatches = matchHistory.slice(1).filter((match) => {
		// Search term filter
		const matchesSearch =
			match.champion?.toLowerCase().includes(searchTerm.toLowerCase()) ||
			match.mode.toLowerCase().includes(searchTerm.toLowerCase());

		// Result filter
		const matchesResult = resultFilter === "all" || match.result === resultFilter;

		// Date filter
		let matchesDate = true;
		if (dateFilter.from) {
			matchesDate = matchesDate && new Date(match.date) >= new Date(dateFilter.from);
		}
		if (dateFilter.to) {
			matchesDate = matchesDate && new Date(match.date) <= new Date(dateFilter.to);
		}

		return matchesSearch && matchesResult && matchesDate;
	});

	// Get current items for pagination
	const indexOfLastItem = currentPage * itemsPerPage;
	const indexOfFirstItem = indexOfLastItem - itemsPerPage;
	const currentMatches = filteredMatches.slice(indexOfFirstItem, indexOfLastItem);
	const totalPages = Math.ceil(filteredMatches.length / itemsPerPage);

	// Change page
	const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

	// Reset to first page when filters change
	useEffect(() => {
		setCurrentPage(1);
	}, [searchTerm, resultFilter, dateFilter]);

	const toggleMatchDetails = (matchId: number) => {
		setExpandedMatch(expandedMatch === matchId ? null : matchId);
	};

	// Comparison functions
	const addToComparison = (match: any, slotIndex: 0 | 1) => {
		const newSlots = [...comparisonSlots] as [any | null, any | null];
		newSlots[slotIndex] = match;
		setComparisonSlots(newSlots);
	};

	const removeFromComparison = (slotIndex: 0 | 1) => {
		const newSlots = [...comparisonSlots] as [any | null, any | null];
		newSlots[slotIndex] = null;
		setComparisonSlots(newSlots);
	};

	const clearComparison = () => {
		setComparisonSlots([null, null]);
		setShowingComparison(false);
	};

	// Drag and drop functions
	const handleDragStart = (match: any) => {
		setIsDragging(true);
		setDraggedMatch(match);
	};

	const handleDragEnd = () => {
		setIsDragging(false);
		setDraggedMatch(null);
		setHoveredSlot(null);
	};

	const handleDragOver = (e: React.DragEvent, slotIndex: number) => {
		e.preventDefault();
		setHoveredSlot(slotIndex);
	};

	const handleDragLeave = () => {
		setHoveredSlot(null);
	};

	const handleDrop = (e: React.DragEvent, slotIndex: 0 | 1) => {
		e.preventDefault();
		if (draggedMatch) {
			addToComparison(draggedMatch, slotIndex);
		}
		handleDragEnd();
	};

	// Horizontal scroll functions with smooth physics - one match at a time
	const handleHorizontalWheel = useCallback(
		(e: WheelEvent) => {
			e.preventDefault();
			const currentX = virtualScrollX.get();

			// Determine scroll direction and snap to nearest card
			const scrollDirection = e.deltaX + e.deltaY > 0 ? 1 : -1;
			const currentIndex = Math.round(-currentX / cardWidth);
			const newIndex = Math.max(
				0,
				Math.min(recentMatches.length - 1, currentIndex + scrollDirection),
			);
			const newX = -newIndex * cardWidth;

			virtualScrollX.set(newX);
		},
		[virtualScrollX, cardWidth, recentMatches.length],
	);

	const handleTouchStart = useRef({ x: 0, scrollX: 0 });

	const handleTouchMove = useCallback(
		(e: TouchEvent) => {
			e.preventDefault();
			const touchX = e.touches[0].clientX;
			const deltaX = handleTouchStart.current.x - touchX;

			// Only scroll if we've moved enough (threshold for snapping)
			if (Math.abs(deltaX) > 50) {
				const currentX = handleTouchStart.current.scrollX;
				const scrollDirection = deltaX > 0 ? 1 : -1;
				const currentIndex = Math.round(-currentX / cardWidth);
				const newIndex = Math.max(
					0,
					Math.min(recentMatches.length - 1, currentIndex + scrollDirection),
				);
				const newX = -newIndex * cardWidth;

				virtualScrollX.set(newX);
			}
		},
		[virtualScrollX, cardWidth, recentMatches.length],
	);

	// Setup horizontal scroll event listeners
	useEffect(() => {
		const container = scrollContainerRef.current;
		if (container) {
			container.addEventListener("wheel", handleHorizontalWheel, {
				passive: false,
			});

			container.addEventListener(
				"touchstart",
				(e) => {
					handleTouchStart.current = {
						x: e.touches[0].clientX,
						scrollX: virtualScrollX.get(),
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
				container.removeEventListener("wheel", handleHorizontalWheel);
				container.removeEventListener("touchmove", handleTouchMove);
			}
		};
	}, [handleHorizontalWheel, handleTouchMove, virtualScrollX]);

	// Scroll functions for buttons - one match at a time
	const scrollLeft = () => {
		const currentX = virtualScrollX.get();
		const currentIndex = Math.round(-currentX / cardWidth);
		const newIndex = Math.max(0, currentIndex - 1);
		const newX = -newIndex * cardWidth;
		virtualScrollX.set(newX);
	};

	const scrollRight = () => {
		const currentX = virtualScrollX.get();
		const currentIndex = Math.round(-currentX / cardWidth);
		const newIndex = Math.min(recentMatches.length - 1, currentIndex + 1);
		const newX = -newIndex * cardWidth;
		virtualScrollX.set(newX);
	};

	// Render match card with minimize/maximize functionality
	const renderCompactMatchCard = (match: any, index: number, showCompareButton = true) => {
		const viewMode = getMatchViewMode(match.id.toString());

		return (
			<motion.div
				key={match.id}
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.3, delay: index * 0.05 }}
				draggable={true}
				onDragStart={() => handleDragStart(match)}
				onDragEnd={handleDragEnd}
				className="bg-gray-800/40 backdrop-blur-sm rounded-lg border border-gray-700/50 overflow-hidden hover:bg-gray-800/60 transition-all cursor-grab active:cursor-grabbing hover:scale-[1.01] hover:border-cyan-500/30 group"
			>
				<div className="p-4 relative">
					{/* Drag indicator */}
					<div className="absolute top-2 right-2 opacity-0 group-hover:opacity-50 transition-opacity">
						<Move size={16} className="text-gray-400" />
					</div>

					{/* Header with match result, view controls, and compare button */}
					<div className="flex items-center justify-between mb-4">
						<div className="flex items-center gap-3">
							<div
								className={`w-4 h-4 rounded-full flex items-center justify-center ${
									match.result === "Victory" ? "bg-green-500" : "bg-red-500"
								}`}
							>
								<Trophy size={8} className="text-white" />
							</div>
							<div>
								<h3
									className={`text-sm font-bold ${
										match.result === "Victory"
											? "text-green-400"
											: "text-red-400"
									}`}
								>
									{match.result}
								</h3>
								<p className="text-xs text-gray-400">{match.mode}</p>
							</div>
						</div>
						<div className="flex items-center gap-2">
							<div className="text-right">
								<div
									className={`text-xs font-bold ${
										match.lpChange?.startsWith("+")
											? "text-green-400"
											: "text-red-400"
									}`}
								>
									{match.lpChange}
								</div>
								<div className="text-xs text-gray-500">LP</div>
							</div>

							{/* View Mode Toggle Buttons */}
							<div className="flex items-center gap-1">
								<button
									onClick={(e) => {
										e.stopPropagation();
										setMatchViewMode(match.id.toString(), "minimized");
									}}
									className={`p-1 rounded transition-colors ${
										viewMode === "minimized"
											? "bg-cyan-900/60 text-cyan-300"
											: "bg-gray-700/40 text-gray-400 hover:text-cyan-300"
									}`}
									title="Minimize view"
								>
									<Minimize2 size={12} />
								</button>
								<button
									onClick={(e) => {
										e.stopPropagation();
										setMatchViewMode(match.id.toString(), "normal");
									}}
									className={`p-1 rounded transition-colors ${
										viewMode === "normal"
											? "bg-cyan-900/60 text-cyan-300"
											: "bg-gray-700/40 text-gray-400 hover:text-cyan-300"
									}`}
									title="Normal view"
								>
									<div className="w-3 h-3 border border-current rounded-sm"></div>
								</button>
								<button
									onClick={(e) => {
										e.stopPropagation();
										setMatchViewMode(match.id.toString(), "maximized");
									}}
									className={`p-1 rounded transition-colors ${
										viewMode === "maximized"
											? "bg-cyan-900/60 text-cyan-300"
											: "bg-gray-700/40 text-gray-400 hover:text-cyan-300"
									}`}
									title="Maximize view"
								>
									<Maximize2 size={12} />
								</button>
							</div>

							{showCompareButton && (
								<button
									onClick={(e) => {
										e.stopPropagation();
										if (!comparisonSlots[0]) {
											addToComparison(match, 0);
										} else if (!comparisonSlots[1]) {
											addToComparison(match, 1);
										}
									}}
									disabled={
										comparisonSlots.includes(match) ||
										(comparisonSlots[0] && comparisonSlots[1])
									}
									className="text-xs px-2 py-1 bg-cyan-900/40 text-cyan-300 rounded hover:bg-cyan-800/40 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
								>
									Compare
								</button>
							)}
						</div>
					</div>

					{/* Main content layout - varies by view mode */}
					<motion.div
						layout
						className="space-y-3"
						transition={{ duration: 0.3, ease: "easeInOut" }}
					>
						{/* Minimized View - Performance focused */}
						{viewMode === "minimized" && (
							<div className="bg-gray-900/40 rounded-lg p-3 border border-gray-700/30">
								<h4 className="text-cyan-300 font-medium mb-2 text-center text-xs">
									Your Performance
								</h4>
								<div className="text-center">
									<div className="text-lg font-bold text-white mb-1">
										{match.champion}
									</div>
									<div className="text-lg text-yellow-400 mb-1">{match.kda}</div>
									<div className="text-xs text-gray-500 mb-2">K/D/A</div>

									{/* Key Stats with Progress Bars */}
									<div className="space-y-2 text-xs">
										<div className="flex justify-between items-center">
											<span className="text-gray-400">CS</span>
											<span className="text-white font-medium">
												{match.cs}
											</span>
										</div>
										<div className="w-full bg-gray-700 rounded-full h-1">
											<div
												className="bg-blue-400 h-1 rounded-full"
												style={{
													width: `${Math.min(
														100,
														parseInt(match.cs) / 3,
													)}%`,
												}}
											></div>
										</div>

										<div className="flex justify-between items-center">
											<span className="text-gray-400">Vision</span>
											<span className="text-blue-400 font-medium">
												{match.vision}
											</span>
										</div>
										<div className="w-full bg-gray-700 rounded-full h-1">
											<div
												className="bg-blue-400 h-1 rounded-full"
												style={{
													width: `${Math.min(
														100,
														parseInt(match.vision) * 2,
													)}%`,
												}}
											></div>
										</div>

										<div className="flex justify-between items-center">
											<span className="text-gray-400">Damage</span>
											<span className="text-red-400 font-medium">
												{match.damage}
											</span>
										</div>
										<div className="w-full bg-gray-700 rounded-full h-1">
											<div
												className="bg-red-400 h-1 rounded-full"
												style={{
													width: `${Math.min(
														100,
														parseInt(match.damage.replace(/,/g, "")) /
															500,
													)}%`,
												}}
											></div>
										</div>
									</div>

									{/* Game date at bottom */}
									<div className="pt-2 mt-2 border-t border-gray-700/50">
										<div className="text-xs text-gray-500 text-center">
											{formatDate(match.date)}
										</div>
									</div>
								</div>
							</div>
						)}

						{/* Normal View - Standard information */}
						{viewMode === "normal" && (
							<>
								{/* Performance Overview */}
								<div className="bg-gray-900/40 rounded-lg p-3 border border-gray-700/30">
									<h4 className="text-cyan-300 font-medium mb-2 text-center text-xs">
										Your Performance
									</h4>
									<div className="text-center">
										<div className="text-lg font-bold text-white mb-1">
											{match.champion}
										</div>
										<div className="text-lg text-yellow-400 mb-1">
											{match.kda}
										</div>
										<div className="text-xs text-gray-500 mb-2">K/D/A</div>

										{/* Key Stats with Progress Bars */}
										<div className="space-y-2 text-xs">
											<div className="flex justify-between items-center">
												<span className="text-gray-400">CS</span>
												<span className="text-white font-medium">
													{match.cs}
												</span>
											</div>
											<div className="w-full bg-gray-700 rounded-full h-1">
												<div
													className="bg-blue-400 h-1 rounded-full"
													style={{
														width: `${Math.min(
															100,
															parseInt(match.cs) / 3,
														)}%`,
													}}
												></div>
											</div>

											<div className="flex justify-between items-center">
												<span className="text-gray-400">Vision</span>
												<span className="text-blue-400 font-medium">
													{match.vision}
												</span>
											</div>
											<div className="w-full bg-gray-700 rounded-full h-1">
												<div
													className="bg-blue-400 h-1 rounded-full"
													style={{
														width: `${Math.min(
															100,
															parseInt(match.vision) * 2,
														)}%`,
													}}
												></div>
											</div>

											<div className="flex justify-between items-center">
												<span className="text-gray-400">Damage</span>
												<span className="text-red-400 font-medium">
													{match.damage}
												</span>
											</div>
											<div className="w-full bg-gray-700 rounded-full h-1">
												<div
													className="bg-red-400 h-1 rounded-full"
													style={{
														width: `${Math.min(
															100,
															parseInt(
																match.damage.replace(/,/g, ""),
															) / 500,
														)}%`,
													}}
												></div>
											</div>
										</div>
									</div>
								</div>

								{/* Team Performance Comparison */}
								<div className="bg-gray-900/40 rounded-lg p-3 border border-gray-700/30">
									<h4 className="text-cyan-300 font-medium mb-2 text-center text-xs">
										Team Performance
									</h4>
									<div className="grid grid-cols-2 gap-2">
										<div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-2">
											<div className="text-blue-400 font-medium text-xs mb-1 text-center">
												Blue
											</div>
											<div className="text-center">
												<span className="text-blue-300 font-bold text-sm">
													{match.blueTeam.stats.kills}
												</span>
												<span className="text-gray-400 mx-1">/</span>
												<span className="text-red-300 font-bold text-sm">
													{match.blueTeam.stats.deaths}
												</span>
												<span className="text-gray-400 mx-1">/</span>
												<span className="text-green-300 font-bold text-sm">
													{match.blueTeam.stats.assists}
												</span>
											</div>
											<div className="flex justify-center gap-2 text-xs mt-1">
												<span className="text-orange-400">
													🐉
													{match.blueTeam.stats.dragons}
												</span>
												<span className="text-purple-400">
													👑
													{match.blueTeam.stats.barons}
												</span>
												<span className="text-gray-400">
													🏰
													{match.blueTeam.stats.towers}
												</span>
											</div>
										</div>

										<div className="bg-red-900/20 border border-red-500/30 rounded-lg p-2">
											<div className="text-red-400 font-medium text-xs mb-1 text-center">
												Red
											</div>
											<div className="text-center">
												<span className="text-blue-300 font-bold text-sm">
													{match.redTeam.stats.kills}
												</span>
												<span className="text-gray-400 mx-1">/</span>
												<span className="text-red-300 font-bold text-sm">
													{match.redTeam.stats.deaths}
												</span>
												<span className="text-gray-400 mx-1">/</span>
												<span className="text-green-300 font-bold text-sm">
													{match.redTeam.stats.assists}
												</span>
											</div>
											<div className="flex justify-center gap-2 text-xs mt-1">
												<span className="text-orange-400">
													🐉
													{match.redTeam.stats.dragons}
												</span>
												<span className="text-purple-400">
													👑
													{match.redTeam.stats.barons}
												</span>
												<span className="text-gray-400">
													🏰
													{match.redTeam.stats.towers}
												</span>
											</div>
										</div>
									</div>
								</div>

								{/* Game Information */}
								<div className="bg-gray-900/40 rounded-lg p-3 border border-gray-700/30">
									<h4 className="text-cyan-300 font-medium mb-2 text-center text-xs">
										Game Timeline
									</h4>
									<div className="space-y-1 text-xs">
										<div className="flex justify-between">
											<span className="text-gray-400">Duration:</span>
											<span className="text-white">{match.duration}</span>
										</div>
										<div className="flex justify-between">
											<span className="text-gray-400">Total Kills:</span>
											<span className="text-white">
												{match.gameStats?.totalKills || "N/A"}
											</span>
										</div>
										<div className="flex justify-between">
											<span className="text-gray-400">First Blood:</span>
											<span
												className={
													match.gameStats?.firstBlood === "Blue"
														? "text-blue-400"
														: "text-red-400"
												}
											>
												{match.gameStats?.firstBlood || "N/A"}
											</span>
										</div>
										<div className="pt-1 border-t border-gray-700">
											<div className="text-xs text-gray-500 text-center">
												{formatDate(match.date)}
											</div>
										</div>
									</div>
								</div>
							</>
						)}

						{/* Maximized View - All information including items and expanded stats */}
						{viewMode === "maximized" && (
							<>
								{/* Extended Performance Overview */}
								<div className="bg-gray-900/40 rounded-lg p-4 border border-gray-700/30">
									<h4 className="text-cyan-300 font-medium mb-3 text-center">
										Your Performance
									</h4>
									<div className="text-center">
										<div className="text-2xl font-bold text-white mb-2">
											{match.champion}
										</div>
										<div className="text-xl text-yellow-400 mb-1">
											{match.kda}
										</div>
										<div className="text-xs text-gray-500 mb-3">K/D/A</div>

										{/* Items Build */}
										<div className="mb-4">
											<div className="text-xs text-gray-400 mb-2">Items</div>
											<div className="grid grid-cols-3 gap-1">
												{match.items
													?.slice(0, 6)
													.map((item: string, idx: number) => (
														<div
															key={idx}
															className="w-8 h-8 bg-gray-800/50 border border-gray-600 rounded text-xs flex items-center justify-center text-gray-300"
															title={item}
														>
															{item.slice(0, 2)}
														</div>
													))}
											</div>
										</div>

										{/* Enhanced Stats with Progress Bars */}
										<div className="space-y-2 text-xs">
											<div className="flex justify-between items-center">
												<span className="text-gray-400">CS</span>
												<span className="text-white font-medium">
													{match.cs}
												</span>
											</div>
											<div className="w-full bg-gray-700 rounded-full h-1">
												<div
													className="bg-blue-400 h-1 rounded-full"
													style={{
														width: `${Math.min(
															100,
															parseInt(match.cs) / 3,
														)}%`,
													}}
												></div>
											</div>

											<div className="flex justify-between items-center">
												<span className="text-gray-400">Vision</span>
												<span className="text-blue-400 font-medium">
													{match.vision}
												</span>
											</div>
											<div className="w-full bg-gray-700 rounded-full h-1">
												<div
													className="bg-blue-400 h-1 rounded-full"
													style={{
														width: `${Math.min(
															100,
															parseInt(match.vision) * 2,
														)}%`,
													}}
												></div>
											</div>

											<div className="flex justify-between items-center">
												<span className="text-gray-400">Damage</span>
												<span className="text-red-400 font-medium">
													{match.damage}
												</span>
											</div>
											<div className="w-full bg-gray-700 rounded-full h-1">
												<div
													className="bg-red-400 h-1 rounded-full"
													style={{
														width: `${Math.min(
															100,
															parseInt(
																match.damage.replace(/,/g, ""),
															) / 500,
														)}%`,
													}}
												></div>
											</div>

											<div className="flex justify-between items-center">
												<span className="text-gray-400">Gold</span>
												<span className="text-yellow-400 font-medium">
													{match.gold}
												</span>
											</div>
											<div className="w-full bg-gray-700 rounded-full h-1">
												<div
													className="bg-yellow-400 h-1 rounded-full"
													style={{
														width: `${Math.min(
															100,
															parseInt(
																match.gold?.replace(/,/g, "") ||
																	"0",
															) / 200,
														)}%`,
													}}
												></div>
											</div>
										</div>
									</div>
								</div>

								{/* Enhanced Team Performance with Player Details */}
								<div className="bg-gray-900/40 rounded-lg p-4 border border-gray-700/30">
									<h4 className="text-cyan-300 font-medium mb-3 text-center">
										Team Analysis
									</h4>

									{/* Team stats overview */}
									<div className="grid grid-cols-2 gap-3 mb-4">
										<div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-3">
											<div className="text-blue-400 font-medium text-sm mb-2 text-center">
												{match.blueTeam.name}
											</div>
											<div className="text-center mb-2">
												<span className="text-blue-300 font-bold text-lg">
													{match.blueTeam.stats.kills}
												</span>
												<span className="text-gray-400 mx-1">/</span>
												<span className="text-red-300 font-bold text-lg">
													{match.blueTeam.stats.deaths}
												</span>
												<span className="text-gray-400 mx-1">/</span>
												<span className="text-green-300 font-bold text-lg">
													{match.blueTeam.stats.assists}
												</span>
											</div>
											<div className="flex justify-center gap-3 text-xs">
												<span className="text-orange-400">
													🐉 {match.blueTeam.stats.dragons}
												</span>
												<span className="text-purple-400">
													👑 {match.blueTeam.stats.barons}
												</span>
												<span className="text-gray-400">
													🏰 {match.blueTeam.stats.towers}
												</span>
											</div>
										</div>

										<div className="bg-red-900/20 border border-red-500/30 rounded-lg p-3">
											<div className="text-red-400 font-medium text-sm mb-2 text-center">
												{match.redTeam.name}
											</div>
											<div className="text-center mb-2">
												<span className="text-blue-300 font-bold text-lg">
													{match.redTeam.stats.kills}
												</span>
												<span className="text-gray-400 mx-1">/</span>
												<span className="text-red-300 font-bold text-lg">
													{match.redTeam.stats.deaths}
												</span>
												<span className="text-gray-400 mx-1">/</span>
												<span className="text-green-300 font-bold text-lg">
													{match.redTeam.stats.assists}
												</span>
											</div>
											<div className="flex justify-center gap-3 text-xs">
												<span className="text-orange-400">
													🐉 {match.redTeam.stats.dragons}
												</span>
												<span className="text-purple-400">
													👑 {match.redTeam.stats.barons}
												</span>
												<span className="text-gray-400">
													🏰 {match.redTeam.stats.towers}
												</span>
											</div>
										</div>
									</div>

									{/* Player matchups */}
									<div className="space-y-2">
										<div className="text-xs text-gray-400 font-medium text-center mb-3">
											Champion Matchups
										</div>
										{match.blueTeam.players?.map(
											(bluePlayer: any, i: number) => {
												const roles = ["TOP", "JGL", "MID", "ADC", "SUP"];
												const redPlayer = match.redTeam.players?.[i];

												return (
													<div
														key={i}
														className="bg-gray-800/30 rounded-lg p-2 border border-gray-700/30"
													>
														<div className="flex items-center justify-between text-xs">
															<div className="flex items-center gap-2">
																<span className="text-gray-400 w-8">
																	{roles[i]}
																</span>
																<span
																	className={`font-medium ${
																		bluePlayer.player === "You"
																			? "text-yellow-400"
																			: "text-blue-300"
																	}`}
																>
																	{bluePlayer.champion}
																</span>
																<span className="text-gray-500">
																	{bluePlayer.kda}
																</span>
															</div>
															<div className="text-gray-600">VS</div>
															<div className="flex items-center gap-2">
																<span className="text-gray-500">
																	{redPlayer?.kda}
																</span>
																<span className="text-red-300 font-medium">
																	{redPlayer?.champion}
																</span>
															</div>
														</div>
													</div>
												);
											},
										)}
									</div>
								</div>

								{/* Extended Game Information */}
								<div className="bg-gray-900/40 rounded-lg p-4 border border-gray-700/30">
									<h4 className="text-cyan-300 font-medium mb-3 text-center">
										Game Details
									</h4>
									<div className="grid grid-cols-2 gap-4 text-xs">
										<div className="space-y-2">
											<div className="flex justify-between">
												<span className="text-gray-400">Duration:</span>
												<span className="text-white">{match.duration}</span>
											</div>
											<div className="flex justify-between">
												<span className="text-gray-400">Total Kills:</span>
												<span className="text-white">
													{match.gameStats?.totalKills || "N/A"}
												</span>
											</div>
											<div className="flex justify-between">
												<span className="text-gray-400">First Blood:</span>
												<span
													className={
														match.gameStats?.firstBlood === "Blue"
															? "text-blue-400"
															: "text-red-400"
													}
												>
													{match.gameStats?.firstBlood || "N/A"}
												</span>
											</div>
										</div>
										<div className="space-y-2">
											<div className="flex justify-between">
												<span className="text-gray-400">Rank:</span>
												<span className="text-white">{match.rank}</span>
											</div>
											<div className="flex justify-between">
												<span className="text-gray-400">Queue:</span>
												<span className="text-white">{match.mode}</span>
											</div>
											<div className="flex justify-between">
												<span className="text-gray-400">Date:</span>
												<span className="text-white">
													{formatDate(match.date)}
												</span>
											</div>
										</div>
									</div>
								</div>
							</>
						)}
					</motion.div>
				</div>
			</motion.div>
		);
	};

	// Render horizontal scrollable match card (for recent matches)
	const renderHorizontalMatchCard = (match: any, index: number) => (
		<motion.div
			key={match.id}
			initial={{ opacity: 0, x: 20 }}
			animate={{ opacity: 1, x: 0 }}
			transition={{ duration: 0.3, delay: index * 0.1 }}
			draggable={true}
			onDragStart={() => handleDragStart(match)}
			onDragEnd={handleDragEnd}
			className="flex-shrink-0 bg-gray-800/40 backdrop-blur-sm rounded-lg border border-gray-700/50 overflow-hidden hover:bg-gray-800/60 transition-all cursor-grab active:cursor-grabbing hover:scale-[1.01] hover:border-cyan-500/30 group"
			style={{ width: `${cardWidth}px` }}
		>
			<div className="p-6 relative">
				{/* Drag indicator */}
				<div className="absolute top-3 right-3 opacity-0 group-hover:opacity-50 transition-opacity">
					<Move size={16} className="text-gray-400" />
				</div>

				{/* Header with match result and compare button */}
				<div className="flex items-center justify-between mb-6">
					<div className="flex items-center gap-4">
						<div
							className={`w-6 h-6 rounded-full flex items-center justify-center ${
								match.result === "Victory" ? "bg-green-500" : "bg-red-500"
							}`}
						>
							<Trophy size={14} className="text-white" />
						</div>
						<div>
							<h3
								className={`text-xl font-bold ${
									match.result === "Victory" ? "text-green-400" : "text-red-400"
								}`}
							>
								{match.result}
							</h3>
							<p className="text-sm text-gray-400">{match.mode}</p>
						</div>
					</div>
					<div className="flex items-center gap-4">
						<div className="text-right">
							<div
								className={`text-lg font-bold ${
									match.lpChange?.startsWith("+")
										? "text-green-400"
										: "text-red-400"
								}`}
							>
								{match.lpChange}
							</div>
							<div className="text-xs text-gray-500">LP Change</div>
						</div>
						<button
							onClick={(e) => {
								e.stopPropagation();
								if (!comparisonSlots[0]) {
									addToComparison(match, 0);
								} else if (!comparisonSlots[1]) {
									addToComparison(match, 1);
								}
							}}
							disabled={
								comparisonSlots.includes(match) ||
								(comparisonSlots[0] && comparisonSlots[1])
							}
							className="px-4 py-2 bg-cyan-900/40 text-cyan-300 rounded hover:bg-cyan-800/40 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
						>
							Compare
						</button>
					</div>
				</div>

				{/* Main content grid */}
				<div className="grid grid-cols-12 gap-6">
					{/* Left: Your Performance */}
					<div className="col-span-3">
						<div className="bg-gray-900/40 rounded-lg p-4 border border-gray-700/30">
							<h4 className="text-cyan-300 font-medium mb-3 text-center">
								Your Performance
							</h4>
							<div className="text-center">
								<div className="text-2xl font-bold text-white mb-2">
									{match.champion}
								</div>
								<div className="text-xl text-yellow-400 mb-1">{match.kda}</div>
								<div className="text-xs text-gray-500 mb-3">K/D/A</div>

								{/* Items Build */}
								<div className="mb-4">
									<div className="text-xs text-gray-400 mb-2">Items</div>
									<div className="grid grid-cols-3 gap-1">
										{match.items
											.slice(0, 6)
											.map((item: string, idx: number) => (
												<div
													key={idx}
													className="w-8 h-8 bg-gray-800/50 border border-gray-600 rounded text-xs flex items-center justify-center text-gray-300"
													title={item}
												>
													{item.slice(0, 2)}
												</div>
											))}
									</div>
								</div>

								{/* Enhanced Stats with Progress Bars */}
								<div className="space-y-2 text-xs">
									<div className="flex justify-between items-center">
										<span className="text-gray-400">CS</span>
										<span className="text-white font-medium">{match.cs}</span>
									</div>
									<div className="w-full bg-gray-700 rounded-full h-1">
										<div
											className="bg-blue-400 h-1 rounded-full"
											style={{
												width: `${Math.min(100, parseInt(match.cs) / 3)}%`,
											}}
										></div>
									</div>

									<div className="flex justify-between items-center">
										<span className="text-gray-400">Vision</span>
										<span className="text-blue-400 font-medium">
											{match.vision}
										</span>
									</div>
									<div className="w-full bg-gray-700 rounded-full h-1">
										<div
											className="bg-blue-400 h-1 rounded-full"
											style={{
												width: `${Math.min(
													100,
													parseInt(match.vision) * 2,
												)}%`,
											}}
										></div>
									</div>

									<div className="flex justify-between items-center">
										<span className="text-gray-400">Damage</span>
										<span className="text-red-400 font-medium">
											{match.damage}
										</span>
									</div>
									<div className="w-full bg-gray-700 rounded-full h-1">
										<div
											className="bg-red-400 h-1 rounded-full"
											style={{
												width: `${Math.min(
													100,
													parseInt(match.damage.replace(/,/g, "")) / 500,
												)}%`,
											}}
										></div>
									</div>

									<div className="flex justify-between items-center">
										<span className="text-gray-400">Gold</span>
										<span className="text-yellow-400 font-medium">
											{match.gold}
										</span>
									</div>
									<div className="w-full bg-gray-700 rounded-full h-1">
										<div
											className="bg-yellow-400 h-1 rounded-full"
											style={{
												width: `${Math.min(
													100,
													parseInt(match.gold.replace(/,/g, "")) / 200,
												)}%`,
											}}
										></div>
									</div>
								</div>
							</div>
						</div>
					</div>

					{/* Center: Team Analysis */}
					<div className="col-span-6">
						<div className="bg-gray-900/40 rounded-lg p-4 border border-gray-700/30">
							<h4 className="text-cyan-300 font-medium mb-4 text-center">
								Team Analysis & Composition
							</h4>

							{/* Team Performance Overview */}
							<div className="grid grid-cols-2 gap-4 mb-6">
								<div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-3">
									<div className="text-blue-400 font-medium text-sm mb-2 text-center">
										{match.blueTeam.name}
									</div>
									<div className="text-center mb-2">
										<span className="text-blue-300 font-bold text-lg">
											{match.blueTeam.stats.kills}
										</span>
										<span className="text-gray-400 mx-1">/</span>
										<span className="text-red-300 font-bold text-lg">
											{match.blueTeam.stats.deaths}
										</span>
										<span className="text-gray-400 mx-1">/</span>
										<span className="text-green-300 font-bold text-lg">
											{match.blueTeam.stats.assists}
										</span>
									</div>
									<div className="text-xs text-gray-400 text-center mb-2">
										KDA:{" "}
										{(
											(match.blueTeam.stats.kills +
												match.blueTeam.stats.assists) /
											Math.max(1, match.blueTeam.stats.deaths)
										).toFixed(2)}
									</div>
									<div className="flex justify-center gap-3 text-xs">
										<span className="text-orange-400">
											🐉 {match.blueTeam.stats.dragons}
										</span>
										<span className="text-purple-400">
											👑 {match.blueTeam.stats.barons}
										</span>
										<span className="text-gray-400">
											🏰 {match.blueTeam.stats.towers}
										</span>
									</div>
								</div>

								<div className="bg-red-900/20 border border-red-500/30 rounded-lg p-3">
									<div className="text-red-400 font-medium text-sm mb-2 text-center">
										{match.redTeam.name}
									</div>
									<div className="text-center mb-2">
										<span className="text-blue-300 font-bold text-lg">
											{match.redTeam.stats.kills}
										</span>
										<span className="text-gray-400 mx-1">/</span>
										<span className="text-red-300 font-bold text-lg">
											{match.redTeam.stats.deaths}
										</span>
										<span className="text-gray-400 mx-1">/</span>
										<span className="text-green-300 font-bold text-lg">
											{match.redTeam.stats.assists}
										</span>
									</div>
									<div className="text-xs text-gray-400 text-center mb-2">
										KDA:{" "}
										{(
											(match.redTeam.stats.kills +
												match.redTeam.stats.assists) /
											Math.max(1, match.redTeam.stats.deaths)
										).toFixed(2)}
									</div>
									<div className="flex justify-center gap-3 text-xs">
										<span className="text-orange-400">
											🐉 {match.redTeam.stats.dragons}
										</span>
										<span className="text-purple-400">
											👑 {match.redTeam.stats.barons}
										</span>
										<span className="text-gray-400">
											🏰 {match.redTeam.stats.towers}
										</span>
									</div>
								</div>
							</div>

							{/* Enhanced Team Compositions with Roles */}
							<div className="space-y-2 mb-4">
								<div className="text-xs text-gray-400 font-medium text-center mb-3">
									Champion Matchups by Role
								</div>
								{match.blueTeam.players.map((bluePlayer: any, i: number) => {
									const roles = ["TOP", "JGL", "MID", "ADC", "SUP"];
									const roleIcons = ["⚔️", "🌲", "⚡", "🏹", "🛡️"];
									const redPlayer = match.redTeam.players[i];

									return (
										<div
											key={i}
											className="bg-gray-800/30 rounded-lg p-3 border border-gray-700/30"
										>
											<div className="flex items-center justify-between">
												{/* Blue Player */}
												<div className="flex items-center gap-3 flex-1">
													<div className="flex items-center gap-2">
														<div className="text-xs">
															{roleIcons[i]}
														</div>
														<div className="text-xs text-gray-400 font-medium w-8">
															{roles[i]}
														</div>
													</div>
													<div
														className={`w-8 h-8 rounded-lg bg-blue-600/20 flex items-center justify-center text-blue-400 text-xs font-bold ${
															bluePlayer.player === "You"
																? "ring-2 ring-yellow-400"
																: ""
														}`}
													>
														{bluePlayer.champion.slice(0, 2)}
													</div>
													<div className="flex flex-col">
														<span
															className={`text-sm font-medium ${
																bluePlayer.player === "You"
																	? "text-yellow-400"
																	: "text-blue-300"
															}`}
														>
															{bluePlayer.champion}
														</span>
														<span className="text-xs text-gray-500">
															{bluePlayer.kda}
														</span>
													</div>
												</div>

												{/* VS indicator with performance comparison */}
												<div className="flex flex-col items-center px-4">
													<div className="text-gray-600 text-xs">VS</div>
													<div className="flex gap-1 mt-1">
														{/* Simple performance dots based on KDA */}
														{(() => {
															const blueKDA = bluePlayer.kda
																.split("/")
																.reduce(
																	(
																		acc: number,
																		val: string,
																		idx: number,
																	) =>
																		idx === 1
																			? acc - parseInt(val)
																			: acc + parseInt(val),
																	0,
																);
															const redKDA =
																redPlayer?.kda
																	.split("/")
																	.reduce(
																		(
																			acc: number,
																			val: string,
																			idx: number,
																		) =>
																			idx === 1
																				? acc -
																					parseInt(val)
																				: acc +
																					parseInt(val),
																		0,
																	) || 0;
															const blueWon = blueKDA > redKDA;
															return (
																<>
																	<div
																		className={`w-1.5 h-1.5 rounded-full ${
																			blueWon
																				? "bg-blue-400"
																				: "bg-gray-600"
																		}`}
																	></div>
																	<div
																		className={`w-1.5 h-1.5 rounded-full ${
																			!blueWon
																				? "bg-red-400"
																				: "bg-gray-600"
																		}`}
																	></div>
																</>
															);
														})()}
													</div>
												</div>

												{/* Red Player */}
												<div className="flex items-center gap-3 flex-1 justify-end">
													<div className="flex flex-col items-end">
														<span className="text-sm font-medium text-red-300">
															{redPlayer?.champion}
														</span>
														<span className="text-xs text-gray-500">
															{redPlayer?.kda}
														</span>
													</div>
													<div className="w-8 h-8 rounded-lg bg-red-600/20 flex items-center justify-center text-red-400 text-xs font-bold">
														{redPlayer?.champion.slice(0, 2)}
													</div>
													<div className="flex items-center gap-2">
														<div className="text-xs text-gray-400 font-medium w-8 text-right">
															{roles[i]}
														</div>
														<div className="text-xs">
															{roleIcons[i]}
														</div>
													</div>
												</div>
											</div>
										</div>
									);
								})}
							</div>

							{/* Team Fighting Analysis */}
							<div className="bg-gray-800/30 rounded-lg p-3 border border-gray-700/30">
								<div className="text-xs text-gray-400 font-medium mb-3 text-center">
									Team Fighting Performance
								</div>
								<div className="grid grid-cols-3 gap-4 text-xs">
									<div className="text-center">
										<div className="text-gray-400 mb-1">Kill Participation</div>
										<div className="flex justify-between">
											<span className="text-blue-400">
												{Math.round(
													((match.blueTeam.stats.kills +
														match.blueTeam.stats.assists) /
														match.blueTeam.stats.kills) *
														100,
												)}
												%
											</span>
											<span className="text-red-400">
												{Math.round(
													((match.redTeam.stats.kills +
														match.redTeam.stats.assists) /
														match.redTeam.stats.kills) *
														100,
												)}
												%
											</span>
										</div>
									</div>
									<div className="text-center">
										<div className="text-gray-400 mb-1">Objective Control</div>
										<div className="flex justify-between">
											<span className="text-blue-400">
												{match.blueTeam.stats.dragons +
													match.blueTeam.stats.barons}
											</span>
											<span className="text-red-400">
												{match.redTeam.stats.dragons +
													match.redTeam.stats.barons}
											</span>
										</div>
									</div>
									<div className="text-center">
										<div className="text-gray-400 mb-1">Map Control</div>
										<div className="flex justify-between">
											<span className="text-blue-400">
												{match.blueTeam.stats.towers}
											</span>
											<span className="text-red-400">
												{match.redTeam.stats.towers}
											</span>
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>

					{/* Right: Game Statistics */}
					<div className="col-span-3">
						<div className="bg-gray-900/40 rounded-lg p-4 border border-gray-700/30">
							<h4 className="text-cyan-300 font-medium mb-3 text-center">
								Game Timeline
							</h4>
							<div className="space-y-3 text-sm">
								<div className="flex justify-between">
									<span className="text-gray-400">Duration:</span>
									<span className="text-white">{match.duration}</span>
								</div>
								<div className="flex justify-between">
									<span className="text-gray-400">Total Kills:</span>
									<span className="text-white">{match.gameStats.totalKills}</span>
								</div>

								{/* Objectives Timeline */}
								<div className="space-y-2">
									<div className="text-xs text-gray-400 font-medium">
										Key Objectives
									</div>
									<div className="space-y-1.5">
										<div className="flex items-center justify-between text-xs">
											<div className="flex items-center gap-2">
												<div className="w-2 h-2 bg-red-500 rounded-full"></div>
												<span>First Blood</span>
											</div>
											<span
												className={
													match.gameStats.firstBlood === "Blue"
														? "text-blue-400"
														: "text-red-400"
												}
											>
												{match.gameStats.firstBlood}
											</span>
										</div>
										<div className="flex items-center justify-between text-xs">
											<div className="flex items-center gap-2">
												<div className="w-2 h-2 bg-gray-500 rounded-full"></div>
												<span>First Tower</span>
											</div>
											<span
												className={
													match.gameStats.firstTower === "Blue"
														? "text-blue-400"
														: "text-red-400"
												}
											>
												{match.gameStats.firstTower}
											</span>
										</div>
										<div className="flex items-center justify-between text-xs">
											<div className="flex items-center gap-2">
												<div className="w-2 h-2 bg-orange-500 rounded-full"></div>
												<span>First Dragon</span>
											</div>
											<span
												className={
													match.gameStats.firstDragon === "Blue"
														? "text-blue-400"
														: "text-red-400"
												}
											>
												{match.gameStats.firstDragon}
											</span>
										</div>
									</div>
								</div>

								{/* Team Performance Comparison */}
								<div className="space-y-2">
									<div className="text-xs text-gray-400 font-medium">
										Objective Control
									</div>
									<div className="space-y-1.5">
										<div className="flex items-center justify-between text-xs">
											<span className="text-gray-400">Dragons</span>
											<div className="flex items-center gap-2">
												<span className="text-blue-400">
													{match.blueTeam.stats.dragons}
												</span>
												<span className="text-gray-500">-</span>
												<span className="text-red-400">
													{match.redTeam.stats.dragons}
												</span>
											</div>
										</div>
										<div className="flex items-center justify-between text-xs">
											<span className="text-gray-400">Barons</span>
											<div className="flex items-center gap-2">
												<span className="text-blue-400">
													{match.blueTeam.stats.barons}
												</span>
												<span className="text-gray-500">-</span>
												<span className="text-red-400">
													{match.redTeam.stats.barons}
												</span>
											</div>
										</div>
										<div className="flex items-center justify-between text-xs">
											<span className="text-gray-400">Towers</span>
											<div className="flex items-center gap-2">
												<span className="text-blue-400">
													{match.blueTeam.stats.towers}
												</span>
												<span className="text-gray-500">-</span>
												<span className="text-red-400">
													{match.redTeam.stats.towers}
												</span>
											</div>
										</div>
									</div>
								</div>

								<div className="pt-2 border-t border-gray-700">
									<div className="text-xs text-gray-500 text-center">
										{formatDate(match.date)}
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</motion.div>
	);

	// Render comparison slot
	const renderComparisonSlot = (slotIndex: 0 | 1) => {
		const match = comparisonSlots[slotIndex];
		const isHovered = hoveredSlot === slotIndex;
		const isEmpty = !match;

		return (
			<div
				onDragOver={(e) => handleDragOver(e, slotIndex)}
				onDragLeave={handleDragLeave}
				onDrop={(e) => handleDrop(e, slotIndex)}
				className={`min-h-[160px] border-2 border-dashed rounded-xl flex items-center justify-center relative transition-all duration-300 ${
					isEmpty
						? isHovered && isDragging
							? "border-cyan-400 bg-cyan-500/10 scale-105"
							: "border-gray-600 hover:border-gray-500"
						: "border-gray-700 bg-gray-800/20"
				}`}
			>
				{match ? (
					<div className="w-full p-4 bg-gray-800/40 rounded-lg relative">
						<button
							onClick={() => removeFromComparison(slotIndex)}
							className="absolute -top-2 -right-2 w-6 h-6 bg-red-500/80 rounded-full flex items-center justify-center text-white hover:bg-red-500 transition-colors"
						>
							<X size={12} />
						</button>
						<div className="text-center">
							<h4 className="text-cyan-300 font-medium mb-2 text-sm">
								League of Legends
							</h4>
							<div className="text-lg font-bold text-white mb-1">
								{match.champion}
							</div>
							<div className="text-sm text-gray-400 mb-2">{match.kda}</div>
							<div
								className={`text-sm font-medium ${
									match.result === "Victory" ? "text-green-400" : "text-red-400"
								}`}
							>
								{match.result}
							</div>
							<div className="text-xs text-gray-500 mt-1">
								{formatDate(match.date)}
							</div>
						</div>
					</div>
				) : (
					<div
						className={`text-center transition-all duration-300 ${
							isHovered && isDragging ? "scale-110" : ""
						}`}
					>
						<div
							className={`mx-auto mb-3 p-3 rounded-full transition-all duration-300 ${
								isHovered && isDragging
									? "bg-cyan-500/20 text-cyan-300"
									: "bg-gray-700/50 text-gray-500"
							}`}
						>
							{isHovered && isDragging ? (
								<MousePointer2 size={24} />
							) : (
								<Plus size={24} />
							)}
						</div>
						<p
							className={`font-medium transition-all duration-300 ${
								isHovered && isDragging ? "text-cyan-300" : "text-gray-500"
							}`}
						>
							{isHovered && isDragging ? "Drop here to compare" : "Drag a match here"}
						</p>
						<p className="text-xs text-gray-600 mt-1">
							{slotIndex === 0 ? "First match" : "Second match"}
						</p>
					</div>
				)}
			</div>
		);
	};

	return (
		<div className="min-h-screen bg-gradient-to-b from-[#070B14] via-[#0E1420] to-[#151F2E] text-white">
			{/* Drag Overlay */}
			{isDragging && (
				<motion.div
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 pointer-events-none"
				/>
			)}

			{/* Background Elements (Fixed) */}
			<div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
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
				{/* HUD Borders */}
				<div className="absolute top-0 left-0 w-32 h-32 border-l-2 border-t-2 border-cyan-500/20" />
				<div className="absolute top-0 right-0 w-32 h-32 border-r-2 border-t-2 border-cyan-500/20" />
				<div className="absolute bottom-0 left-0 w-32 h-32 border-l-2 border-b-2 border-cyan-500/20" />
				<div className="absolute bottom-0 right-0 w-32 h-32 border-r-2 border-b-2 border-cyan-500/20" />
			</div>

			{/* Main Content */}
			<div className="px-4 pt-4 pb-10 min-h-screen relative z-10">
				{/* Centered Container - 80% width */}
				<div className="max-w-[80%] mx-auto">
					{/* Recent Matches - Horizontal Scroll with Physics - One at a time */}
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						className="mb-8 rounded-xl bg-gradient-to-r from-cyan-900/60 to-blue-900/60 backdrop-blur-md border border-cyan-500/30 shadow-lg overflow-hidden"
					>
						<div className="bg-gradient-to-r from-cyan-900/80 to-blue-900/80 p-4 flex items-center justify-between">
							<div className="flex items-center space-x-3">
								<Trophy className="text-yellow-400" size={20} />
								<h2 className="text-white font-bold text-lg">RECENT MATCHES</h2>
							</div>
							<div className="flex items-center gap-2">
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
								<button
									onClick={scrollLeft}
									className="p-2 bg-gray-800/40 hover:bg-gray-700/40 rounded-md transition-colors"
								>
									<ChevronLeft size={16} className="text-cyan-300" />
								</button>
								<button
									onClick={scrollRight}
									className="p-2 bg-gray-800/40 hover:bg-gray-700/40 rounded-md transition-colors"
								>
									<ChevronRight size={16} className="text-cyan-300" />
								</button>
							</div>
						</div>

						<div className="p-6">
							<div
								ref={scrollContainerRef}
								className="relative overflow-hidden w-full"
								style={{ height: "auto" }}
							>
								<motion.div
									style={{
										x: smoothScrollX,
										minHeight: "320px",
									}}
									className="flex gap-6"
								>
									{recentMatches.map((match, index) =>
										renderHorizontalMatchCard(match, index),
									)}
								</motion.div>
							</div>
						</div>
					</motion.div>

					{/* Comparison Section - Enhanced Drop Zones */}
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: 0.1 }}
						className="mb-8 rounded-xl bg-gray-900/60 backdrop-blur-md border border-cyan-500/20 shadow-lg overflow-hidden"
					>
						<div className="bg-gradient-to-r from-gray-900/80 to-gray-800/80 p-4 flex items-center justify-between">
							<div className="flex items-center space-x-3">
								<Target className="text-cyan-400" size={20} />
								<h2 className="text-white font-bold text-lg">MATCH COMPARISON</h2>
								{isDragging && (
									<motion.div
										initial={{ opacity: 0, scale: 0.8 }}
										animate={{ opacity: 1, scale: 1 }}
										className="text-cyan-300 text-sm bg-cyan-900/20 px-3 py-1 rounded-full"
									>
										Drop to compare matches
									</motion.div>
								)}
							</div>
							{(comparisonSlots[0] || comparisonSlots[1]) && (
								<button
									onClick={clearComparison}
									className="text-gray-400 hover:text-red-400 transition-colors"
								>
									<X size={20} />
								</button>
							)}
						</div>

						<div className="p-6">
							<div className="grid grid-cols-2 gap-8">
								{renderComparisonSlot(0)}
								{renderComparisonSlot(1)}
							</div>

							{/* Comparison Results */}
							{comparisonSlots[0] && comparisonSlots[1] && (
								<CrossReferencedStats
									match1={comparisonSlots[0]}
									match2={comparisonSlots[1]}
								/>
							)}
						</div>
					</motion.div>

					{/* Match History Section - Full Width within container */}
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: 0.2 }}
						className="rounded-xl bg-gray-900/60 backdrop-blur-md border border-cyan-500/20 shadow-lg overflow-hidden"
					>
						{/* Header */}
						<div className="bg-gradient-to-r from-gray-900/80 to-gray-800/80 p-4 flex items-center justify-between">
							<div className="flex items-center space-x-3">
								<Clock className="text-cyan-400" size={20} />
								<h2 className="text-white font-bold text-lg">MATCH HISTORY</h2>
								{isDragging && (
									<motion.div
										initial={{ opacity: 0, x: -20 }}
										animate={{ opacity: 1, x: 0 }}
										className="text-gray-400 text-sm"
									>
										Select matches to compare
									</motion.div>
								)}
							</div>
						</div>

						{/* Search & Filter */}
						<div className="p-4 border-b border-cyan-500/20 bg-gray-900/30">
							<div className="flex flex-wrap items-center justify-between gap-4">
								{/* Search */}
								<div className="relative flex-grow max-w-md">
									<input
										type="text"
										placeholder="Search by champion..."
										value={searchTerm}
										onChange={(e) => setSearchTerm(e.target.value)}
										className="w-full px-10 py-2 bg-gray-800/80 border border-gray-700 rounded-md text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 transition-colors"
									/>
									<Search
										className="absolute left-3 top-2.5 text-gray-500"
										size={18}
									/>
									{searchTerm && (
										<button
											onClick={() => setSearchTerm("")}
											className="absolute right-3 top-2.5 text-gray-500 hover:text-gray-300"
										>
											✕
										</button>
									)}
								</div>

								{/* Filter Buttons */}
								<div className="flex items-center gap-2">
									{/* Result Filter */}
									<div className="flex">
										<button
											onClick={() => setResultFilter("all")}
											className={`px-3 py-1.5 text-sm rounded-l-md border border-r-0 transition-colors ${
												resultFilter === "all"
													? "bg-cyan-900/40 text-cyan-300 border-cyan-500/50"
													: "bg-gray-800/40 text-gray-400 border-gray-700 hover:text-gray-200"
											}`}
										>
											All
										</button>
										<button
											onClick={() => setResultFilter("Victory")}
											className={`px-3 py-1.5 text-sm border border-r-0 transition-colors ${
												resultFilter === "Victory"
													? "bg-cyan-900/40 text-cyan-300 border-cyan-500/50"
													: "bg-gray-800/40 text-gray-400 border-gray-700 hover:text-gray-200"
											}`}
										>
											Wins
										</button>
										<button
											onClick={() => setResultFilter("Defeat")}
											className={`px-3 py-1.5 text-sm rounded-r-md border transition-colors ${
												resultFilter === "Defeat"
													? "bg-cyan-900/40 text-cyan-300 border-cyan-500/50"
													: "bg-gray-800/40 text-gray-400 border-gray-700 hover:text-gray-200"
											}`}
										>
											Losses
										</button>
									</div>

									<button
										onClick={() => setShowFilters(!showFilters)}
										className={`p-2 rounded-md border transition-colors ${
											showFilters
												? "bg-cyan-900/40 text-cyan-300 border-cyan-500/50"
												: "bg-gray-800/40 text-gray-400 border-gray-700 hover:text-gray-200"
										}`}
									>
										<Sliders size={18} />
									</button>
								</div>
							</div>

							{/* Advanced Filters */}
							{showFilters && (
								<motion.div
									initial={{ height: 0, opacity: 0 }}
									animate={{ height: "auto", opacity: 1 }}
									exit={{ height: 0, opacity: 0 }}
									transition={{ duration: 0.3 }}
									className="mt-4 p-4 bg-gray-800/40 border border-gray-700 rounded-md"
								>
									<div className="flex flex-wrap gap-4">
										<div className="flex flex-col gap-2">
											<label className="text-sm text-gray-400">
												From Date
											</label>
											<input
												type="date"
												value={dateFilter.from}
												onChange={(e) =>
													setDateFilter({
														...dateFilter,
														from: e.target.value,
													})
												}
												className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-gray-200 focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500"
											/>
										</div>
										<div className="flex flex-col gap-2">
											<label className="text-sm text-gray-400">To Date</label>
											<input
												type="date"
												value={dateFilter.to}
												onChange={(e) =>
													setDateFilter({
														...dateFilter,
														to: e.target.value,
													})
												}
												className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-gray-200 focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500"
											/>
										</div>
										<div className="flex items-end">
											<button
												onClick={() =>
													setDateFilter({
														from: "",
														to: "",
													})
												}
												className="px-4 py-2 bg-gray-700 text-gray-300 rounded-md hover:bg-gray-600 transition-colors"
											>
												Clear Dates
											</button>
										</div>
									</div>
								</motion.div>
							)}
						</div>

						{/* Match Grid - Wider Three-Column Layout */}
						<div className="p-6">
							<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
								{currentMatches.length > 0 ? (
									currentMatches.map((match, index) =>
										renderCompactMatchCard(match, index),
									)
								) : (
									<div className="col-span-full py-16 text-center text-gray-500">
										<div className="flex flex-col items-center">
											<Search size={32} className="mb-3 text-gray-600" />
											<p className="text-lg font-medium">No matches found</p>
											<p className="text-sm">
												Try adjusting your search or filter settings
											</p>
										</div>
									</div>
								)}
							</div>
						</div>

						{/* Pagination */}
						{filteredMatches.length > 0 && (
							<div className="px-6 py-4 bg-gray-900/30 border-t border-cyan-500/20 flex items-center justify-between">
								<div className="text-sm text-gray-400">
									Showing {indexOfFirstItem + 1} to{" "}
									{Math.min(indexOfLastItem, filteredMatches.length)} of{" "}
									{filteredMatches.length} matches
								</div>
								<div className="flex items-center space-x-2">
									<button
										onClick={() => paginate(Math.max(1, currentPage - 1))}
										disabled={currentPage === 1}
										className={`p-2 rounded-md border ${
											currentPage === 1
												? "bg-gray-800/20 text-gray-600 border-gray-800 cursor-not-allowed"
												: "bg-gray-800/40 text-gray-400 border-gray-700 hover:text-cyan-400 hover:border-cyan-500/30"
										}`}
									>
										<ArrowLeft size={16} />
									</button>
									{[...Array(totalPages)].map((_, i) => (
										<button
											key={i}
											onClick={() => paginate(i + 1)}
											className={`px-3 py-1 rounded-md border ${
												currentPage === i + 1
													? "bg-cyan-900/40 text-cyan-300 border-cyan-500/50"
													: "bg-gray-800/40 text-gray-400 border-gray-700 hover:text-cyan-400 hover:border-cyan-500/30"
											}`}
										>
											{i + 1}
										</button>
									))}
									<button
										onClick={() =>
											paginate(Math.min(totalPages, currentPage + 1))
										}
										disabled={currentPage === totalPages}
										className={`p-2 rounded-md border ${
											currentPage === totalPages
												? "bg-gray-800/20 text-gray-600 border-gray-800 cursor-not-allowed"
												: "bg-gray-800/40 text-gray-400 border-gray-700 hover:text-cyan-400 hover:border-cyan-500/30"
										}`}
									>
										<ArrowRight size={16} />
									</button>
								</div>
							</div>
						)}
					</motion.div>
				</div>
			</div>
		</div>
	);
}
