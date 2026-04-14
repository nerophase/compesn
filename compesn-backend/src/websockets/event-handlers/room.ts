import { roomService } from "@/services/room";
import { TRoomMember } from "@compesn/shared/types/room-member";
import { getTeam } from "@/utils";
import { generateId } from "@/utils/password";
import { draftRoomChannel, draftTeamChannel } from "@/utils/socket-rooms";
import { findRoomMemberBySocketId, requireRoomById } from "@/websockets/guards/room-context";
import type { RoomJoinPayload, RoomJoinTeamPayload } from "@compesn/shared/types/realtime/socket";
import type { DraftServer, DraftSocket } from "@/websockets/socket-types";

export const registerRoomHandlers = (io: DraftServer, socket: DraftSocket) => {
	socket.on("room:join-room", ({ roomId }: RoomJoinPayload) => {
		const previousRoomId = socket.data.draftRoomId;

		if (previousRoomId && previousRoomId !== roomId) {
			socket.leave(draftRoomChannel(previousRoomId));

			if (socket.data.draftTeamId) {
				socket.leave(draftTeamChannel(socket.data.draftTeamId));
				socket.data.draftTeamId = undefined;
			}
		}

		socket.join(draftRoomChannel(roomId));
		socket.data.draftRoomId = roomId;
	});
	socket.on(
		"room:join-team",
		async ({ roomId, teamId, userId, name, isGuest }: RoomJoinTeamPayload) => {
			const room = await requireRoomById(socket, roomId, "error:joining-room");
			if (!room) {
				return;
			}

			const currentDraft = room.drafts[room.currentDraft];

			const team = getTeam(teamId, currentDraft);

			if (team) {
				// Remove Spectator Member
				room.members = room.members.filter(
					(member: TRoomMember) => !(member.socketId === socket.id && !!team),
				);
			}

			if (room.members.find((roomMember: TRoomMember) => roomMember.name === name)) {
				return socket.emit("error:joining-room", `Username "${name}" already taken.`);
			}

			if (!name) {
				let playerNumber = -1;

				if (team === "blue") {
					playerNumber = ++room.members.filter(
						(member: TRoomMember) => member.team === "blue",
					).length;
				} else if (team === "red") {
					playerNumber = ++room.members.filter(
						(member: TRoomMember) => member.team === "red",
					).length;
				} else if (!team) {
					playerNumber = ++room.members.filter(
						(member: TRoomMember) => member.team === undefined,
					).length;
				}

				if (team) {
					name = `${currentDraft![team].name} Member ${playerNumber}`;
				} else {
					name = `Spectator ${playerNumber}`;
				}
			}

			let isNewGuestUser = false;

			if (!userId) {
				userId = generateId();
				isNewGuestUser = true;
			}

			const roomMember: TRoomMember = {
				socketId: socket.id,
				userId,
				name,
				team,
				isGuest,
			};

			socket.join(draftRoomChannel(roomId));
			socket.data.draftRoomId = roomId;

			if (socket.data.draftTeamId && socket.data.draftTeamId !== teamId) {
				socket.leave(draftTeamChannel(socket.data.draftTeamId));
			}

			if (team) {
				socket.join(draftTeamChannel(teamId));
				socket.data.draftTeamId = teamId;
			} else {
				socket.data.draftTeamId = undefined;
			}

			room.members.push(roomMember);

			await roomService.updateRoom(roomId, room);

			// updating the turn time for the client
			// if (currentDraft.state === "ongoing") {
			// 	currentDraft.currentTurnTime =
			// 		currentDraft.currentTurnTime -
			// 		(Date.now() - currentDraft.turnStart) / 1000;
			// }

			socket.emit("room:user-joined-team", {
				room,
				roomMember,
				userId: isNewGuestUser ? userId : null,
			});

			if (roomMember.team) {
				io.to(draftRoomChannel(roomId)).emit("chat:message", {
					name: "COMPESN",
					team: undefined,
					all: true,
					text: `${roomMember.name} joined team ${currentDraft![roomMember.team].name}`,
				});
			}
			io.to(draftRoomChannel(roomId)).emit("room:update-members", room.members);

			if (currentDraft!.state === "ongoing") {
				socket.emit("draft:countdown", {
					countdown:
						currentDraft!.currentTurnTime +
						3 - // +3 hidden timer
						(Date.now() - currentDraft!.turnStart) / 1000,
				});
			}
		},
	);

	socket.on("disconnecting", async () => {
		const roomId = socket.data.draftRoomId;
		if (roomId) {
			const room = await requireRoomById(socket, roomId);
			const member = room ? findRoomMemberBySocketId(room, socket.id) : undefined;

			if (!room || !member) return;

			room.members = room.members.filter(
				(roomMember: TRoomMember) => roomMember.name !== member.name,
			);

			await roomService.updateRoom(roomId, room);
			io.to(draftRoomChannel(roomId)).emit("room:update-members", room.members);
		}
	});
};
