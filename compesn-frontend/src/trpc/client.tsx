"use client";

import type { QueryClient } from "@tanstack/react-query";
import { QueryClientProvider } from "@tanstack/react-query";
import { createTRPCClient, httpBatchLink } from "@trpc/client";
import { useState } from "react";
import { makeQueryClient } from "./query-client";
import type { AppRouter } from "./routers/_app";
import { createTRPCContext } from "@trpc/tanstack-react-query";
import { env } from "@/environment";
import { transformer } from "./transformer";

export const { TRPCProvider, useTRPC, useTRPCClient } = createTRPCContext<AppRouter>();
let browserQueryClient: QueryClient;

function getQueryClient() {
	if (typeof window === "undefined") {
		return makeQueryClient();
	}

	if (!browserQueryClient) browserQueryClient = makeQueryClient();

	return browserQueryClient;
}

function getUrl() {
	const base = (() => {
		if (typeof window !== "undefined") return "";
		return env.NEXT_PUBLIC_BASE_URL;
	})();
	return `${base}/api/trpc`;
}

export function TRPCReactProvider(
	props: Readonly<{
		children: React.ReactNode;
	}>,
) {
	const queryClient = getQueryClient();
	const [trpcClient] = useState(() =>
		createTRPCClient<AppRouter>({
			links: [
				httpBatchLink({
					transformer,
					url: getUrl(),
				}),
			],
		}),
	);

	return (
		<QueryClientProvider client={queryClient}>
			<TRPCProvider trpcClient={trpcClient} queryClient={queryClient}>
				{props.children}
			</TRPCProvider>
		</QueryClientProvider>
	);
}
