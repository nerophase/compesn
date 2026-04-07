import { baseProcedure, createTRPCRouter, authenticatedProcedure } from "../../init";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createNotification } from "../../../lib/notifications";
import { teams, usersToTeams, rooms, TRoomInsert, TRoom } from "@compesn/shared/common/schemas";
import { deserializeRoomCache, serializeRoomCache } from "@compesn/shared/rooms/cache";
import { logError } from "@compesn/shared/logging";
import { db } from "../../../lib/database/db";
import { eq } from "drizzle-orm";
import { RoomIdSchema, RoomSettingsSchema } from "./rooms.schema";
import { TDraft } from "@compesn/shared/common/types/draft";
import { redis } from "../../../lib/database/redis";
import { generateId } from "../../../utils/password";
import axios from "axios";
import { env } from "@/environment";

// Helper functions for room caching
const getRoomCache = async (roomId: string) => {
	if (env.ENABLE_CACHE) return await redis?.get(`room:${roomId}`);
};

const setRoomCache = async (roomId: string, room: TRoom) => {
	if (env.ENABLE_CACHE)
		return await redis?.setex(`room:${roomId}`, env.ROOM_TTL, serializeRoomCache(room));
};

export const roomsRouter = createTRPCRouter({
	get: baseProcedure.input(RoomIdSchema).query(async ({ input }) => {
		try {
			const cached = await getRoomCache(input.roomId);

			if (cached) {
				return deserializeRoomCache(cached);
			}

			const room = await db.query.rooms.findFirst({
				where: eq(rooms.id, input.roomId),
			});

			if (room) {
				await setRoomCache(input.roomId, room);
			}

			return room;
		} catch (error) {
			logError("frontend.rooms.get", error, { roomId: input.roomId });
			throw new TRPCError({
				code: "INTERNAL_SERVER_ERROR",
				message: "Unable to load room",
			});
		}
	}),

	create: baseProcedure.input(RoomSettingsSchema).mutation(async ({ input }) => {
		let tournamentId = 0;
		let tournamentCodes: string[] = [];

		try {
			if (process.env.GENERATE_TOURNAMENT_CODE === "true") {
				// Create tournament
				const tournamentRes = await axios.post(
					`${process.env.RIOT_API_URL}/lol/tournament/v5/tournaments`,
					{
						providerId: parseInt(process.env.PROVIDER_ID || "0"),
						name: "COMPESN Tournament",
					},
					{ params: { api_key: process.env.RIOT_API_KEY } },
				);
				tournamentId = tournamentRes.data;

				// Get tournament codes
				const codesRes = await axios.post(
					`${process.env.RIOT_API_URL}/lol/tournament/v5/codes`,
					{
						mapType: "SUMMONERS_RIFT",
						pickType: input.pickType,
						spectatorType: "ALL",
						teamSize: 5,
					},
					{
						params: {
							api_key: process.env.RIOT_API_KEY,
							count: input.numberOfDrafts,
							tournamentId,
						},
					},
				);
				tournamentCodes = codesRes.data;
			}
		} catch (error) {
			logError("frontend.rooms.create.tournament", error);
		}

		// Inline createRoom function
		let room;
		try {
			const draft: TDraft = {
				draftIndex: 0,
				tournamentCode: tournamentCodes[0],
				blue: {
					id: generateId(),
					name: input.blueTeamName,
					isGuest: input.blueTeamIsGuest,
					pick: [],
					ban: [],
					ready: false,
				},
				red: {
					id: generateId(),
					name: input.redTeamName,
					isGuest: input.redTeamIsGuest,
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
			room = (
				await db
					.insert(rooms)
					.values({
						draftMode: input.draftMode,
						draftsCount: input.numberOfDrafts,
						pickType: input.pickType,
						disabledChampions: input.disabledChampions,
						disabledTurns: input.disabledTurns,
						time: {
							pick: input.timePerPick,
							ban: input.timePerBan,
						},
						drafts: [draft],
						tournamentId,
						tournamentCodes,
					})
					.returning()
			)[0];

			if (!room) {
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Unable to create room",
				});
			}

			await setRoomCache(room.id, room);
		} catch (error) {
			logError("frontend.rooms.create.room", error);
			throw new TRPCError({
				code: "INTERNAL_SERVER_ERROR",
				message: "Unable to create room",
			});
		}

		try {
			if (!input.blueTeamIsGuest) {
				const team = await db.query.teams.findFirst({
					where: eq(teams.name, input.blueTeamName),
				});
				if (team) {
					const users = await db.query.users.findMany({
						with: {
							usersToTeams: {
								where: eq(usersToTeams.teamId, team.id),
								with: { team: true },
							},
						},
					});
					await Promise.all(
						users.map((user: any) =>
							createNotification(user.id, "JOIN_DRAFT", {
								roomId: room!.id,
								teamName: input.blueTeamName as string,
							}),
						),
					);
				}
			}
			if (!input.redTeamIsGuest) {
				const team = await db.query.teams.findFirst({
					where: eq(teams.name, input.redTeamName),
				});
				if (team) {
					const users = await db.query.users.findMany({
						with: {
							usersToTeams: {
								where: eq(usersToTeams.teamId, team.id),
								with: { team: true },
							},
						},
					});
					await Promise.all(
						users.map((user: any) =>
							createNotification(user.id, "JOIN_DRAFT", {
								roomId: room!.id,
								teamName: input.redTeamName as string,
							}),
						),
					);
				}
			}
		} catch (error) {
			logError("frontend.rooms.create.notifications", error, { roomId: room?.id });
		}

		return room;
	}),

	update: authenticatedProcedure
		.input(z.object({ roomId: z.string(), room: z.any() }))
		.mutation(async ({ input }) => {
			try {
				const newRoom = (
					await db
						.update(rooms)
						.set(input.room as TRoomInsert)
						.where(eq(rooms.id, input.roomId))
						.returning()
				)[0];

				await setRoomCache(input.roomId, newRoom);

				return newRoom;
			} catch (error) {
				logError("frontend.rooms.update", error, { roomId: input.roomId });
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Unable to update room",
				});
			}
		}),
});
