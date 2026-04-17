import { TRPCError } from "@trpc/server";
import { AxiosError } from "axios";
import { REGIONS } from "@/constants/regions";
import { RiotAPICacheService } from "@/lib/riot-api-cache";
import { authenticatedProcedure, createTRPCRouter } from "../../init";
import { TRegion } from "../teams/teams.schema";
import {
	MatchLookupInputSchema,
	MatchLookupResponseSchema,
} from "./matches.schema";
import type { Objective, Team } from "@compesn/shared/types/riot-api";

const MATCH_ID_PREFIX_PATTERN = /^([A-Z0-9]+)_\d+$/;

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

const emptyObjective = (): Objective => ({
	first: false,
	kills: 0,
});

const normalizeDate = (timestamp: number) => (timestamp > 0 ? new Date(timestamp) : null);

const getRegionByMatchId = (matchId: string): TRegion => {
	const prefix = matchId.match(MATCH_ID_PREFIX_PATTERN)?.[1];

	if (!prefix) {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: "Use a Riot match ID like NA1_1234567890.",
		});
	}

	const region = REGIONS.find((candidate) => candidate.code === prefix);

	if (!region) {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: `Unsupported Riot platform prefix "${prefix}".`,
		});
	}

	return region.value as TRegion;
};

const getBanChampionId = (ban: unknown): number | null => {
	if (!ban || typeof ban !== "object" || !("championId" in ban)) {
		return null;
	}

	const championId = (ban as { championId: unknown }).championId;
	return typeof championId === "number" && championId > 0 ? championId : null;
};

const getBanPickTurn = (ban: unknown): number | null => {
	if (!ban || typeof ban !== "object" || !("pickTurn" in ban)) {
		return null;
	}

	const pickTurn = (ban as { pickTurn: unknown }).pickTurn;
	return typeof pickTurn === "number" ? pickTurn : null;
};

const getTeamSide = (teamId: number): "blue" | "red" => (teamId === 100 ? "blue" : "red");

const getPlayerRole = (participant: {
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

const getDisplayName = (participant: {
	riotIdGameName: string;
	riotIdTagline: string;
	summonerName: string;
}) => {
	if (participant.riotIdGameName && participant.riotIdTagline) {
		return `${participant.riotIdGameName}#${participant.riotIdTagline}`;
	}

	return participant.summonerName || "Unknown Summoner";
};

const normalizePlayer = (participant: {
	puuid: string;
	participantId: number;
	riotIdGameName: string;
	riotIdTagline: string;
	summonerName: string;
	championId: number;
	championName: string;
	teamId: number;
	teamPosition: string;
	individualPosition: string;
	lane: string;
	role: string;
	kills: number;
	deaths: number;
	assists: number;
	totalMinionsKilled: number;
	neutralMinionsKilled: number;
	goldEarned: number;
	totalDamageDealtToChampions: number;
	visionScore: number;
	win: boolean;
}) => {
	const creepScore = participant.totalMinionsKilled + participant.neutralMinionsKilled;
	const kda =
		participant.deaths > 0
			? (participant.kills + participant.assists) / participant.deaths
			: participant.kills + participant.assists;

	return {
		puuid: participant.puuid,
		participantId: participant.participantId,
		displayName: getDisplayName(participant),
		championId: participant.championId,
		championName: participant.championName,
		role: getPlayerRole(participant),
		side: getTeamSide(participant.teamId),
		kills: participant.kills,
		deaths: participant.deaths,
		assists: participant.assists,
		kda: Math.round(kda * 100) / 100,
		creepScore,
		goldEarned: participant.goldEarned,
		damageToChampions: participant.totalDamageDealtToChampions,
		visionScore: participant.visionScore,
		win: participant.win,
	};
};

const normalizeTeam = (team: Team, players: ReturnType<typeof normalizePlayer>[]) => {
	const side = getTeamSide(team.teamId);
	const teamPlayers = players.filter((player) => player.side === side);

	return {
		side,
		teamId: team.teamId,
		win: team.win,
		totalKills: team.objectives.champion.kills,
		participantCount: teamPlayers.length,
		bans: team.bans
			.map((ban) => {
				const championId = getBanChampionId(ban);

				if (!championId) {
					return null;
				}

				return {
					championId,
					pickTurn: getBanPickTurn(ban),
				};
			})
			.filter((ban): ban is { championId: number; pickTurn: number | null } => ban !== null),
		objectives: {
			baron: team.objectives.baron,
			champion: team.objectives.champion,
			dragon: team.objectives.dragon,
			inhibitor: team.objectives.inhibitor,
			riftHerald: team.objectives.riftHerald,
			tower: team.objectives.tower,
			atakhan: team.objectives.atakhan ?? null,
		},
		players: teamPlayers,
	};
};

export const matchesRouter = createTRPCRouter({
	getByMatchId: authenticatedProcedure
		.input(MatchLookupInputSchema)
		.output(MatchLookupResponseSchema)
		.query(async ({ input }) => {
			const { matchId } = input;
			const region = getRegionByMatchId(matchId);
			const riotAPI = new RiotAPICacheService();

			try {
				const match = await riotAPI.getMatchDetailsByMatchId(matchId, region);
				const players = match.info.participants.map(normalizePlayer);
				const winningTeam = match.info.teams.find((team) => team.win);

				return {
					matchId: match.metadata.matchId,
					gameId: match.info.gameId,
					platformId: match.info.platformId,
					region,
					queueId: match.info.queueId,
					queueLabel: QUEUE_LABELS[match.info.queueId] || `Queue ${match.info.queueId}`,
					gameMode: match.info.gameMode,
					gameType: match.info.gameType,
					gameVersion: match.info.gameVersion,
					gameCreation: normalizeDate(match.info.gameCreation),
					gameStartTimestamp: normalizeDate(match.info.gameStartTimestamp),
					gameEndTimestamp: normalizeDate(match.info.gameEndTimestamp),
					gameDuration: match.info.gameDuration,
					tournamentCode: match.info.tournamentCode || null,
					winningSide: winningTeam ? getTeamSide(winningTeam.teamId) : null,
					teams: match.info.teams.map((team) =>
						normalizeTeam(
							{
								...team,
								objectives: {
									...team.objectives,
									baron: team.objectives.baron ?? emptyObjective(),
									champion: team.objectives.champion ?? emptyObjective(),
									dragon: team.objectives.dragon ?? emptyObjective(),
									inhibitor: team.objectives.inhibitor ?? emptyObjective(),
									riftHerald: team.objectives.riftHerald ?? emptyObjective(),
									tower: team.objectives.tower ?? emptyObjective(),
								},
							},
							players,
						),
					),
				};
			} catch (error) {
				if (error instanceof TRPCError) {
					throw error;
				}

				if (error instanceof Error && error.message === "Match not found") {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "Match not found or no longer available.",
					});
				}

				if (error instanceof AxiosError && error.response?.status === 429) {
					throw new TRPCError({
						code: "TOO_MANY_REQUESTS",
						message: "Riot API rate limit reached. Try again shortly.",
					});
				}

				console.error("Error fetching Riot match result:", error);
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Unable to fetch this match from Riot right now.",
				});
			}
		}),
});
