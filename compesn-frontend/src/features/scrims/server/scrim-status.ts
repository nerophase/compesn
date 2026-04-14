import type { TScrim } from "@compesn/shared/schemas";

export type ScrimStatus = TScrim["status"];

export const VALID_SCRIM_TRANSITIONS: Record<ScrimStatus, ScrimStatus[]> = {
	OPEN: ["CANCELLED"],
	REQUESTED: ["OPEN", "ACCEPTED", "CANCELLED"],
	ACCEPTED: ["CONFIRMED", "CANCELLED"],
	CONFIRMED: ["CANCELLED", "COMPLETED"],
	CANCELLED: [],
	COMPLETED: [],
};

export const isValidScrimTransition = (
	currentStatus: ScrimStatus,
	newStatus: ScrimStatus,
): boolean => VALID_SCRIM_TRANSITIONS[currentStatus]?.includes(newStatus) ?? false;

export const isCreatingTeamOnlyTransition = (newStatus: ScrimStatus): boolean =>
	newStatus === "ACCEPTED" || newStatus === "OPEN";

export const canCancelConfirmedScrim = (startTime: Date, now = Date.now()): boolean => {
	const hoursUntilStart = (startTime.getTime() - now) / (1000 * 60 * 60);
	return hoursUntilStart >= 2;
};

export const getNextOpponentTeamId = (
	newStatus: ScrimStatus,
	currentOpponentTeamId: string | null,
): string | null => (newStatus === "OPEN" ? null : currentOpponentTeamId);
