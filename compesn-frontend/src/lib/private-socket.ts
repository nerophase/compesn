import { env } from "@/environment";
import { io, type Socket } from "socket.io-client";
import type {
	PrivateChatClientToServerEvents,
	PrivateChatServerToClientEvents,
} from "@compesn/shared/types/realtime/socket";

const options = {
	autoConnect: false,
};

export const privateSocket: Socket<
	PrivateChatServerToClientEvents,
	PrivateChatClientToServerEvents
> = io(`${env.NEXT_PUBLIC_SERVER_URL}/private-chat`, options);
