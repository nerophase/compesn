import { env } from "@/environment";
import { TTournamentCodeParameters } from "@compesn/shared/common/types/tournament";
import axios from "axios";
import { Match } from "@compesn/shared/common/types/riot-api";

const getProviderId = async (): Promise<number> => {
	const res = await axios.post(
		`${env.RIOT_API_URL}/lol/tournament/v5/providers`,
		{
			region: "NA",
			url: "https://api.compesn.com/tournament/callback",
		},
		{
			params: {
				api_key: env.RIOT_API_KEY,
			},
		},
	);

	return await res.data;
};

const createTournament = async (providerId: number): Promise<number> => {
	const res = await axios.post(
		`${env.RIOT_API_URL}/lol/tournament/v5/tournaments`,
		{
			providerId,
			name: "COMPESN Tournament",
		},
		{ params: { api_key: env.RIOT_API_KEY } },
	);

	return await res.data;
};

const getTournamentCodes = async (
	tournamentId: number,
	count: number,
	options: TTournamentCodeParameters,
): Promise<string[]> => {
	const res = await axios.post(`${env.RIOT_API_URL}/lol/tournament/v5/codes`, options, {
		params: { api_key: env.RIOT_API_KEY, count, tournamentId },
	});
	return await res.data;
};

const getMatchInfo = async (matchId: string): Promise<Match> => {
	const res = await axios.get(`${env.RIOT_API_URL}/lol/match/v5/matches/${matchId}`, {
		params: { api_key: env.RIOT_API_KEY },
	});

	return await res.data;
};

export const riotAPIService = {
	getProviderId,
	createTournament,
	getTournamentCodes,
	getMatchInfo,
};
