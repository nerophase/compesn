import assert from "node:assert/strict";
import test from "node:test";
import { deserializeRoomCache, serializeRoomCache } from "@compesn/shared/rooms/cache";
import type { TRoom } from "@compesn/shared/common/schemas/rooms";

const sampleRoom: TRoom = {
	id: "room-1",
	pickType: "DRAFT_MODE",
	draftMode: "standard",
	draftsCount: 1,
	members: [
		{
			socketId: "socket-1",
			userId: "user-1",
			name: "Player One",
			team: "blue",
			isGuest: false,
		},
	],
	drafts: [
		{
			draftIndex: 0,
			tournamentCode: "TOURNEY-1",
			blue: {
				id: "blue-1",
				name: "Blue Team",
				isGuest: false,
				pick: [],
				ban: [],
				ready: true,
			},
			red: {
				id: "red-1",
				name: "Red Team",
				isGuest: false,
				pick: [],
				ban: [],
				ready: true,
			},
			state: "waiting",
			turnStart: 0,
			currentTurnTime: 0,
			canRepeatPreviousTurn: false,
		},
	],
	currentDraft: 0,
	disabledTurns: [3, 4],
	disabledChampions: [],
	time: {
		pick: 45,
		ban: 30,
	},
	tournamentId: 12,
	tournamentCodes: ["TOURNEY-1"],
	createdAt: new Date("2026-04-07T10:00:00.000Z"),
	updatedAt: new Date("2026-04-07T11:00:00.000Z"),
};

test("room cache serialization preserves values and revives timestamps", () => {
	const roundTrip = deserializeRoomCache(serializeRoomCache(sampleRoom));

	assert.equal(roundTrip.id, sampleRoom.id);
	assert.deepEqual(roundTrip.members, sampleRoom.members);
	assert.equal(roundTrip.createdAt.toISOString(), sampleRoom.createdAt.toISOString());
	assert.equal(roundTrip.updatedAt.toISOString(), sampleRoom.updatedAt.toISOString());
});
