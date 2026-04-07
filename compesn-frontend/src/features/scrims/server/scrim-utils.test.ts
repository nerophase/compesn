import assert from "node:assert/strict";
import test from "node:test";
import { TRPCError } from "@trpc/server";
import { assertValidRankRange, hasScrimTimeOverlap } from "./scrim-utils";

test("scrim overlap returns true when time windows intersect", () => {
	assert.equal(
		hasScrimTimeOverlap({
			existingStartTime: new Date("2026-04-07T10:00:00.000Z"),
			existingDurationMinutes: 60,
			candidateStartTime: new Date("2026-04-07T10:30:00.000Z"),
			candidateDurationMinutes: 45,
		}),
		true,
	);
});

test("scrim overlap returns false when time windows are separate", () => {
	assert.equal(
		hasScrimTimeOverlap({
			existingStartTime: new Date("2026-04-07T10:00:00.000Z"),
			existingDurationMinutes: 60,
			candidateStartTime: new Date("2026-04-07T11:30:00.000Z"),
			candidateDurationMinutes: 30,
		}),
		false,
	);
});

test("rank validation rejects inverted tier ranges", () => {
	assert.throws(
		() =>
			assertValidRankRange({
				minRankTier: "DIAMOND",
				maxRankTier: "GOLD",
			}),
		(error) =>
			error instanceof TRPCError &&
			error.code === "BAD_REQUEST" &&
			error.message.includes("Minimum rank tier"),
	);
});

test("rank validation rejects inverted divisions within the same tier", () => {
	assert.throws(
		() =>
			assertValidRankRange({
				minRankTier: "EMERALD",
				minRankDivision: "I",
				maxRankTier: "EMERALD",
				maxRankDivision: "III",
			}),
		(error) =>
			error instanceof TRPCError &&
			error.code === "BAD_REQUEST" &&
			error.message.includes("Minimum rank division"),
	);
});

test("rank validation accepts ascending ranges", () => {
	assert.doesNotThrow(() =>
		assertValidRankRange({
			minRankTier: "GOLD",
			minRankDivision: "IV",
			maxRankTier: "PLATINUM",
			maxRankDivision: "II",
		}),
	);
});
