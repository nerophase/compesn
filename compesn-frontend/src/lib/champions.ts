export { addChampion, getCurrentChampion, removeChampion } from "@compesn/shared/draft/champions";

// Get champion image URL
export const getChampionImage = (championFileName: string) => {
	return championFileName === "no-ban"
		? `/imgs/no-ban.svg`
		: `/imgs/champions-tiles/${championFileName}_0.jpg`;
};
