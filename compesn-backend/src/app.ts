import express, { Request, Response } from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import helmet from "helmet";
import { handlers } from "@/websockets/event-handlers";
import { registerPrivateChatHandlers } from "@/websockets/event-handlers/private-chat";
import { env } from "@/environment";
import type {
	CompesnSocketData,
	DraftClientToServerEvents,
	DraftServerToClientEvents,
	NotificationClientToServerEvents,
	NotificationServerToClientEvents,
	PrivateChatClientToServerEvents,
	PrivateChatServerToClientEvents,
} from "@compesn/shared/types/realtime/socket";
import type { PrivateChatNamespace } from "@/websockets/socket-types";

const app = express();
const httpServer = createServer(app);

app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(
	helmet({
		crossOriginResourcePolicy: false,
		crossOriginEmbedderPolicy: false,
	}),
);

app.use(
	cors({
		origin: true, // TODO: Change when going to PROD.
		credentials: true,
	}),
);

app.get("/", async (req: Request, res: Response) => {
	return res.json(`COMPESN DRAFT API v1.0`);
});

// Main Socket.IO server (default namespace for drafting)
export const io = new Server(httpServer, {
	cors: {
		origin: "*",
	},
	connectionStateRecovery: {
		maxDisconnectionDuration: 2 * 60 * 1000,
	},
}) as Server<
	DraftClientToServerEvents & NotificationClientToServerEvents,
	DraftServerToClientEvents & NotificationServerToClientEvents,
	Record<string, never>,
	CompesnSocketData
>;

// Private chat namespace
const privateChatIo = io.of("/private-chat") as PrivateChatNamespace;

// Draft handlers (default namespace)
io.on("connection", (socket) => {
	handlers.registerRoomHandlers(io, socket);
	handlers.registerChatHandlers(io, socket);
	handlers.registerDraftHandlers(io, socket);
	handlers.registerNotificationHandlers(io, socket);
});

// Private chat handlers (on /private-chat namespace)
privateChatIo.on("connection", (socket) => {
	registerPrivateChatHandlers(privateChatIo, socket);
});

httpServer.listen(env.APP_PORT, async () => {
	console.log(`App listening on http://localhost:${env.APP_PORT}`);
	console.log(`Draft WebSocket: ws://localhost:${env.APP_PORT}`);
	console.log(`Private Chat WebSocket: ws://localhost:${env.APP_PORT}/private-chat`);
});
