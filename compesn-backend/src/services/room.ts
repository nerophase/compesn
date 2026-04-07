import { TRoomSettings } from "@compesn/shared/common/types/room-settings";
import { generateId } from "@/utils/password";
import { db } from "@/database";
import { rooms, TRoom, TRoomInsert } from "@compesn/shared/common/schemas/rooms";
import { deserializeRoomCache, serializeRoomCache } from "@compesn/shared/rooms/cache";
import { logError } from "@compesn/shared/logging";
import { arrayContains, eq } from "drizzle-orm";
import { TDraft } from "@compesn/shared/common/types/draft";
import { redis } from "@/database/redis";
import { env } from "@/environment";

const getRoomCache = async (roomId: string) => {
	if (env.ENABLE_CACHE) return await redis?.get(`room:${roomId}`);
};

const setRoomCache = async (roomId: string, room: TRoom) => {
	if (env.ENABLE_CACHE)
		return await redis?.setex(`room:${roomId}`, env.ROOM_TTL, serializeRoomCache(room));
};

const getRoomById = async (roomId: string) => {
	try {
		const cached = await getRoomCache(roomId);

		if (cached) {
			return deserializeRoomCache(cached);
		}

		const room = await db.query.rooms.findFirst({
			where: eq(rooms.id, roomId),
		});

		if (room) {
			await setRoomCache(roomId, room);
		}

		return room;
	} catch (error) {
		logError("backend.rooms.getById", error, { roomId });
		throw error;
	}
};

const createRoom = async (
	roomSettings: TRoomSettings,
	tournamentId: number,
	tournamentCodes: string[],
) => {
	try {
		const draft: TDraft = {
			draftIndex: 0,
			tournamentCode: tournamentCodes[0],
			blue: {
				id: generateId(),
				name: roomSettings.blueTeamName,
				isGuest: roomSettings.blueTeamIsGuest,
				pick: [],
				ban: [],
				ready: false,
			},
			red: {
				id: generateId(),
				name: roomSettings.redTeamName,
				isGuest: roomSettings.redTeamIsGuest,
				pick: [],
				ban: [],
				ready: false,
			},
			state: "waiting",
			turnStart: 0,
			currentTurnTime: 0,
			canRepeatPreviousTurn: false,
		};

		// Create Room
		const room = (
			await db
				.insert(rooms)
				.values({
					draftMode: roomSettings.draftMode,
					draftsCount: roomSettings.numberOfDrafts,
					pickType: roomSettings.pickType,
					disabledChampions: roomSettings.disabledChampions,
					disabledTurns: roomSettings.disabledTurns,
					time: {
						pick: roomSettings.timePerPick,
						ban: roomSettings.timePerBan,
					},
					drafts: [draft],
					tournamentId,
					tournamentCodes,
				})
				.returning()
		)[0];

		if (!room) {
			throw new Error("Unable to create room");
		}

		await setRoomCache(room.id, room);

		return room;
	} catch (error) {
		logError("backend.rooms.create", error);
		throw error;
	}
};

const updateRoom = async (roomId: string, room: TRoomInsert) => {
	try {
		// return await RoomModel.findByIdAndUpdate(roomId, { $set: room });
		const newRoom = (
			await db.update(rooms).set(room).where(eq(rooms.id, roomId)).returning()
		)[0];

		await setRoomCache(roomId, newRoom);

		return newRoom;
	} catch (error) {
		logError("backend.rooms.update", error, { roomId });
		throw error;
	}
};

const getRoomByTournamentCode = async (tournamentCode: string) => {
	try {
		return await db.query.rooms.findFirst({
			where: arrayContains(rooms.tournamentCodes, [tournamentCode]),
		});
	} catch (error) {
		logError("backend.rooms.getByTournamentCode", error, { tournamentCode });
		throw error;
	}
};

export const roomService = {
	getRoomById,
	getRoomByTournamentCode,
	createRoom,
	updateRoom,
};
