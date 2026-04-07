"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { privateSocket } from "@/lib/private-socket";
import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";

type PrivateMessage = {
	fromUserId: string;
	toUserId: string;
	text: string;
	sentAt: string;
};

type Thread = {
	peerUserId: string;
	messages: PrivateMessage[];
};

export const usePrivateChat = () => {
	const trpc = useTRPC();

	const { data: currentUser } = useQuery(trpc.auth.authenticatedUser.queryOptions());

	const [threads, setThreads] = useState<Record<string, Thread>>({});

	const currentUserId = currentUser?.id;

	// connect + join on mount
	useEffect(() => {
		if (!currentUserId) return;

		privateSocket.connect();

		privateSocket.emit("private:join", { userId: currentUserId });

		const handleMessage = (msg: PrivateMessage) => {
			const peerUserId = msg.fromUserId === currentUserId ? msg.toUserId : msg.fromUserId;

			setThreads((prev) => {
				const existing = prev[peerUserId] ?? {
					peerUserId,
					messages: [],
				};
				return {
					...prev,
					[peerUserId]: {
						...existing,
						messages: [...existing.messages, msg],
					},
				};
			});
		};

		const handleError = (err: string) => {
			console.error("Private chat error:", err);
			// optionally show a toast here
		};

		privateSocket.on("private:message", handleMessage);
		privateSocket.on("private:error", handleError);

		return () => {
			privateSocket.off("private:message", handleMessage);
			privateSocket.off("private:error", handleError);
			privateSocket.disconnect();
		};
	}, [currentUserId]);

	const sendPrivateMessage = useCallback(
		(toUserId: string, text: string) => {
			if (!currentUserId) return;
			if (!text.trim()) return;

			privateSocket.emit("private:message", {
				toUserId,
				text,
			});
		},
		[currentUserId],
	);

	const threadList = useMemo(() => Object.values(threads), [threads]);

	return {
		currentUserId,
		threads: threadList,
		sendPrivateMessage,
	};
};
