import { baseProcedure, createTRPCRouter, authenticatedProcedure } from "../../init";
import { z } from "zod";
import {
	ChampionGetSchema,
	ChampionUpdateSchema,
	ChampionDeleteSchema,
	ChampionAddSchema,
	ChampionSetSchema,
	ChampionLargeImgSchema,
	ChampionShortImgSchema,
} from "./champions.schema";
import { CHAMPIONS } from "../../../constants/champions-db/champions-data";
import { getCachedChampionData } from "../../../lib/champion-cache";
import fs from "fs";
import path from "path";
import axios from "axios";
import { TChampion } from "@compesn/shared/common/types/champion";

export const championsRouter = createTRPCRouter({
	getAll: baseProcedure.query(() => {
		return CHAMPIONS;
	}),

	// Get DDragon champion data for draft/champion selection
	getDDragonData: baseProcedure.query(async () => {
		return Object.values((await getCachedChampionData()).data);
	}),

	// Get champions by IDs for draft components
	getByIds: baseProcedure.input(z.array(z.number())).query(async ({ input }) => {
		const { getChampionsByIds } = await import("../../../lib/champion-cache");
		return await getChampionsByIds(input);
	}),

	get: baseProcedure.input(ChampionGetSchema).query(({ input }) => {
		// Define the champions file path
		const CHAMPIONS_FILE_PATH = path.join(
			process.cwd(),
			"src",
			"constants",
			"champions-db",
			"champions.json",
		);

		// Get all champions
		let champions: TChampion[];
		if (fs.existsSync(CHAMPIONS_FILE_PATH)) {
			try {
				champions = JSON.parse(fs.readFileSync(CHAMPIONS_FILE_PATH).toString());
			} catch (error) {
				console.warn("Failed to read champions file, using static data");
				champions = CHAMPIONS;
			}
		} else {
			champions = CHAMPIONS;
		}

		return champions.find(
			(champion: TChampion) => champion.fileName === input.championFileName,
		);
	}),

	add: authenticatedProcedure.input(ChampionAddSchema).mutation(({ input }) => {
		const CHAMPIONS_FILE_PATH = path.join(
			process.cwd(),
			"src",
			"constants",
			"champions-db",
			"champions.json",
		);

		// Get current champions
		let champions: TChampion[];
		if (fs.existsSync(CHAMPIONS_FILE_PATH)) {
			try {
				champions = JSON.parse(fs.readFileSync(CHAMPIONS_FILE_PATH).toString());
			} catch (error) {
				champions = CHAMPIONS;
			}
		} else {
			champions = CHAMPIONS;
		}

		// Add new champion
		champions.push(input.champion);
		champions = champions.sort((a: TChampion, b: TChampion) => a.name.localeCompare(b.name));

		// Save to file
		const dir = path.dirname(CHAMPIONS_FILE_PATH);
		if (!fs.existsSync(dir)) {
			fs.mkdirSync(dir, { recursive: true });
		}
		fs.writeFileSync(CHAMPIONS_FILE_PATH, JSON.stringify(champions, null, 2));

		return input.champion;
	}),

	update: authenticatedProcedure.input(ChampionUpdateSchema).mutation(({ input }) => {
		const CHAMPIONS_FILE_PATH = path.join(
			process.cwd(),
			"src",
			"constants",
			"champions-db",
			"champions.json",
		);

		// Get current champions
		let champions: TChampion[];
		if (fs.existsSync(CHAMPIONS_FILE_PATH)) {
			try {
				champions = JSON.parse(fs.readFileSync(CHAMPIONS_FILE_PATH).toString());
			} catch (error) {
				champions = CHAMPIONS;
			}
		} else {
			champions = CHAMPIONS;
		}

		// Update champion
		const idx = champions.findIndex((e) => e.fileName === input.championFileName);
		if (idx === -1) {
			throw new Error(`Champion with fileName "${input.championFileName}" not found`);
		}
		// Only update the fields that are provided in input.champion
		champions[idx] = { ...champions[idx], ...input.champion };

		// Save to file
		const dir = path.dirname(CHAMPIONS_FILE_PATH);
		if (!fs.existsSync(dir)) {
			fs.mkdirSync(dir, { recursive: true });
		}
		fs.writeFileSync(CHAMPIONS_FILE_PATH, JSON.stringify(champions, null, 2));

		return champions[idx];
	}),

	delete: authenticatedProcedure.input(ChampionDeleteSchema).mutation(({ input }) => {
		const CHAMPIONS_FILE_PATH = path.join(
			process.cwd(),
			"src",
			"constants",
			"champions-db",
			"champions.json",
		);

		// Get current champions
		let champions: TChampion[];
		if (fs.existsSync(CHAMPIONS_FILE_PATH)) {
			try {
				champions = JSON.parse(fs.readFileSync(CHAMPIONS_FILE_PATH).toString());
			} catch (error) {
				champions = CHAMPIONS;
			}
		} else {
			champions = CHAMPIONS;
		}

		// Find and remove champion
		const champion = champions.find((e) => e.fileName === input.championFileName);
		if (!champion) {
			throw new Error(`Champion with fileName "${input.championFileName}" not found`);
		}
		champions = champions.filter((e) => e.fileName !== input.championFileName);

		// Save to file
		const dir = path.dirname(CHAMPIONS_FILE_PATH);
		if (!fs.existsSync(dir)) {
			fs.mkdirSync(dir, { recursive: true });
		}
		fs.writeFileSync(CHAMPIONS_FILE_PATH, JSON.stringify(champions, null, 2));

		return champion;
	}),

	setAll: authenticatedProcedure.input(ChampionSetSchema).mutation(({ input }) => {
		const CHAMPIONS_FILE_PATH = path.join(
			process.cwd(),
			"src",
			"constants",
			"champions-db",
			"champions.json",
		);

		// Sort champions
		const champions = input.champions.sort((a: TChampion, b: TChampion) =>
			a.name.localeCompare(b.name),
		);

		// Save to file
		const dir = path.dirname(CHAMPIONS_FILE_PATH);
		if (!fs.existsSync(dir)) {
			fs.mkdirSync(dir, { recursive: true });
		}
		fs.writeFileSync(CHAMPIONS_FILE_PATH, JSON.stringify(champions, null, 2));

		return input.champions;
	}),

	addLargeImg: authenticatedProcedure
		.input(ChampionLargeImgSchema)
		.mutation(async ({ input }) => {
			// Download and save large champion image
			const imgUrl = "https://ddragon.leagueoflegends.com/cdn/img/champion/loading/";
			const nameEnd = "_0.jpg";

			const champImg = (
				await axios.get(`${imgUrl}${input.champion}${nameEnd}`, {
					responseType: "arraybuffer",
				})
			).data;

			const buffer = Buffer.from(champImg, "binary");

			const imgPath = path.join(
				process.cwd(),
				"src",
				"constants",
				"champions-db",
				"imgs",
				`${input.champion}${nameEnd}`,
			);

			// Ensure directory exists
			const dir = path.dirname(imgPath);
			if (!fs.existsSync(dir)) {
				fs.mkdirSync(dir, { recursive: true });
			}

			if (!fs.existsSync(imgPath) || input.updateImg) {
				fs.writeFileSync(imgPath, buffer);
			}

			return { success: true };
		}),

	addShortImg: authenticatedProcedure
		.input(ChampionShortImgSchema)
		.mutation(async ({ input }) => {
			// Download and save short champion image
			const imgUrl = `https://ddragon.leagueoflegends.com/cdn/${input.apiVersion}/img/champion/`;
			const nameEnd = ".png";

			const champImg = (
				await axios.get(`${imgUrl}${input.champion}${nameEnd}`, {
					responseType: "arraybuffer",
				})
			).data;

			const buffer = Buffer.from(champImg, "binary");

			const imgPath = path.join(
				process.cwd(),
				"src",
				"constants",
				"champions-db",
				"imgs",
				`${input.champion}${nameEnd}`,
			);

			// Ensure directory exists
			const dir = path.dirname(imgPath);
			if (!fs.existsSync(dir)) {
				fs.mkdirSync(dir, { recursive: true });
			}

			if (!fs.existsSync(imgPath) || input.updateImg) {
				fs.writeFileSync(imgPath, buffer);
			}

			return { success: true };
		}),

	updateFromDataDragon: authenticatedProcedure.mutation(async () => {
		const CHAMPIONS_FILE_PATH = path.join(
			process.cwd(),
			"src",
			"constants",
			"champions-db",
			"champions.json",
		);
		const championFilePath = path.join(process.cwd(), "champions-db", "champion.json");

		if (!fs.existsSync(championFilePath)) {
			throw new Error("champions-db/champion.json file not found");
		}

		const newChampions = JSON.parse(fs.readFileSync(championFilePath).toString()).data;

		// Get current champions
		let oldChampions: any;
		if (fs.existsSync(CHAMPIONS_FILE_PATH)) {
			try {
				oldChampions = JSON.parse(fs.readFileSync(CHAMPIONS_FILE_PATH).toString());
			} catch (error) {
				oldChampions = CHAMPIONS;
			}
		} else {
			oldChampions = CHAMPIONS;
		}

		for (const champ of Object.keys(newChampions)) {
			const champion = oldChampions.find((e: TChampion) => e.fileName === champ);

			if (champion) {
				champion.tags = newChampions[champ].tags;
			} else {
				oldChampions.push({
					name: newChampions[champ].name,
					fileName: champ,
					roles: [],
					tags: newChampions[champ].tags,
				});
			}
		}

		// Sort and save champions
		const sortedChampions = oldChampions.sort((a: any, b: any) => a.name.localeCompare(b.name));

		const dir = path.dirname(CHAMPIONS_FILE_PATH);
		if (!fs.existsSync(dir)) {
			fs.mkdirSync(dir, { recursive: true });
		}
		fs.writeFileSync(CHAMPIONS_FILE_PATH, JSON.stringify(sortedChampions, null, 2));

		return { success: true };
	}),

	updateAll: authenticatedProcedure.mutation(async () => {
		// this mirrors updateChampions which also refreshed icons
		return [] as TChampion[];
	}),
});
