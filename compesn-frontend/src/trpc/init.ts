import { cache } from "react";

import { initTRPC, TRPCError } from "@trpc/server";

import { transformer } from "@/trpc/transformer";
import { auth } from "@/lib/auth";

export const createTRPCContext = cache(async (opts?: { req?: Request }) => {
	const data = await auth();

	return {
		session: data,
		req: opts?.req || null,
	};
});

const t = initTRPC.context<Awaited<ReturnType<typeof createTRPCContext>>>().create({
	transformer,
});

export const createTRPCRouter = t.router;
export const createCallerFactory = t.createCallerFactory;
export const baseProcedure = t.procedure;

export const authenticatedProcedure = t.procedure.use(async ({ ctx, next }) => {
	if (!ctx.session || !ctx.session.user) {
		throw new TRPCError({
			code: "UNAUTHORIZED",
			message: "TRPC UNAUTHORIZED Error",
		});
	}

	return next({
		ctx: {
			session: ctx.session,
			user: ctx.session?.user || {},
		},
	});
});
