import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
	server: {
		NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
		VERCEL_URL: z.string().optional(),
		AUTH_SECRET: z.string(),
		AUTH_URL: z.string().url(),
		AUTH_DISCORD_SECRET: z.string(),
		AUTH_RIOT_SECRET: z.string(),
		DATABASE_URL: z.string().url(),
		REDIS_URL: z.string().url(),
		ENABLE_CACHE: z
			.string()
			.transform((val) => val.toLocaleLowerCase() === "true")
			.default("true"),
		ENABLE_AUTH_BYPASS: z
			.string()
			.transform((val) => val.toLocaleLowerCase() === "true")
			.default("false"),
		AUTH_BYPASS_IDENTIFIER: z.string().optional(),
		RESEND_KEY: z.string(),
		RIOT_API_KEY: z.string(),
		ROOM_TTL: z
			.string()
			.transform((val) => parseInt(val))
			.default("3600"),
	},
	client: {
		NEXT_PUBLIC_BASE_URL: z.string().url(),
		NEXT_PUBLIC_SERVER_URL: z.string().url(),
		NEXT_PUBLIC_AUTH_DISCORD_ID: z.string(),
		NEXT_PUBLIC_AUTH_RIOT_ID: z.string(),
	},
	runtimeEnv: {
		NODE_ENV: process.env.NODE_ENV,
		VERCEL_URL: process.env.VERCEL_URL,
		AUTH_SECRET: process.env.AUTH_SECRET,
		AUTH_URL: process.env.AUTH_URL,
		AUTH_DISCORD_SECRET: process.env.AUTH_DISCORD_SECRET,
		AUTH_RIOT_SECRET: process.env.AUTH_RIOT_SECRET,
		DATABASE_URL: process.env.DATABASE_URL,
		REDIS_URL: process.env.REDIS_URL,
		ENABLE_CACHE: process.env.ENABLE_CACHE,
		ENABLE_AUTH_BYPASS: process.env.ENABLE_AUTH_BYPASS,
		AUTH_BYPASS_IDENTIFIER: process.env.AUTH_BYPASS_IDENTIFIER,
		RESEND_KEY: process.env.RESEND_KEY,
		RIOT_API_KEY: process.env.RIOT_API_KEY,
		ROOM_TTL: process.env.ROOM_TTL,
		NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL,
		NEXT_PUBLIC_SERVER_URL: process.env.NEXT_PUBLIC_SERVER_URL,
		NEXT_PUBLIC_AUTH_DISCORD_ID: process.env.NEXT_PUBLIC_AUTH_DISCORD_ID,
		NEXT_PUBLIC_AUTH_RIOT_ID: process.env.NEXT_PUBLIC_AUTH_RIOT_ID,
	},
});

export const ROUTES = {
	client: {
		authLogin: "/auth/login",
		authSignUp: "/auth/signup",
		authError: "/auth/error",
		forgotPassword: "/auth/forgotPassword",
		resetPassword: "/auth/resetPassword",
		profile: "/profile",
		teams: "/teams",
		scrims: "/scrims",
		scrimsQueue: "/scrims/queue",
		messages: "/messages",
		accounts: "/accounts",
		accountLink: "/account/link",
		adminChampions: "/admin/champions",
		gameResult: "/game-result",
		playerSearch: "/player-search",
		confirmJoinTeam: "/manageTeams/confirmJoinTeam",
		home: "/",
		termsOfService: "/terms-of-service",
		privacyNotice: "/privacy-notice",
		draftHistory: "/draft-history",
		settings: "/settings",
	},
	serverApi: {
		login: "/api/auth/signin",
		authenticatedUser: "/api/auth/user",
	},
	discord: {
		authorize: "https://discord.com/api/oauth2/authorize",
		userInfo: "https://discord.com/api/users/@me",
	},
	riot: {
		issuer: "https://auth.riotgames.com",
		jwks: "https://auth.riotgames.com/jwks.json",
		authorize: "https://auth.riotgames.com/authorize",
		token: "https://auth.riotgames.com/token",
		userInfo: "https://americas.api.riotgames.com/riot/account/v1/accounts/me",
	},
};
