import { env } from "@/environment";
import { io } from "socket.io-client";

const options = {
	autoConnect: false,
};

export const socket = io(env.NEXT_PUBLIC_SERVER_URL, options);
export const socketChat = io(`${env.NEXT_PUBLIC_SERVER_URL}/private-chat`, options);
