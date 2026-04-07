import { env } from "@/environment";
import { io } from "socket.io-client";

const options = {
	autoConnect: false,
};

export const privateSocket = io(`${env.NEXT_PUBLIC_SERVER_URL}/private-chat`, options);
