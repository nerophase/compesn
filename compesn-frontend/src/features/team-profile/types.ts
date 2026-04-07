import type { AppRouter } from "@/trpc/routers/_app";

export type TeamProfile = NonNullable<Awaited<ReturnType<AppRouter["teams"]["getById"]>>>;

export type ViewerTeam = {
	id: string;
	name: string;
	tag: string;
};
