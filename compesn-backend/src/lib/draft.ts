import { Server } from "socket.io";
import { roomService } from "@/services/room";
import { getCurrentChampion, removeChampion } from "@/utils/champions";
import { TTeamColor } from "@compesn/shared/common/types/team-color";
import { TDraft } from "@compesn/shared/common/types/draft";
import { TRoom } from "@compesn/shared/common/schemas/rooms";
import { TChampion } from "@compesn/shared/common/types/champion";
import {
	getNextTurnNumber,
	getPreviousEnabledTurnNumber,
	TURNS,
} from "@compesn/shared/draft/turns";
import { env } from "@/environment";
import { draftRoomChannel } from "@/utils/socket-rooms";

export const timeouts: { [key: string]: NodeJS.Timeout } = {};

export const setTurnTimer = (draft: TDraft, roomId: string, io: Server) => {
	if (draft.currentTurnTime > 0) {
		const timeout = setTimeout(
			async () => {
				delete timeouts[roomId];

				const newRoom = await roomService.getRoomById(roomId);
				if (!newRoom) return;

				const currentDraft = newRoom.drafts[newRoom.currentDraft];
				const currentChampion = getCurrentChampion(currentDraft, currentDraft.turn);

				if (currentDraft.turn?.number !== draft.turn?.number) return;

				if (!currentChampion) {
					currentDraft.state = "time-over";
					await roomService.updateRoom(roomId, newRoom);

					io.to(draftRoomChannel(roomId)).emit("draft:time-over", currentDraft.turn?.team);
					io.to(draftRoomChannel(roomId)).emit("draft:update", {
						draft: currentDraft,
						draftIdx: newRoom.currentDraft,
					});
				} else {
					nextTurn(newRoom, io);
				}
			},
			draft.currentTurnTime * 1000 + 3000,
		); // +3000: Hidden Timer Feature (3 seconds)

		timeouts[roomId] = timeout;

		io.to(draftRoomChannel(roomId)).emit("draft:countdown", {
			countdown: draft.currentTurnTime + 3,
		});
	}
};

export const nextTurn = async (
	room: TRoom,
	io: Server,
	resetTurn: boolean = false,
	repeatPreviousTurn: boolean = false,
) => {
	const currentDraft = room.drafts[room.currentDraft];
	const roomId = room.id; // setting room._id as WS sender (io.to) doesn't work
	// clear previous turn timeout
	if (timeouts[roomId]) {
		clearTimeout(timeouts[roomId]);
	}
	delete timeouts[roomId];
	const turnNumber = getNextTurnNumber(
		currentDraft.turn?.number,
		room.disabledTurns,
		resetTurn,
	);

	if (!repeatPreviousTurn && turnNumber > 1) currentDraft.canRepeatPreviousTurn = true;

	currentDraft.turn = TURNS[turnNumber - 1];

	if (turnNumber === env.END_TURN_NUMBER) {
		return terminateDraft(room, io);
	}

	currentDraft.currentTurnTime = room.time[currentDraft.turn?.type];
	currentDraft.turnStart = Date.now();

	await roomService.updateRoom(roomId, room);

	io.to(draftRoomChannel(roomId)).emit("draft:update", {
		draft: currentDraft,
		draftIdx: room.currentDraft,
	});

	setTurnTimer(currentDraft, roomId, io);
};

export const noBan = async (room: TRoom, io: Server) => {
	const currentDraft = room.drafts[room.currentDraft];
	const turn = currentDraft.turn;

	if (turn) {
		currentDraft[turn.team].ban[turn.typeNumber - 1] = null;
		await nextTurn(room, io);
	}
};

export const resetTurn = async (room: TRoom, io: Server) => {
	const roomId = room.id;
	const currentDraft = room.drafts[room.currentDraft];
	removeChampion(currentDraft, currentDraft.turn);
	currentDraft.state = "ongoing";
	nextTurn(room, io, true);
	io.to(draftRoomChannel(roomId)).emit("draft:reset-turn");
};

export const resetDraft = async (room: TRoom, io: Server) => {
	const roomId = room.id;
	const currentDraft = room.drafts[room.currentDraft];
	currentDraft.turnStart = 0;
	currentDraft.turn = undefined;
	currentDraft.state = "waiting";

	// Reset Blue Team
	currentDraft.blue.ban = [];
	currentDraft.blue.pick = [];
	currentDraft.blue.ready = false;

	// Reset Red Team
	currentDraft.red.ban = [];
	currentDraft.red.pick = [];
	currentDraft.red.ready = false;

	await roomService.updateRoom(roomId, room);

	io.to(draftRoomChannel(roomId)).emit("draft:update", {
		draft: currentDraft,
		draftIdx: room.currentDraft,
	});
	io.to(draftRoomChannel(roomId)).emit("draft:reset-draft");
};

export const terminateDraft = async (room: TRoom, io: Server) => {
	const roomId = room.id;
	const currentDraft = room.drafts[room.currentDraft];
	currentDraft.state = "finished";
	currentDraft.turn = undefined;

	await roomService.updateRoom(roomId, room);

	if (room.currentDraft + 1 === room.draftsCount) {
		io.to(draftRoomChannel(roomId)).emit("chat:message", {
			name: "COMPESN",
			team: undefined,
			all: true,
			text: "Draft Session is Finished!",
		});
	}
	io.to(draftRoomChannel(roomId)).emit("draft:update", {
		draft: currentDraft,
		draftIdx: room.currentDraft,
	});
	io.to(draftRoomChannel(roomId)).emit(
		"draft:terminate-draft",
		room.currentDraft + 1 < room.draftsCount,
	);

	// TODO: FIX INSERT DRAFT HISTORY

	// const draftHistory = (
	// 	await db
	// 		.insert(draftsHistory)
	// 		.values({
	// 			roomId: roomId,
	// 			// members: room.members,
	// 			blue: currentDraft.blue,
	// 			red: currentDraft.red,
	// 			tournamentCode: currentDraft.tournamentCode,
	// 			draftIndex: room.currentDraft,
	// 		})
	// 		.returning()
	// )[0];

	// const roomMembersInsertPromises = room.members.map((member) => {
	// 	if (member.team)
	// 		return db.insert(draftMembers).values({
	// 			draftHistoryId: draftHistory.id,
	// 			userId: member.userId,
	// 			name: member.name,
	// 			team: member.team,
	// 			isGuest: member.isGuest,
	// 		});
	// });

	// await Promise.all(roomMembersInsertPromises);

	// if (room.currentDraft + 1 < room.draftsCount) {
	// 	teamWins(room, "red", io);
	// }
};

export const requestedRepeatPreviousTurn = async (room: TRoom, team: TTeamColor, io: Server) => {
	const roomId = room.id;
	const currentDraft = room.drafts[room.currentDraft];
	currentDraft.state = "requested-repeat-prev-turn";

	if (currentDraft.currentTurnTime > 0) {
		const elapsedTime = (Date.now() - currentDraft.turnStart) / 1000; // removed math.trunc
		currentDraft.currentTurnTime = currentDraft.currentTurnTime - elapsedTime;
	}

	if (timeouts[roomId]) {
		clearTimeout(timeouts[roomId]);
	}
	delete timeouts[roomId];

	await roomService.updateRoom(roomId, room);

	io.to(draftRoomChannel(roomId)).emit("draft:requested-repeat-previous-turn", team);
	io.to(draftRoomChannel(roomId)).emit("draft:update", {
		draft: currentDraft,
		draftIdx: room.currentDraft,
	});
};

export const repeatPreviousTurn = async (room: TRoom, io: Server) => {
	const roomId = room.id;
	const currentDraft = room.drafts[room.currentDraft];
	if (currentDraft.turn?.number) {
		const prevTurn = TURNS[
			getPreviousEnabledTurnNumber(currentDraft.turn.number, room.disabledTurns) - 1
		];
		currentDraft.canRepeatPreviousTurn = false;
		currentDraft.state = "ongoing";

		removeChampion(currentDraft, prevTurn);
		removeChampion(currentDraft, currentDraft.turn);

		currentDraft.turn = prevTurn;

		nextTurn(room, io, true, true);
		io.to(draftRoomChannel(roomId)).emit("draft:update", {
			draft: currentDraft,
			draftIdx: room.currentDraft,
		});
		io.to(draftRoomChannel(roomId)).emit("draft:repeat-previous-turn");
	}
};

export const declineRepeatPreviousTurn = async (room: TRoom, io: Server) => {
	const roomId = room.id;

	setTurnTimer(room.drafts[room.currentDraft], roomId, io);

	room.drafts[room.currentDraft].state = "ongoing";
	room.drafts[room.currentDraft].turnStart = Date.now();

	await roomService.updateRoom(roomId, room);

	io.to(draftRoomChannel(roomId)).emit("draft:repeat-previous-turn");
	io.to(draftRoomChannel(roomId)).emit("draft:update", {
		draft: room.drafts[room.currentDraft],
		draftIdx: room.currentDraft,
	});
};

export const nextDraft = async (room: TRoom, swapTeams: boolean, io: Server) => {
	const roomId = room.id;

	if (!(room.currentDraft + 1 < room.draftsCount)) return;

	const currentDraft = room.drafts[room.currentDraft];

	const blueTeam = currentDraft.blue;
	const redTeam = currentDraft.red;

	if (swapTeams) {
		room.members.forEach((member: TRoom["members"][number]) => {
			member.team =
				member.team === "blue" ? "red" : member.team === "red" ? "blue" : undefined;
		});
	}

	if (room.draftMode === "fearless") {
		room.disabledChampions.push(
			...(currentDraft.blue.pick.filter((champ: TChampion | null) =>
				champ !== null ? true : false,
			) as TChampion[]),
			...(currentDraft.red.pick.filter((champ: TChampion | null) =>
				champ !== null ? true : false,
			) as TChampion[]),
		);
	}

	room.currentDraft = room.currentDraft + 1;

	const newDraft: TDraft = {
		blue: {
			id: !swapTeams ? blueTeam.id : redTeam.id,
			name: !swapTeams ? blueTeam.name : redTeam.name,
			isGuest: !swapTeams ? blueTeam.isGuest : redTeam.isGuest,
			pick: [],
			ban: [],
			ready: false,
		},
		red: {
			id: swapTeams ? blueTeam.id : redTeam.id,
			name: swapTeams ? blueTeam.name : redTeam.name,
			isGuest: swapTeams ? blueTeam.isGuest : redTeam.isGuest,
			pick: [],
			ban: [],
			ready: false,
		},
		tournamentCode: room.tournamentCodes[room.currentDraft],
		draftIndex: room.currentDraft,
		state: "waiting",
		turnStart: 0,
		currentTurnTime: 0,
		canRepeatPreviousTurn: false,
	};

	room.drafts.push(newDraft);

	await roomService.updateRoom(roomId, room);
	io.to(draftRoomChannel(roomId)).emit("draft:next-draft", room, swapTeams);
};
