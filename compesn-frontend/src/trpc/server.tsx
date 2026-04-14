import "server-only";
import { cache, ReactNode } from "react";

import { createTRPCOptionsProxy } from "@trpc/tanstack-react-query";

import { dehydrate, HydrationBoundary, type QueryClient } from "@tanstack/react-query";

import { createTRPCContext } from "./init";
import { makeQueryClient } from "./query-client";
import { appRouter } from "./routers/_app";

export const getQueryClient = cache(makeQueryClient);
export const trpc = createTRPCOptionsProxy({
	ctx: createTRPCContext,
	router: appRouter,
	queryClient: getQueryClient,
});

export function HydrateClient(props: { children: ReactNode }) {
	const queryClient = getQueryClient();

	return <HydrationBoundary state={dehydrate(queryClient)}>{props.children}</HydrationBoundary>;
}

type QueryOptionsLike = unknown;
type PrefetchQueryOptions = Parameters<QueryClient["prefetchQuery"]>[0];
type PrefetchInfiniteQueryOptions = Parameters<QueryClient["prefetchInfiniteQuery"]>[0];

export function prefetch(queryOptions: QueryOptionsLike) {
	const queryClient = getQueryClient();
	const queryKey = (queryOptions as { queryKey?: readonly [unknown, { type?: string }?] }).queryKey;

	if (queryKey?.[1]?.type === "infinite") {
		void queryClient.prefetchInfiniteQuery(queryOptions as unknown as PrefetchInfiniteQueryOptions);
	} else {
		void queryClient.prefetchQuery(queryOptions as unknown as PrefetchQueryOptions);
	}
}

export const caller = appRouter.createCaller(createTRPCContext);
