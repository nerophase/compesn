import { env } from "@/environment";
import { io, type Socket } from "socket.io-client";
import type {
	DraftClientToServerEvents,
	DraftServerToClientEvents,
	NotificationClientToServerEvents,
	NotificationServerToClientEvents,
	PrivateChatClientToServerEvents,
	PrivateChatServerToClientEvents,
} from "@compesn/shared/types/realtime/socket";

const options = {
	autoConnect: false,
};

export const socket: Socket<
	DraftServerToClientEvents & NotificationServerToClientEvents,
	DraftClientToServerEvents & NotificationClientToServerEvents
> = io(env.NEXT_PUBLIC_SERVER_URL, options);

export const socketChat: Socket<
	PrivateChatServerToClientEvents,
	PrivateChatClientToServerEvents
> = io(`${env.NEXT_PUBLIC_SERVER_URL}/private-chat`, options);
