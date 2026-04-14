import { baseProcedure } from "@/trpc/init";
import { ScrimListSchema } from "@/trpc/routers/scrims/scrims.schema";
import { db } from "@/lib/database/db";
import { redis } from "@/lib/database/redis";
import { scrims, teams, teamMembers } from "@compesn/shared/common/schemas";
import { and, asc, count, eq, exists, gte, ilike, inArray, lte, or, sql } from "drizzle-orm";
import { logError } from "@compesn/shared/logging";
import { TRPCError } from "@trpc/server";

export const listScrimsProcedure = baseProcedure.input(ScrimListSchema).query(async ({ input, ctx }) => {
	try {
		const currentUserId = ctx.session?.user?.id;
		const cacheKey = `scrims:list:${JSON.stringify({
			...input,
			currentUserId: currentUserId ?? null,
		})}`;

		const cached = redis ? await redis.get(cacheKey) : null;
		if (cached) {
			return JSON.parse(cached);
		}

		const conditions = [];

		if (input.startDate) {
			conditions.push(gte(scrims.startTime, input.startDate));
		}
		if (input.endDate) {
			conditions.push(lte(scrims.startTime, input.endDate));
		}

		if (input.startTimeFrom) {
			const [hours, minutes] = input.startTimeFrom.split(":").map(Number);
			conditions.push(
				sql`EXTRACT(HOUR FROM ${
					scrims.startTime
				}) * 60 + EXTRACT(MINUTE FROM ${scrims.startTime}) >= ${hours * 60 + minutes}`,
			);
		}
		if (input.startTimeTo) {
			const [hours, minutes] = input.startTimeTo.split(":").map(Number);
			conditions.push(
				sql`EXTRACT(HOUR FROM ${
					scrims.startTime
				}) * 60 + EXTRACT(MINUTE FROM ${scrims.startTime}) <= ${hours * 60 + minutes}`,
			);
		}

		if (input.status && input.status.length > 0) {
			conditions.push(inArray(scrims.status, input.status));
		}

		if (input.rolesNeeded && input.rolesNeeded.length > 0) {
			conditions.push(or(...input.rolesNeeded.map((role) => sql`${scrims.rolesNeeded} ? ${role}`)));
		}

		if (input.minRankTier) {
			conditions.push(gte(scrims.minRankTier, input.minRankTier));
		}

		if (input.maxRankTier) {
			conditions.push(lte(scrims.minRankTier, input.maxRankTier));
		}

		if (input.regions?.length) {
			conditions.push(
				exists(
					db
						.select({ one: sql`1` })
						.from(teams)
						.where(and(eq(teams.id, scrims.creatingTeamId), inArray(teams.region, input.regions))),
				),
			);
		}

		if (input.teamName?.trim()) {
			conditions.push(
				exists(
					db
						.select({ one: sql`1` })
						.from(teams)
						.where(
							and(eq(teams.id, scrims.creatingTeamId), ilike(teams.name, `%${input.teamName.trim()}%`)),
						),
				),
			);
		}

		const priorityCreatingTeam = currentUserId
			? sql<number>`
				CASE
					WHEN ${exists(
						db
							.select({ one: sql`1` })
							.from(teamMembers)
							.where(
								and(
									eq(teamMembers.teamId, scrims.creatingTeamId),
									eq(teamMembers.userId, currentUserId),
								),
							),
					)}
					THEN 0
					ELSE 1
				END
			`
			: sql<number>`1`;

		const priorityOpponentTeam = currentUserId
			? sql<number>`
				CASE
					WHEN ${exists(
						db
							.select({ one: sql`1` })
							.from(teamMembers)
							.where(
								and(
									eq(teamMembers.teamId, scrims.opponentTeamId),
									eq(teamMembers.userId, currentUserId),
								),
							),
					)}
					THEN 0
					ELSE 1
				END
			`
			: sql<number>`1`;

		const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

		const [countRow] = await db.select({ total: count() }).from(scrims).where(whereClause);

		const items = await db.query.scrims.findMany({
			where: whereClause,
			with: {
				creatingTeam: {
					with: {
						members: {
							with: {
								user: true,
							},
						},
					},
				},
				opponentTeam: {
					with: {
						members: {
							with: {
								user: true,
							},
						},
					},
				},
			},
			orderBy: [priorityCreatingTeam, priorityOpponentTeam, asc(scrims.status), asc(scrims.startTime)],
			limit: input.limit,
			offset: input.offset,
		});

		const result = {
			items,
			total: Number(countRow?.total ?? 0),
			limit: input.limit,
			offset: input.offset,
		};

		if (redis) {
			await redis.setex(cacheKey, 60, JSON.stringify(result));
		}

		return result;
	} catch (error) {
		logError("frontend.scrims.list", error, { userId: ctx.session?.user?.id });
		throw new TRPCError({
			code: "INTERNAL_SERVER_ERROR",
			message: "Failed to list scrims",
		});
	}
});
