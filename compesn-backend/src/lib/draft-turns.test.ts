import assert from "node:assert/strict";
import test from "node:test";
import {
	getNextTurnNumber,
	getPreviousEnabledTurnNumber,
} from "@compesn/shared/draft/turns";

test("next turn starts at turn one when no turn has been played yet", () => {
	assert.equal(getNextTurnNumber(undefined, []), 1);
});

test("next turn skips disabled turn numbers", () => {
	assert.equal(getNextTurnNumber(2, [3, 4]), 5);
});

test("reset turn keeps the current turn number before applying disabled-turn skips", () => {
	assert.equal(getNextTurnNumber(5, [5, 6], true), 7);
});

test("repeat previous turn finds the last enabled turn", () => {
	assert.equal(getPreviousEnabledTurnNumber(10, [8, 9]), 7);
	assert.equal(getPreviousEnabledTurnNumber(3, [2]), 1);
});
