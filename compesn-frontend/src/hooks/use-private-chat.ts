"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { privateSocket } from "@/lib/private-socket";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import type { SerializedPrivateMessage } from "@compesn/shared/types/realtime/socket";

type Thread = {
	peerUserId: string;
	conversationId: string;
	messages: SerializedPrivateMessage[];
};

export const usePrivateChat = () => {
	const trpc = useTRPC();

	const { data: currentUser } = useQuery(trpc.auth.authenticatedUser.queryOptions());
	const { data: conversations = [] } = useQuery(
		trpc.messages.listConversations.queryOptions({
			search: "",
			type: "direct",
		}),
	);

	const [threads, setThreads] = useState<Record<string, Thread>>({});

	const currentUserId = currentUser?.id;
	const directConversationByPeerId = useMemo(
		() =>
			new Map(
				conversations
					.filter((conversation) => conversation.kind === "DIRECT" && conversation.peerUserId)
					.map((conversation) => [conversation.peerUserId!, conversation.id]),
			),
		[conversations],
	);
	const peerIdByConversationId = useMemo(
		() =>
			new Map(
				conversations
					.filter((conversation) => conversation.kind === "DIRECT" && conversation.peerUserId)
					.map((conversation) => [conversation.id, conversation.peerUserId!]),
			),
		[conversations],
	);
	const createDirectConversation = useMutation(
		trpc.messages.createOrGetDirectConversation.mutationOptions(),
	);
	const sendMessageMutation = useMutation(
		trpc.messages.sendMessage.mutationOptions({
			onSuccess: (message) => {
				privateSocket.emit("private:message", message);
			},
		}),
	);

	// connect + join on mount
	useEffect(() => {
		if (!currentUserId) return;

		privateSocket.connect();

		privateSocket.emit("private:join", {
			userId: currentUserId,
			conversations: Array.from(peerIdByConversationId.keys()),
		});

		const handleMessage = (message: SerializedPrivateMessage) => {
			const peerUserId =
				peerIdByConversationId.get(message.conversationId) ?? message.conversationId;

			setThreads((prev) => {
				const existing = prev[peerUserId] ?? {
					peerUserId,
					conversationId: message.conversationId,
					messages: [],
				};
				return {
					...prev,
					[peerUserId]: {
						...existing,
						conversationId: message.conversationId,
						messages: [...existing.messages, message],
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
	}, [currentUserId, peerIdByConversationId]);

	const sendPrivateMessage = useCallback(
		async (toUserId: string, text: string) => {
			if (!currentUserId) return;
			if (!text.trim()) return;

			const existingConversationId = directConversationByPeerId.get(toUserId);
			const conversationId =
				existingConversationId ??
				(
					await createDirectConversation.mutateAsync({
						targetUserId: toUserId,
					})
				).conversationId;

			await sendMessageMutation.mutateAsync({
				conversationId,
				senderId: currentUserId,
				content: text,
			});
		},
		[currentUserId, createDirectConversation, directConversationByPeerId, sendMessageMutation],
	);

	const threadList = useMemo(() => Object.values(threads), [threads]);

	return {
		currentUserId,
		threads: threadList,
		sendPrivateMessage,
	};
};
