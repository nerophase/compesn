import { TRPCError } from "@trpc/server";
import { AxiosError } from "axios";
import { RiotAPICacheService } from "@/lib/riot-api-cache";
import { getCachedChampionData } from "@/lib/champion-cache";
import { authenticatedProcedure, createTRPCRouter } from "../../init";
import {
	PlayerLookupInputSchema,
	PlayerLookupResponseSchema,
	PlayerRecentMatchesInputSchema,
	RecentMatchesResponseSchema,
} from "./players.schema";

const INITIAL_MATCH_COUNT = 10;

const QUEUE_LABELS: Record<number, string> = {
	0: "Custom Game",
	400: "Normal Draft",
	420: "Ranked Solo/Duo",
	430: "Normal Blind",
	440: "Ranked Flex",
	450: "ARAM",
	700: "Clash",
	830: "Intro Bots",
	840: "Beginner Bots",
	850: "Intermediate Bots",
	900: "ARURF",
	1020: "One for All",
	1300: "Nexus Blitz",
	1400: "Ultimate Spellbook",
	1700: "Arena",
	1900: "Pick URF",
};

const RANKED_QUEUE_LABELS: Record<string, string> = {
	RANKED_SOLO_5x5: "Ranked Solo/Duo",
	RANKED_FLEX_SR: "Ranked Flex",
	RANKED_TFT: "TFT Ranked",
};

const getNumber = (value: unknown, fallback = 0) =>
	typeof value === "number" && Number.isFinite(value) ? value : fallback;

const getString = (value: unknown, fallback = "") => (typeof value === "string" ? value : fallback);

const getBoolean = (value: unknown, fallback = false) =>
	typeof value === "boolean" ? value : fallback;

const logValidationIssues = (
	label: string,
	issues: Array<{ path: Array<string | number>; message: string }>,
) => {
	console.error(
		`${label} output validation issues:`,
		issues.map((issue) => ({
			path: issue.path.join("."),
			message: issue.message,
		})),
	);
};

const normalizeDate = (timestamp: unknown) => {
	const value = getNumber(timestamp);
	return value > 0 ? new Date(value) : null;
};

const getProfileIconUrl = (version: string, profileIconId: number) =>
	`https://ddragon.leagueoflegends.com/cdn/${version}/img/profileicon/${profileIconId}.png`;

const getChampionImageUrl = (version: string, imageFileName: string) =>
	`https://ddragon.leagueoflegends.com/cdn/${version}/img/champion/${imageFileName}`;

const getChampionById = (
	champions: Awaited<ReturnType<typeof getCachedChampionData>>,
	championId: number,
) => Object.values(champions.data).find((champion) => Number(champion.key) === championId) ?? null;

const getRole = (participant: {
	teamPosition: string;
	individualPosition: string;
	lane: string;
	role: string;
}) =>
	participant.teamPosition ||
	participant.individualPosition ||
	participant.lane ||
	participant.role ||
	"UNKNOWN";

const normalizeRankedQueue = (entry: {
	queueType?: string;
	tier?: string;
	rank?: string;
	leaguePoints?: number;
	wins?: number;
	losses?: number;
	hotStreak?: boolean;
	veteran?: boolean;
	freshBlood?: boolean;
	inactive?: boolean;
}) => {
	const wins = getNumber(entry.wins);
	const losses = getNumber(entry.losses);
	const totalGames = wins + losses;
	const queueType = getString(entry.queueType, "UNKNOWN");

	return {
		queueType,
		queueLabel: RANKED_QUEUE_LABELS[queueType] || queueType.replaceAll("_", " "),
		tier: getString(entry.tier, "UNRANKED"),
		rank: getString(entry.rank, ""),
		leaguePoints: getNumber(entry.leaguePoints),
		wins,
		losses,
		winRate: totalGames > 0 ? Math.round((wins / totalGames) * 10000) / 100 : 0,
		hotStreak: getBoolean(entry.hotStreak),
		veteran: getBoolean(entry.veteran),
		freshBlood: getBoolean(entry.freshBlood),
		inactive: getBoolean(entry.inactive),
	};
};

const normalizeMastery = (
	mastery: {
		championId?: number;
		championLevel?: number;
		championPoints?: number;
		lastPlayTime?: number;
		championPointsSinceLastLevel?: number;
		championPointsUntilNextLevel?: number;
		chestGranted?: boolean;
		tokensEarned?: number;
	},
	champions: Awaited<ReturnType<typeof getCachedChampionData>>,
) => {
	const championId = getNumber(mastery.championId);
	const champion = getChampionById(champions, championId);

	return {
		championId,
		championName: champion?.name || `Champion ${championId}`,
		championImageUrl: champion
			? getChampionImageUrl(champions.version, champion.image.full)
			: getChampionImageUrl(champions.version, "Aatrox.png"),
		championLevel: getNumber(mastery.championLevel),
		championPoints: getNumber(mastery.championPoints),
		lastPlayTime: normalizeDate(mastery.lastPlayTime),
		championPointsSinceLastLevel: getNumber(mastery.championPointsSinceLastLevel),
		championPointsUntilNextLevel: getNumber(mastery.championPointsUntilNextLevel),
		chestGranted: getBoolean(mastery.chestGranted),
		tokensEarned: getNumber(mastery.tokensEarned),
	};
};

const normalizeMatch = (
	matchId: string,
	match: Awaited<ReturnType<RiotAPICacheService["getMatchDetailsByMatchId"]>>,
	puuid: string,
	champions: Awaited<ReturnType<typeof getCachedChampionData>>,
) => {
	const participant = match.info.participants.find((player) => player.puuid === puuid);

	if (!participant) {
		return null;
	}

	const championId = getNumber(participant.championId);
	const championName = getString(participant.championName, `Champion ${championId}`);
	const champion = getChampionById(champions, championId);
	const creepScore =
		getNumber(participant.totalMinionsKilled) + getNumber(participant.neutralMinionsKilled);
	const kills = getNumber(participant.kills);
	const deaths = getNumber(participant.deaths);
	const assists = getNumber(participant.assists);
	const kda = deaths > 0 ? (kills + assists) / deaths : kills + assists;

	return {
		matchId,
		queueId: getNumber(match.info.queueId),
		queueLabel:
			QUEUE_LABELS[getNumber(match.info.queueId)] || `Queue ${getNumber(match.info.queueId)}`,
		gameCreation: normalizeDate(match.info.gameCreation),
		gameDuration: getNumber(match.info.gameDuration),
		gameVersion: getString(match.info.gameVersion, "Unknown"),
		championId,
		championName: champion?.name || championName,
		championImageUrl: champion
			? getChampionImageUrl(champions.version, champion.image.full)
			: getChampionImageUrl(champions.version, `${championName || "Aatrox"}.png`),
		role: getRole(participant),
		kills,
		deaths,
		assists,
		kda: Math.round(kda * 100) / 100,
		win: getBoolean(participant.win),
		creepScore,
		goldEarned: getNumber(participant.goldEarned),
		damageToChampions: getNumber(participant.totalDamageDealtToChampions),
		visionScore: getNumber(participant.visionScore),
	};
};

const getRecentMatches = async ({
	puuid,
	region,
	start,
	count,
	riotAPI,
	champions,
}: {
	puuid: string;
	region: Parameters<RiotAPICacheService["getMatchIdsByPuuid"]>[1];
	start: number;
	count: number;
	riotAPI: RiotAPICacheService;
	champions: Awaited<ReturnType<typeof getCachedChampionData>>;
}) => {
	const matchIds = await riotAPI.getMatchIdsByPuuid(puuid, region, count, start);
	const matchResults = await Promise.all(
		matchIds.map(async (matchId) => {
			try {
				const match = await riotAPI.getMatchDetailsByMatchId(matchId, region);
				return normalizeMatch(matchId, match, puuid, champions);
			} catch (error) {
				console.error(`Error normalizing player match ${matchId}:`, error);
				return null;
			}
		}),
	);
	const matches = matchResults.filter(
		(match): match is NonNullable<typeof match> => match !== null,
	);

	return {
		matches,
		nextStart: start + matchIds.length,
		hasMore: matchIds.length === count,
	};
};

const getAggregate = (matches: Awaited<ReturnType<typeof getRecentMatches>>["matches"]) => {
	const totalRecentGames = matches.length;

	if (totalRecentGames === 0) {
		return {
			totalRecentGames: 0,
			wins: 0,
			winRate: 0,
			averageKda: 0,
		};
	}

	const wins = matches.filter((match) => match.win).length;
	const averageKda = matches.reduce((total, match) => total + match.kda, 0) / totalRecentGames;

	return {
		totalRecentGames,
		wins,
		winRate: Math.round((wins / totalRecentGames) * 10000) / 100,
		averageKda: Math.round(averageKda * 100) / 100,
	};
};

const handleRiotError = (error: unknown): never => {
	if (error instanceof TRPCError) {
		throw error;
	}

	if (error instanceof AxiosError && error.response?.status === 429) {
		throw new TRPCError({
			code: "TOO_MANY_REQUESTS",
			message: "Riot API rate limit reached. Try again shortly.",
		});
	}

	if (error instanceof AxiosError && error.response?.status === 404) {
		throw new TRPCError({
			code: "NOT_FOUND",
			message: "Player not found.",
		});
	}

	console.error("Player Riot lookup failed:", error);
	throw new TRPCError({
		code: "INTERNAL_SERVER_ERROR",
		message: "Unable to load this Riot profile right now.",
	});
};

export const playersRouter = createTRPCRouter({
	lookupByRiotId: authenticatedProcedure
		.input(PlayerLookupInputSchema)
		.output(PlayerLookupResponseSchema)
		.query(async ({ input }) => {
			const riotAPI = new RiotAPICacheService();

			try {
				const account = await riotAPI.getAccountByRiotId(
					input.gameName,
					input.tagLine,
					input.region,
				);

				if (!account) {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "Player not found.",
					});
				}

				const championsPromise = getCachedChampionData();
				const summonerPromise = riotAPI.getSummonerByPuuid(account.puuid, input.region);
				const masteriesPromise = riotAPI.getChampionMasteriesByPuuid(
					account.puuid,
					input.region,
				);

				const [champions, summoner, masteries] = await Promise.all([
					championsPromise,
					summonerPromise,
					masteriesPromise,
				]);

				if (!summoner) {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "Player profile not found for this region.",
					});
				}

				const [rankedQueues, recentMatches] = await Promise.all([
					riotAPI.getLeagueEntriesByPuuid(account.puuid, input.region),
					getRecentMatches({
						puuid: account.puuid,
						region: input.region,
						start: 0,
						count: INITIAL_MATCH_COUNT,
						riotAPI,
						champions,
					}),
				]);

				const profile = {
					account: {
						puuid: getString(account.puuid),
						gameName: getString(account.gameName, input.gameName),
						tagLine: getString(account.tagLine, input.tagLine),
						region: input.region,
					},
					summoner: {
						id: summoner.id ? getString(summoner.id) : null,
						accountId: summoner.accountId ? getString(summoner.accountId) : null,
						profileIconId: getNumber(summoner.profileIconId),
						profileIconUrl: getProfileIconUrl(
							champions.version,
							getNumber(summoner.profileIconId),
						),
						summonerLevel: getNumber(summoner.summonerLevel),
						revisionDate: normalizeDate(summoner.revisionDate),
					},
					rankedQueues: rankedQueues.map(normalizeRankedQueue),
					topChampionMasteries: masteries
						.slice(0, 8)
						.map((mastery) => normalizeMastery(mastery, champions)),
					aggregate: getAggregate(recentMatches.matches),
					recentMatches,
					ddragonVersion: champions.version,
				};

				const parsedProfile = PlayerLookupResponseSchema.safeParse(profile);
				if (!parsedProfile.success) {
					logValidationIssues("Player lookup", parsedProfile.error.issues);
				}

				return profile;
			} catch (error) {
				return handleRiotError(error);
			}
		}),

	getRecentMatches: authenticatedProcedure
		.input(PlayerRecentMatchesInputSchema)
		.output(RecentMatchesResponseSchema)
		.query(async ({ input }) => {
			const riotAPI = new RiotAPICacheService();

			try {
				const champions = await getCachedChampionData();
				const recentMatches = await getRecentMatches({
					puuid: input.puuid,
					region: input.region,
					start: input.start,
					count: input.count,
					riotAPI,
					champions,
				});

				const parsedMatches = RecentMatchesResponseSchema.safeParse(recentMatches);
				if (!parsedMatches.success) {
					logValidationIssues("Recent matches", parsedMatches.error.issues);
				}

				return recentMatches;
			} catch (error) {
				return handleRiotError(error);
			}
		}),
});
