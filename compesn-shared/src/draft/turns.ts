import type { TTurn } from "../types/turn";

export const TURNS: TTurn[] = [
	{ number: 1, team: "blue", type: "ban", typeNumber: 1, configOrder: 1 },
	{ number: 2, team: "red", type: "ban", typeNumber: 1, configOrder: 1 },
	{ number: 3, team: "blue", type: "ban", typeNumber: 2, configOrder: 3 },
	{ number: 4, team: "red", type: "ban", typeNumber: 2, configOrder: 3 },
	{ number: 5, team: "blue", type: "ban", typeNumber: 3, configOrder: 5 },
	{ number: 6, team: "red", type: "ban", typeNumber: 3, configOrder: 5 },
	{ number: 7, team: "blue", type: "pick", typeNumber: 1, configOrder: 2 },
	{ number: 8, team: "red", type: "pick", typeNumber: 1, configOrder: 2 },
	{ number: 9, team: "red", type: "pick", typeNumber: 2, configOrder: 4 },
	{ number: 10, team: "blue", type: "pick", typeNumber: 2, configOrder: 4 },
	{ number: 11, team: "blue", type: "pick", typeNumber: 3, configOrder: 6 },
	{ number: 12, team: "red", type: "pick", typeNumber: 3, configOrder: 6 },
	{ number: 13, team: "red", type: "ban", typeNumber: 4, configOrder: 7 },
	{ number: 14, team: "blue", type: "ban", typeNumber: 4, configOrder: 7 },
	{ number: 15, team: "red", type: "ban", typeNumber: 5, configOrder: 9 },
	{ number: 16, team: "blue", type: "ban", typeNumber: 5, configOrder: 9 },
	{ number: 17, team: "red", type: "pick", typeNumber: 4, configOrder: 8 },
	{ number: 18, team: "blue", type: "pick", typeNumber: 4, configOrder: 8 },
	{ number: 19, team: "blue", type: "pick", typeNumber: 5, configOrder: 10 },
	{ number: 20, team: "red", type: "pick", typeNumber: 5, configOrder: 10 },
];

export const TURNS_SORTED_BY_CONFIG_ORDER: TTurn[] = [...TURNS].sort(
	(turnA, turnB) => turnA.configOrder - turnB.configOrder,
);

export const getNextTurnNumber = (
	currentTurnNumber: number | undefined,
	disabledTurns: number[],
	resetTurn: boolean = false,
) => {
	let turnNumber = currentTurnNumber ? currentTurnNumber + (resetTurn ? 0 : 1) : 1;

	while (disabledTurns.includes(turnNumber)) {
		turnNumber++;
	}

	return turnNumber;
};

export const getPreviousEnabledTurnNumber = (
	currentTurnNumber: number,
	disabledTurns: number[],
) => {
	let previousTurnNumber = currentTurnNumber - 1;

	while (disabledTurns.includes(previousTurnNumber) && previousTurnNumber > 1) {
		previousTurnNumber--;
	}

	return previousTurnNumber;
};
