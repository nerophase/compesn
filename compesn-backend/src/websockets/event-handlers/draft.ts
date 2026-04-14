import {
	declineRepeatPreviousTurn,
	nextTurn,
	repeatPreviousTurn,
	requestedRepeatPreviousTurn,
	resetDraft,
	resetTurn,
	nextDraft,
	terminateDraft,
	noBan,
} from "@/lib/draft";
import { TTeamColor } from "@compesn/shared/types/team-color";
import { addChampion } from "@/utils/champions";
import { championService } from "@/services/champion";
import { roomService } from "@/services/room";
import { draftRoomChannel } from "@/utils/socket-rooms";
import {
	isCurrentTeamTurn,
	requireDraftTeamContext,
	requireRoomContext,
} from "@/websockets/guards/draft-context";
import type {
	DraftSelectChampionPayload,
	DraftSetReadyPayload,
	DraftTurnNumberPayload,
} from "@compesn/shared/types/realtime/socket";
import type { DraftServer, DraftSocket } from "@/websockets/socket-types";

export const registerDraftHandlers = (io: DraftServer, socket: DraftSocket) => {
	socket.on("draft:set-ready", async ({ ready }: DraftSetReadyPayload) => {
		const context = await requireDraftTeamContext(socket, "error:not-connected");

		if (!context) {
			return;
		}

		const { roomId, room, currentDraft, team } = context;

		currentDraft[team].ready = ready;

		await roomService.updateRoom(roomId, room);

		socket.emit("draft:updated-status");

		if (currentDraft.blue.ready && currentDraft.red.ready) {
			currentDraft.state = "ongoing";
			nextTurn(room, io);
		} else {
			io.to(draftRoomChannel(roomId)).emit("draft:update", {
				draft: currentDraft,
				draftIdx: room.currentDraft,
			});
		}
	});

	socket.on(
		"draft:select-champion",
		async ({ selectedChampion, turnNumber }: DraftSelectChampionPayload) => {
			const context = await requireDraftTeamContext(socket);

			if (!context) {
				return;
			}

			const { roomId, room, currentDraft, team } = context;

			if (!isCurrentTeamTurn(team, currentDraft, turnNumber)) {
				socket.emit("error:selecting-champion", "Error selecting champion.");
				return;
			}

			if (selectedChampion === "no-ban") {
				addChampion(currentDraft, {
					name: "No Ban",
					fileName: "no-ban",
					roles: [],
					tags: [],
				});
			} else {
				const champion = championService.getChampionByFileName(selectedChampion);

				if (!champion) {
					return;
				}
				addChampion(currentDraft, champion);
			}

			await roomService.updateRoom(roomId, room);
			socket.to(draftRoomChannel(roomId)).emit("draft:update", {
				draft: currentDraft,
				draftIdx: room.currentDraft,
			});
		},
	);

	socket.on("draft:lock-champion", async ({ turnNumber }: DraftTurnNumberPayload) => {
		const context = await requireDraftTeamContext(socket);

		if (!context) {
			return;
		}

		const { room, currentDraft, team } = context;

		if (!isCurrentTeamTurn(team, currentDraft, turnNumber)) {
			socket.emit("error:locking-champion", "Error locking champion.");
			return;
		}

		await nextTurn(room, io);
	});

	socket.on("draft:no-ban", async ({ turnNumber }: DraftTurnNumberPayload) => {
		const context = await requireDraftTeamContext(socket);

		if (!context) {
			return;
		}

		const { room, currentDraft, team } = context;

		if (!isCurrentTeamTurn(team, currentDraft, turnNumber)) {
			socket.emit("error:locking-champion", "Error locking champion.");
			return;
		}

		await noBan(room, io);
	});

	socket.on("draft:reset-turn", async () => {
		const context = await requireRoomContext(socket);

		if (!context) {
			return;
		}

		await resetTurn(context.room, io);
	});

	socket.on("draft:reset-draft", async () => {
		const context = await requireRoomContext(socket);

		if (!context) {
			return;
		}

		await resetDraft(context.room, io);
	});

	socket.on("draft:terminate-draft", async () => {
		const context = await requireRoomContext(socket);

		if (!context) {
			return;
		}

		await terminateDraft(context.room, io);
	});

	socket.on("draft:request-repeat-previous-turn", async (team: TTeamColor) => {
		const context = await requireRoomContext(socket);

		if (!context) {
			return;
		}

		await requestedRepeatPreviousTurn(context.room, team, io);
	});

	socket.on("draft:repeat-previous-turn", async (turnNumber: number) => {
		const context = await requireRoomContext(socket);

		if (!context) {
			return;
		}

		if (context.room.drafts[context.room.currentDraft].turn?.number === turnNumber) {
			await repeatPreviousTurn(context.room, io);
		}
	});

	socket.on("draft:decline-repeat-previous-turn", async (turnNumber: number) => {
		const context = await requireRoomContext(socket);

		if (!context) {
			return;
		}

		if (context.room.drafts[context.room.currentDraft].turn?.number === turnNumber) {
			await declineRepeatPreviousTurn(context.room, io);
		}
	});

	socket.on("draft:team-wins", async (team: TTeamColor) => {
		const context = await requireRoomContext(socket);

		if (!context) {
			return;
		}

		await nextDraft(context.room, team === "red", io);
	});

	socket.on("draft:next-draft", async (swapSides: boolean, currentDraft: number) => {
		const context = await requireRoomContext(socket);

		if (!context) {
			return;
		}

		if (context.room.currentDraft !== currentDraft) return;

		await nextDraft(context.room, swapSides, io);
	});
};
