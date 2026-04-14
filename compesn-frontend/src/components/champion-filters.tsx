import Image from "next/image";
import type { Dispatch, SetStateAction } from "react";

const filters = [
	{
		name: "top",
		img: "/imgs/roles/top.svg",
	},
	{
		name: "jungle",
		img: "/imgs/roles/jungle.svg",
	},
	{
		name: "mid",
		img: "/imgs/roles/mid.svg",
	},
	{
		name: "bottom",
		img: "/imgs/roles/bottom.svg",
	},
	{
		name: "support",
		img: "/imgs/roles/support.svg",
	},
	{
		name: "no-role",
		img: "/imgs/roles/circle-off.svg",
	},
] as const;

type ChampionFilterName = (typeof filters)[number]["name"];

export default function ChampionFilters({
	activeFilters,
	setActiveFilters,
	activeColor,
	showNoRole,
}: {
	activeFilters: ChampionFilterName[];
	setActiveFilters: Dispatch<SetStateAction<ChampionFilterName[]>>;
	activeColor: string;
	showNoRole?: boolean;
}) {
	return (
		<div className="h-12 flex gap-2 min-w-fit">
			{filters.map((filter) => {
				if (filter.name === "no-role" && !showNoRole) return;

				return (
					<Image
						key={filter.name}
						src={filter.img}
						alt={""}
						width={48}
						height={48}
						className={`h-full w-full hover:cursor-pointer hover:scale-110 transition-all ease-in-out select-none ${
							activeFilters.includes(filter.name) ? activeColor : ""
						}`}
						onClick={() => {
							if (activeFilters[0] === filter.name) {
								setActiveFilters([]);
							} else {
								setActiveFilters([filter.name]);
							}

							// For Multiple Filters
							// const updatedFilters = activeFilters.includes(
							// 	filter.name
							// )
							// 	? activeFilters.filter((e) => e !== filter.name)
							// 	: [filter.name];
							// setActiveFilters(updatedFilters);
						}}
					></Image>
				);
			})}
		</div>
	);
}
