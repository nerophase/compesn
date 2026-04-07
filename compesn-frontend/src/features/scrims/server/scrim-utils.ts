import { TRPCError } from "@trpc/server";
import { getRankDivisionValue, getRankTierValue } from "@/trpc/routers/scrims/scrims.schema";

type RankRangeInput = {
	minRankTier?: string;
	minRankDivision?: string;
	maxRankTier?: string;
	maxRankDivision?: string;
};

export const assertValidRankRange = (input: RankRangeInput) => {
	if (!input.minRankTier || !input.maxRankTier) {
		return;
	}

	const minTierValue = getRankTierValue(input.minRankTier);
	const maxTierValue = getRankTierValue(input.maxRankTier);

	if (minTierValue > maxTierValue) {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: "Minimum rank tier cannot be higher than maximum rank tier",
		});
	}

	if (
		minTierValue === maxTierValue &&
		input.minRankDivision &&
		input.maxRankDivision
	) {
		const minDivisionValue = getRankDivisionValue(input.minRankDivision);
		const maxDivisionValue = getRankDivisionValue(input.maxRankDivision);

		if (minDivisionValue > maxDivisionValue) {
			throw new TRPCError({
				code: "BAD_REQUEST",
				message: "Minimum rank division cannot be higher than maximum rank division",
			});
		}
	}
};

export const getScrimEndTime = (startTime: Date, durationMinutes: number) =>
	new Date(startTime.getTime() + durationMinutes * 60000);

export const hasScrimTimeOverlap = ({
	candidateDurationMinutes,
	candidateStartTime,
	existingDurationMinutes,
	existingStartTime,
}: {
	existingStartTime: Date;
	existingDurationMinutes: number;
	candidateStartTime: Date;
	candidateDurationMinutes: number;
}) => {
	const existingEndTime = getScrimEndTime(existingStartTime, existingDurationMinutes);
	const candidateEndTime = getScrimEndTime(candidateStartTime, candidateDurationMinutes);

	return candidateStartTime <= existingEndTime && existingStartTime <= candidateEndTime;
};
