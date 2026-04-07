import type { TRoom } from "../common/schemas/rooms";

type SerializedRoom = Omit<TRoom, "createdAt" | "updatedAt"> & {
	createdAt: string | Date;
	updatedAt: string | Date;
};

export const serializeRoomCache = (room: TRoom) => JSON.stringify(room);

export const deserializeRoomCache = (cachedRoom: string): TRoom => {
	const room = JSON.parse(cachedRoom) as SerializedRoom;

	return {
		...room,
		createdAt: new Date(room.createdAt),
		updatedAt: new Date(room.updatedAt),
	};
};
