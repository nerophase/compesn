import { useState, useMemo, memo, useDeferredValue } from "react";
import Image from "next/image";
import SearchBar from "./search-bar";
import ChampionFilters from "./champion-filters";
import { cn, getChampionSmallImgURL } from "@/lib/utils";
import { Tooltip } from "react-tooltip";
import React from "react";
import { TTeamColor } from "@compesn/shared/common/types/team-color";
import { TChampionList } from "@compesn/shared/common/types/champion-list";
import { TChampion } from "@compesn/shared/common/types/champion";
import { TTurn } from "@compesn/shared/common/types/turn";
import { TRole } from "@compesn/shared/common/types/role";

type TMode = "DISABLE_CHAMPIONS" | "DRAFT";

const ChampionSelector = memo(function ChampionSelector({
	className,
	team,
	bluePicks,
	redPicks,
	blueBans,
	redBans,
	suggestedChampion,
	disabledChampions,
	cursorOnDisabledChampions = false,
	canSelect,
	champions,
	turn,
	mode = "DRAFT",
	onChampionSelect,
}: {
	className?: string;
	team?: TTeamColor | undefined;
	bluePicks?: TChampionList;
	redPicks?: TChampionList;
	blueBans?: TChampionList;
	redBans?: TChampionList;
	suggestedChampion?: TChampion | null;
	disabledChampions?: TChampion[];
	cursorOnDisabledChampions?: boolean;
	canSelect: boolean;
	champions: TChampion[];
	turn?: TTurn;
	mode?: TMode;
	onChampionSelect: (champion: TChampion) => void;
}) {
	const [activeFilters, setActiveFilters]: [TRole[], any] = useState([]);
	const [search, setSearch] = useState("");
	const deferredSearch = useDeferredValue(search);

	const filteredChampions = useMemo(() => {
		return champions.filter((champion) => {
			const nameMatches = champion.name.toLowerCase().includes(deferredSearch.toLowerCase());
			const roleMatches = activeFilters.every((role) => champion.roles.includes(role));
			return nameMatches && roleMatches;
		});
	}, [champions, deferredSearch, activeFilters]);

	return (
		<div className={className + " flex flex-col overflow-clip relative"}>
			{/* top bar */}
			<div className="h-12 pr-2 flex items-center justify-start shrink-0 mb-1">
				<SearchBar search={search} setSearch={setSearch} />
				<ChampionFilters
					activeFilters={activeFilters}
					setActiveFilters={setActiveFilters}
					activeColor={
						team === "red"
							? "drop-shadow-[0px_0px_5px_#F64C41]"
							: "drop-shadow-[0px_0px_5px_#5A41F6]"
						// : "drop-shadow-[0px_0px_5px_#646464]"
					}
				/>
			</div>
			{/* champions grid */}
			<div className="h-full min-h-[6rem] max-h-full w-full overflow-y-scroll overflow-x-hidden grid grid-cols-[repeat(auto-fill,72px)] grid-rows-[repeat(auto-fill,72px)] justify-items-center items-center justify-start gap-1 z-10 relative">
				{filteredChampions.map((champion, index) => {
					return (
						<ChampionTile
							key={champion.fileName + index}
							champion={champion}
							turn={turn}
							cursorOnDisabledChampions={cursorOnDisabledChampions}
							canSelect={canSelect}
							mode={mode}
							onChampionSelect={onChampionSelect}
							bluePicks={bluePicks}
							redPicks={redPicks}
							blueBans={blueBans}
							redBans={redBans}
							disabledChampions={disabledChampions}
							suggestedChampion={suggestedChampion?.name}
						/>
					);
				})}
				<Tooltip
					id={"champion-selector-tooltip"}
					style={{
						backgroundColor:
							team === "red"
								? "rgb(246, 75, 65)"
								: team === "blue"
									? "rgb(90, 65, 246)"
									: "var(--color-cyan-700)",
						userSelect: "none",
						zIndex: "50",
					}}
					opacity={1}
					className="shadow-[0px_0px_8px_rgba(0,0,0,1)]"
				/>
			</div>
		</div>
	);
});

const ChampionTile = memo(function ChampionTile({
	champion,
	turn,
	cursorOnDisabledChampions,
	canSelect,
	mode,
	bluePicks,
	redPicks,
	blueBans,
	redBans,
	disabledChampions,
	suggestedChampion,
	onChampionSelect,
}: {
	champion: TChampion;
	turn: TTurn | undefined;
	cursorOnDisabledChampions: boolean;
	canSelect: boolean;
	mode: TMode;
	bluePicks: TChampionList | undefined;
	redPicks: TChampionList | undefined;
	blueBans: TChampionList | undefined;
	redBans: TChampionList | undefined;
	disabledChampions: TChampionList | undefined;
	suggestedChampion: string | undefined;
	onChampionSelect: (champion: TChampion) => void;
}) {
	let divClassname: string = "";
	let imageClassName: string = "";
	let championSelected: boolean = false;
	let championDisabled: boolean = false;

	if (bluePicks?.find((champ) => champ?.name === champion.name)) {
		divClassname = "border border-draft-blue";
		championSelected = true;
	} else if (redPicks?.find((champ) => champ?.name === champion.name)) {
		divClassname = "border border-draft-red";
		championSelected = true;
	} else if (
		blueBans?.find((champ) => champ?.name === champion.name) &&
		champion.fileName !== "no-ban"
	) {
		divClassname = "border border-draft-blue";
		imageClassName = "grayscale";
		championSelected = true;
	} else if (
		redBans?.find((champ) => champ?.name === champion.name) &&
		champion.fileName !== "no-ban"
	) {
		divClassname = "border border-draft-red";
		imageClassName = "grayscale";
		championSelected = true;
	} else if (disabledChampions?.find((champ) => champ?.name === champion.name)) {
		imageClassName = "grayscale";
		championDisabled = true;
	} else if (suggestedChampion === champion.name) {
		divClassname = "border border-400";
	}

	return (
		<>
			<div
				className={cn(
					"relative transition-transform will-change-transform flex items-center justify-center",
					divClassname,
					!(turn?.type !== "ban" && champion.fileName === "no-ban") &&
						!championSelected &&
						canSelect &&
						!(mode === "DRAFT" && championDisabled) &&
						"hover:scale-110 hover:cursor-pointer",
					championSelected && cursorOnDisabledChampions && "hover:cursor-pointer",
				)}
				style={{ width: 64, height: 64 }}
				onClick={() => {
					if (canSelect) {
						if (turn?.type !== "ban" && champion.fileName === "no-ban") {
							return;
						}
						onChampionSelect(champion);
					}
				}}
				data-tooltip-id={"champion-selector-tooltip"}
				data-tooltip-content={champion.name}
			>
				<Image
					src={getChampionSmallImgURL(champion)}
					alt={champion.name}
					className={cn(
						"select-none -z-20 w-full h-full",
						imageClassName,
						champion.fileName === "no-ban" && "p-2",
					)}
					width={64}
					height={64}
				/>
				{/* <Image
					src={getChampionSmallImgURL(champion)}
					alt=""
					width={64}
					height={64}
					className={cn(
						"select-none -z-20",
						imageClassName,
						champion.fileName === "no-ban" && "p-2"
					)}
					// loading="lazy"
					priority
				/> */}
			</div>
		</>
	);
});

export default ChampionSelector;
