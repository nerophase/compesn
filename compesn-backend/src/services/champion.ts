import { env } from "@/environment";
import fs from "fs";
import path from "path";
import axios from "axios";
import { TChampion } from "@compesn/shared/common/types/champion";

const getChampions: () => TChampion[] = () => {
	if (!fs.existsSync(env.CHAMPIONS_FILE_PATH)) {
		fs.mkdirSync(path.dirname(env.CHAMPIONS_FILE_PATH), { recursive: true });
		fs.writeFileSync(env.CHAMPIONS_FILE_PATH, JSON.stringify([]));
		return [];
	}

	return JSON.parse(fs.readFileSync(env.CHAMPIONS_FILE_PATH).toString());
};

const getChampionByFileName = (championFileName: string) => {
	const champions = getChampions();
	return champions.find((champion: TChampion) => champion.fileName === championFileName);
};

const setChampions = (champions: TChampion[]) => {
	const sortedChampions = champions.sort((a: TChampion, b: TChampion) =>
		a.name.localeCompare(b.name),
	);
	fs.writeFileSync(env.CHAMPIONS_FILE_PATH, JSON.stringify(sortedChampions));
};

const addChampion = (champion: TChampion) => {
	let champions: TChampion[] = getChampions();
	champions.push(champion);
	champions = champions.sort((a: TChampion, b: TChampion) => a.name.localeCompare(b.name));
	fs.writeFileSync(env.CHAMPIONS_FILE_PATH, JSON.stringify(champions));
	return champion;
};

const updateChampion = (championFileName: string, championData: TChampion) => {
	const champions: TChampion[] = getChampions();
	const idx = champions.findIndex((e) => e.fileName === championFileName);
	champions[idx] = championData;
	fs.writeFileSync(env.CHAMPIONS_FILE_PATH, JSON.stringify(champions.sort()));
	return champions[idx];
};

const deleteChampion = (championFileName: string) => {
	let champions: TChampion[] = getChampions();
	const champion = champions.find((e) => e.fileName === championFileName);
	champions = champions.filter((e) => e.fileName !== championFileName);
	fs.writeFileSync(env.CHAMPIONS_FILE_PATH, JSON.stringify(champions.sort()));
	return champion;
};

const addChampionImg = async (
	champion: string,
	imgUrl: string,
	nameEnd: string,
	updateImg: boolean,
) => {
	const champImg = (
		await axios.get(`${imgUrl}${champion}${nameEnd}`, {
			responseType: "arraybuffer",
		})
	).data;

	const buffer = Buffer.from(champImg, "binary");

	fs.mkdirSync(env.CHAMPIONS_IMAGES_PATH, { recursive: true });

	const imgPath = path.join(env.CHAMPIONS_IMAGES_PATH, `${champion}${nameEnd}`);

	if (!fs.existsSync(imgPath) || updateImg) fs.writeFileSync(imgPath, buffer);
};

const addChampionLargeImg = async (champion: string, updateImg: boolean = false) => {
	addChampionImg(
		champion,
		"https://ddragon.leagueoflegends.com/cdn/img/champion/loading/",
		"_0.jpg",
		updateImg,
	);
};

const addChampionShortImg = async (
	champion: string,
	apiVersion: string,
	updateImg: boolean = false,
) => {
	addChampionImg(
		champion,
		`https://ddragon.leagueoflegends.com/cdn/${apiVersion}/img/champion/`,
		".png",
		updateImg,
	);
};

const updateChampionsFromDataDragonFile = async () => {
	const dataDragonFilePath = path.join(process.cwd(), "champion.json");
	const newChampions = JSON.parse(fs.readFileSync(dataDragonFilePath).toString()).data;

	const oldChampions = getChampions() as any;

	for (const champ of Object.keys(newChampions)) {
		const champion = oldChampions.find((e: TChampion) => e.fileName === champ);

		if (champion) {
			champion.tags = newChampions[champ].tags;
		} else {
			oldChampions.push({
				name: newChampions[champ].name,
				filename: champ,
				roles: [],
				tags: newChampions[champ].tags,
			});
		}
	}

	fs.writeFileSync(
		env.CHAMPIONS_FILE_PATH,
		JSON.stringify(oldChampions.sort((a: any, b: any) => a.name.localeCompare(b.name))),
	);
};

export const championService = {
	getChampions,
	getChampionByFileName,
	setChampions,
	addChampion,
	updateChampion,
	deleteChampion,
	addChampionLargeImg,
	addChampionShortImg,
	updateChampionsFromDataDragonFile,
};
