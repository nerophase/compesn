import { defaultShouldDehydrateQuery, QueryClient } from "@tanstack/react-query";
import { stringify, parse } from "devalue";

export function makeQueryClient() {
	return new QueryClient({
		defaultOptions: {
			queries: {
				staleTime: 30 * 1000,
			},
			dehydrate: {
				serializeData: (data) => stringify(data),
				shouldDehydrateQuery: (query) =>
					defaultShouldDehydrateQuery(query) || query.state.status === "pending",
			},
			hydrate: {
				deserializeData: (data) => parse(data),
			},
		},
	});
}
