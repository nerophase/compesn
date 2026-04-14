import { TChampion } from "@compesn/shared/common/types/champion";
import { useDeferredValue, useMemo, useState } from "react";
import { TTag } from "@compesn/shared/common/types/tag";
import { CHAMPIONS } from "@/constants/champions-db/champions-data";
import { CheckIcon, SearchIcon, XIcon } from "lucide-react";
import { motion } from "framer-motion";
import Image from "next/image";
import { getChampionImage } from "@/utils/champions";
import { TDraftTeam } from "@compesn/shared/common/types/draft-team";

// Champion role icons (using emoji for now, can be replaced with proper icons)
const tagIcons: Record<TTag, string> = {
	All: "⚡",
	Assassin: "🗡️",
	Fighter: "⚔️",
	Mage: "🔮",
	Marksman: "🏹",
	Support: "🛡️",
	Tank: "🔰",
};

export default function ChampionSelector({
	blueTeam,
	redTeam,
	canSelect,
	selectedChampion,
	disabledChampions,
	handleChampionSelect,
}: {
	blueTeam: TDraftTeam;
	redTeam: TDraftTeam;
	canSelect: boolean;
	selectedChampion: TChampion | null;
	disabledChampions: TChampion[];
	handleChampionSelect: (champion: TChampion) => void;
}) {
	const [searchTerm, setSearchTerm] = useState("");
	const deferredSearch = useDeferredValue(searchTerm);
	const [selectedTag, setSelectedTag] = useState<TTag>("All");

	const getChampionStatus = (champion: TChampion) => {
		const allBanned = [...blueTeam.ban, ...redTeam.ban];
		const allPicked = [...blueTeam.pick, ...redTeam.pick];

		if (allBanned.find((e) => e?.name === champion.name)) return "banned";
		if (allPicked.find((e) => e?.name === champion.name)) return "picked";
		if (disabledChampions.find((e) => e.name === champion.name)) return "disabled";
		if (selectedChampion?.name === champion.name) return "selected";
		return "available";
	};

	const championsList = useMemo(() => {
		return [{ name: "No Ban", fileName: "no-ban", roles: [], tags: [] }, ...CHAMPIONS];
	}, []);

	// Filtered champions based on search and role
	const filteredChampions = useMemo(() => {
		return championsList.filter((champion) => {
			const matchesSearch = champion.name
				.toLowerCase()
				.includes(deferredSearch.toLowerCase());
			const matchesTag = selectedTag === "All" || champion.tags.includes(selectedTag);
			return matchesSearch && matchesTag;
		});
	}, [deferredSearch, selectedTag, championsList]);

	return (
		<div className="bg-black/20 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden h-full">
			{/* Champion Select Header */}
			<div className="bg-linear-to-r from-purple-600/30 to-indigo-600/30 backdrop-blur-md p-3 border-b border-purple-400/20 shrink-0">
				<div className="flex items-center justify-between h-full overflow-x-auto">
					{/* <div className="flex items-center gap-2 min-w-fit mr-2">
						<UsersIcon className="text-purple-400" size={16} />
						<span className="font-bold text-sm">
							Champion Select
						</span>
					</div> */}

					{/* Search and Filter */}
					<div className="flex items-center gap-2 h-full w-full">
						<div className="relative h-full w-full">
							<SearchIcon
								className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400"
								size={14}
							/>
							<input
								id="search-field"
								type="text"
								placeholder="Search champions..."
								value={searchTerm}
								onChange={(e) => setSearchTerm(e.target.value)}
								className="pl-8 pr-3 bg-gray-800/50 backdrop-blur-md border border-gray-600/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400/50 transition-colors min-w-48 w-full text-sm h-full"
							/>
						</div>

						<div className="flex items-center gap-1 bg-gray-800/50 backdrop-blur-md border border-gray-600/30 rounded-lg p-1">
							{Object.entries(tagIcons).map(([tag, icon]) => (
								<button
									key={tag}
									onClick={() => setSelectedTag(tag as TTag)}
									className={`px-2 py-1 rounded-md text-xs font-medium transition-all duration-200 ${
										selectedTag === tag
											? "bg-cyan-500 text-white shadow-lg"
											: "text-gray-400 hover:text-white hover:bg-gray-700/50"
									}`}
									title={tag}
								>
									{icon}
								</button>
							))}
						</div>
					</div>
				</div>
			</div>

			{/* Champion Grid */}
			<div className="flex-1 p-3 overflow-y-auto min-h-0">
				<div className="grid grid-cols-7 gap-2">
					{filteredChampions.map((champion) => {
						const status = getChampionStatus(champion);
						return (
							<motion.button
								key={champion.name}
								whileHover={{
									scale: status === "available" ? 1.05 : 1,
								}}
								whileTap={{
									scale: status === "available" ? 0.95 : 1,
								}}
								onClick={() => handleChampionSelect(champion)}
								disabled={
									(status === "banned" ||
										status === "picked" ||
										status === "disabled") &&
									champion.fileName !== "no-ban"
								}
								className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all duration-200 ${
									status === "banned" && champion.fileName !== "no-ban"
										? "border-red-500/50 cursor-not-allowed"
										: status === "picked"
											? "border-green-500/50 cursor-not-allowed"
											: status === "selected"
												? "border-cyan-400 shadow-lg shadow-cyan-400/25"
												: "border-gray-600/30 hover:border-gray-500/50"
								} ${canSelect && "cursor-pointer"}`}
							>
								<Image
									src={getChampionImage(champion.fileName)}
									alt={champion.name}
									width={380}
									height={380}
									className={`w-full h-full object-cover ${
										status === "banned" ||
										status === "picked" ||
										status === "disabled"
											? "grayscale"
											: ""
									} ${champion.fileName === "no-ban" && "p-4"}`}
								/>

								{/* Status Overlay */}
								{status === "banned" && champion.fileName !== "no-ban" && (
									<div className="absolute inset-0 bg-red-500/50 flex items-center justify-center">
										<XIcon className="text-white" size={16} />
									</div>
								)}
								{status === "picked" && (
									<div className="absolute inset-0 bg-green-500/50 flex items-center justify-center">
										<CheckIcon className="text-white" size={16} />
									</div>
								)}
								{status === "selected" && (
									<div className="absolute inset-0 border-2 border-cyan-400 rounded-xl" />
								)}

								{/* Champion Name */}
								<div className="absolute bottom-0 left-0 right-0 bg-linear-to-t from-black/80 to-transparent p-1">
									<div className="text-white text-xs font-medium truncate">
										{champion.name}
									</div>
								</div>
							</motion.button>
						);
					})}
				</div>
			</div>
		</div>
	);
}
