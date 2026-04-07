import dotenv from "dotenv";
import { TURNS } from "@compesn/shared/draft/turns";
import { z } from "zod";

dotenv.config();

export const regionToPlatform = {
	BR1: "americas",
	EUN1: "europe",
	EUW1: "europe",
	JP1: "asia",
	KR: "asia",
	LA1: "americas",
	LA2: "americas",
	ME1: "europe",
	NA1: "americas",
	OC1: "americas",
	RU: "europe",
	SG2: "sea",
	TR1: "europe",
	TW2: "sea",
	VN2: "sea",
};

// 1) Declare the shape of your env
const envSchema = z.object({
	APP_PORT: z.coerce.number().default(3000),
	APP_SECRET: z.string().min(32),
	DATABASE_URL: z.string().url(),
	REDIS_URL: z.string().url(),
	ENABLE_CACHE: z
		.string()
		.transform((val) => val.toLocaleLowerCase() === "true")
		.default("true"),
	ROOM_TTL: z.coerce.number().default(3600),
	END_TURN_NUMBER: z
		.string()
		.transform((val) => parseInt(val))
		.default(`${TURNS.length + 1}`),
	ACCESS_TOKEN_EXPIRE_TIME: z.string().default("30d"),
	REFRESH_TOKEN_EXPIRE_TIME: z.string().default("30d"),
	NODEMAILER_EMAIL: z.string().email(),
	NODEMAILER_PW: z.string(),
	RIOT_API_KEY: z.string(),
	PROVIDER_ID: z.string().transform((val) => parseInt(val)),
	GENERATE_TOURNAMENT_CODE: z
		.string()
		.transform((val) => val === "true")
		.default("true"),
	RIOT_CLIENT_ID: z.string(),
	RIOT_CLIENT_SECRET: z.string(),
	RIOT_API_URL: z.string().default("https://americas.api.riotgames.com"),
	DISCORD_CLIENT_ID: z.string(),
	DISCORD_CLIENT_SECRET: z.string(),
	RESEND_KEY: z.string(),
	CHAMPIONS_FILE_PATH: z.string().default("champions.json"),
	CHAMPIONS_IMAGES_PATH: z.string().default("champions-imgs"),
	LOGS_FILE_PATH: z.string().default("compesn.log"),
});

// 2) Parse & validate
const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
	console.error("❌ Invalid .env configuration:", parsed.error.format());
	process.exit(1);
}

// 3) Export a fully‐typed `env` object
export const env = parsed.data;
export type Env = typeof env;
