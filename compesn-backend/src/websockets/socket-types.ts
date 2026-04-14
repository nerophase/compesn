import type {
	CompesnSocketData,
	DraftClientToServerEvents,
	DraftServerToClientEvents,
	NotificationClientToServerEvents,
	NotificationServerToClientEvents,
	PrivateChatClientToServerEvents,
	PrivateChatServerToClientEvents,
} from "@compesn/shared/types/realtime/socket";
import type { Namespace, Server, Socket } from "socket.io";

export type DraftServer = Server<
	DraftClientToServerEvents & NotificationClientToServerEvents,
	DraftServerToClientEvents & NotificationServerToClientEvents,
	Record<string, never>,
	CompesnSocketData
>;

export type DraftSocket = Socket<
	DraftClientToServerEvents & NotificationClientToServerEvents,
	DraftServerToClientEvents & NotificationServerToClientEvents,
	Record<string, never>,
	CompesnSocketData
>;

export type PrivateChatNamespace = Namespace<
	PrivateChatClientToServerEvents,
	PrivateChatServerToClientEvents,
	Record<string, never>,
	CompesnSocketData
>;

export type PrivateChatSocket = Socket<
	PrivateChatClientToServerEvents,
	PrivateChatServerToClientEvents,
	Record<string, never>,
	CompesnSocketData
>;
