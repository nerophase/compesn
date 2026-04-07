import ManageChampionsPage from "./page-client";
import { prefetch, trpc } from "@/trpc/server";

export default async function Page() {
	prefetch(trpc.champions.getAll.queryOptions());
	return <ManageChampionsPage />;
}
