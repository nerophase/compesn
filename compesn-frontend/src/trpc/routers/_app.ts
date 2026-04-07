import { createTRPCRouter } from "../init";
import { authRouter } from "./auth";
import { usersRouter } from "./users";
import { teamsRouter } from "./teams";
import { championsRouter } from "./champions";
import { roomsRouter } from "./rooms";
import { draftHistoryRouter } from "./draft-history";
import { notificationsRouter } from "./notifications";
import { scrimsRouter } from "./scrims";
import { draftsRouter } from "./drafts";
import { messagesRouter } from "./messages";
import { searchRouter } from "./search";
import { statsRouter } from "./stats";
import { friendsRouter } from "./friends";

// Mount all routers here
export const appRouter = createTRPCRouter({
	auth: authRouter,
	users: usersRouter,
	teams: teamsRouter,
	champions: championsRouter,
	rooms: roomsRouter,
	draftHistory: draftHistoryRouter,
	notifications: notificationsRouter,
	scrims: scrimsRouter,
	drafts: draftsRouter,
	messages: messagesRouter,
	search: searchRouter,
	stats: statsRouter,
	friends: friendsRouter,
});

export type AppRouter = typeof appRouter;
