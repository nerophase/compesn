"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
	SearchIcon,
	MessageCircleIcon,
	UsersIcon,
	PlusIcon,
	SendIcon,
	PaperclipIcon,
	SmileIcon,
	MoreVerticalIcon,
	PhoneIcon,
	VideoIcon,
	UserPlusIcon,
} from "lucide-react";
import { LocalizedDateTime } from "@/components/localized-datetime";
import { useTRPC } from "@/trpc/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import NewConversationModal from "./new-conversation-modal";
import { socketChat } from "@/lib/sockets";
import { TMessage, TUser } from "@compesn/shared/schemas";
import type { SerializedPrivateMessage } from "@compesn/shared/types/realtime/socket";
import { AppRouter } from "@/trpc/routers/_app";
import { toast } from "sonner";

const CONVERSATION_TYPES = [
	{ value: "all", label: "All Conversations" },
	{ value: "direct", label: "Direct Messages" },
	{ value: "group", label: "Group Chats" },
	{ value: "team", label: "Team Chats" },
];

type ConversationListItem = Awaited<ReturnType<AppRouter["messages"]["listConversations"]>>[number];
type ConversationMessage = Awaited<
	ReturnType<AppRouter["messages"]["listMessagesByConversationId"]>
>[number];

export default function MessagesPage() {
	const trpc = useTRPC();
	const queryClient = useQueryClient();
	const router = useRouter();
	const searchParams = useSearchParams();
	const { status } = useSession();
	const isAuthenticated = status === "authenticated";
	const selectedConversationId = searchParams.get("conversationId");
	const [selectedConversation, setSelectedConversation] = useState<ConversationListItem | null>(
		null,
	);
	const [searchTerm, setSearchTerm] = useState("");
	const [conversationType, setConversationType] = useState<"all" | "direct" | "group" | "team">(
		"all",
	);
	const [messageText, setMessageText] = useState("");
	const [showNewMessageModal, setShowNewMessageModal] = useState(false);
	const messagesEndRef = useRef<HTMLDivElement>(null);

	const { data: conversations, isLoading: conversationsLoading } = useQuery(
		trpc.messages.listConversations.queryOptions(
			{
				search: searchTerm,
				type: conversationType === "all" ? null : conversationType,
			},
			{ enabled: isAuthenticated },
		),
	);

	const { data: messages, isLoading: messagesLoading } = useQuery(
		trpc.messages.listMessagesByConversationId.queryOptions(
			{ conversationId: selectedConversation?.id || "" },
			{ enabled: isAuthenticated && !!selectedConversation?.id },
		),
	);

	const [conversationsList, setConversationsList] = useState<ConversationListItem[] | undefined>(
		conversations,
	);
	const [messagesList, setMessagesList] = useState<ConversationMessage[] | undefined>(messages);
	const selectedConversationRef = useRef<ConversationListItem | null>(null);

	const now = useNow();

	useEffect(() => {
		if (messages) {
			setMessagesList(messages);
		}
	}, [messages]);

	useEffect(() => {
		if (conversations) {
			setConversationsList(conversations);
		}
	}, [conversations]);

	useEffect(() => {
		if (!selectedConversationId || !conversations) return;

		const matchingConversation = conversations.find(
			(conversation) => conversation.id === selectedConversationId,
		);

		if (matchingConversation) {
			setSelectedConversation(matchingConversation);
		}
	}, [conversations, selectedConversationId]);

	const { data: currentUser, isLoading: currentUserLoading } = useQuery(
		trpc.auth.authenticatedUser.queryOptions(undefined, {
			enabled: isAuthenticated,
		}),
	);

	const { data: friendshipState } = useQuery(
		trpc.friends.getRelationship.queryOptions(
			{
				userId: selectedConversation?.peerUserId || "",
			},
			{
				enabled:
					isAuthenticated &&
					!!selectedConversation?.peerUserId &&
					selectedConversation.kind === "DIRECT",
			},
		),
	);

	const sendMessageMutation = useMutation(
		trpc.messages.sendMessage.mutationOptions({
			onSuccess: (message) => {
				setMessageText("");
				socketChat.emit("private:message", message);
			},
		}),
	);

	const sendFriendRequestMutation = useMutation(
		trpc.friends.sendRequest.mutationOptions({
			onSuccess: (result) => {
				toast.success(
					"autoAccepted" in result && result.autoAccepted
						? "Friend request accepted."
						: "Friend request sent.",
				);
				void queryClient.invalidateQueries({
					queryKey: [["friends", "getRelationship"]],
				});
			},
			onError: (error) => {
				toast.error(error.message || "Unable to update friendship");
			},
		}),
	);

	const scrollToBottom = () => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	};

	useEffect(() => {
		scrollToBottom();
	}, [messagesList]);

	const handleSendMessage = () => {
		if (!messageText.trim() || !selectedConversation) return;

		if (currentUser) {
			const messagePayload = {
				conversationId: selectedConversation.id,
				senderId: currentUser.id,
				content: messageText.trim(),
			};

			sendMessageMutation.mutate(messagePayload);
		}
	};

	const getTimeAgo = (date: Date, now: Date) => {
		const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

		if (diffInMinutes < 1) return "Just now";
		if (diffInMinutes === 1) return "1m ago";
		if (diffInMinutes < 60) return `${diffInMinutes}m ago`;

		const diffInHours = Math.floor(diffInMinutes / 60);
		if (diffInHours === 1) return "1h ago";
		if (diffInHours < 24) return `${diffInHours}h ago`;

		const diffInDays = Math.floor(diffInHours / 24);
		if (diffInDays === 1) return "1d ago";
		return `${diffInDays}d ago`;
	};

	const getConversationIcon = (kind: ConversationListItem["kind"]) => {
		if (kind === "TEAM_INTERNAL" || kind === "TEAM_CONNECTION") {
			return <UsersIcon className="h-4 w-4" />;
		}

		return <MessageCircleIcon className="h-4 w-4" />;
	};

	const normalizeMessageDates = useCallback(
		(msg: SerializedPrivateMessage): TMessage & { sender: TUser } => {
			return {
				...msg,
				createdAt:
					typeof msg.createdAt === "string" ? new Date(msg.createdAt) : msg.createdAt,
				updatedAt:
					typeof msg.updatedAt === "string" ? new Date(msg.updatedAt) : msg.updatedAt,
			};
		},
		[],
	);

	useEffect(() => {
		selectedConversationRef.current = selectedConversation;
	}, [selectedConversation]);

	const friendshipButtonLabel =
		friendshipState?.status === "ACCEPTED"
			? "Friends"
			: friendshipState?.status === "OUTGOING_PENDING"
				? "Request Sent"
				: friendshipState?.status === "BLOCKED"
					? "Blocked"
					: "Add Friend";

	const friendshipButtonDisabled =
		sendFriendRequestMutation.isPending ||
		friendshipState?.status === "ACCEPTED" ||
		friendshipState?.status === "OUTGOING_PENDING" ||
		friendshipState?.status === "BLOCKED";

	const handleSelectConversation = (conversation: ConversationListItem) => {
		setSelectedConversation(conversation);
		router.replace(`/messages?conversationId=${conversation.id}`);
	};

	useEffect(() => {
		if (!currentUser?.id) return;

		const conversationsIds = conversations?.map((e) => e.id) || [];

		socketChat.connect();

		socketChat.emit("private:join", {
			userId: currentUser.id,
			conversations: conversationsIds,
		});

		const handleMessage = (msg: SerializedPrivateMessage) => {
			const normalizedMsg = normalizeMessageDates(msg);

			if (normalizedMsg.conversationId === selectedConversationRef.current?.id) {
				setMessagesList((prev = []) => {
					return [...prev, normalizedMsg];
				});
			}

			setConversationsList((prev = []) => {
				return prev.map((conversation) =>
					conversation.id === normalizedMsg.conversationId
						? {
								...conversation,
								lastMessage: normalizedMsg,
							}
						: conversation,
				);
			});
		};

		const handleError = (err: string) => {
			console.error("Private chat error:", err);
			// optionally show a toast here
		};

		socketChat.on("private:message", handleMessage);
		socketChat.on("private:error", handleError);

		return () => {
			socketChat.off("private:message");
			socketChat.off("private:error");
			socketChat.disconnect();
		};
	}, [currentUser?.id, conversations, normalizeMessageDates]);

	if (status === "unauthenticated") {
		return (
			<div className="container mx-auto pt-8 px-6 pb-6">
				<div className="mb-6">
					<h1 className="text-3xl font-bold text-cyan-400 mb-2">Messages</h1>
					<p className="text-gray-300">Stay connected with your team and coordinate scrims.</p>
				</div>

				<Card className="bg-gray-900/50 border-cyan-500/20">
					<CardContent className="py-16 text-center">
						<MessageCircleIcon className="h-16 w-16 text-gray-500 mx-auto mb-4" />
						<h2 className="text-xl font-medium text-gray-200 mb-2">
							You are not logged in
						</h2>
						<p className="text-gray-400">
							Sign in to view your conversations and send messages.
						</p>
					</CardContent>
				</Card>
			</div>
		);
	}

	return (
		<div className="container mx-auto pt-8 px-6 pb-6 flex flex-col h-full">
			<div className="mb-6 flex-shrink-0">
				<h1 className="text-3xl font-bold text-cyan-400 mb-2">Messages</h1>
				<p className="text-gray-300">
					Stay connected with your team and coordinate scrims.
				</p>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
				{/* Conversations Sidebar */}
				<div className="lg:col-span-1 min-h-0 max-h-[40vh] lg:max-h-none">
					<Card className="bg-gray-900/50 border-cyan-500/20 h-full flex flex-col">
						<CardHeader className="pb-4">
							<div className="flex items-center justify-between">
								<CardTitle className="text-cyan-400">Conversations</CardTitle>
								<Button
									size="sm"
									className="bg-cyan-600 hover:bg-cyan-700"
									onClick={() => setShowNewMessageModal(true)}
								>
									<PlusIcon className="h-4 w-4" />
								</Button>
							</div>

							{/* Search and Filter */}
							<div className="space-y-3">
								<div className="relative">
									<SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
									<Input
										placeholder="Search conversations..."
										value={searchTerm}
										onChange={(e) => setSearchTerm(e.target.value)}
										className="pl-10 bg-gray-800 border-gray-600"
									/>
								</div>

								<Select
									value={conversationType}
									onValueChange={(value) =>
										setConversationType(
											value as "all" | "direct" | "group" | "team",
										)
									}
								>
									<SelectTrigger className="bg-gray-800 border-gray-600">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										{CONVERSATION_TYPES.map((type) => (
											<SelectItem key={type.value} value={type.value}>
												{type.label}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
						</CardHeader>

						<CardContent className="flex-1 overflow-y-auto p-0">
							{conversationsLoading ? (
								<div className="text-center py-8">
									<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400 mx-auto"></div>
									<p className="text-gray-300 mt-2">Loading conversations...</p>
								</div>
							) : conversationsList && conversationsList.length > 0 ? (
								<div className="space-y-1 p-4">
									{conversationsList.map((conversation) => {
										const Icon = getConversationIcon(conversation.kind);
										const lastMessage = conversation.lastMessage;
										const hasUnreadIncomingMessage =
											!!lastMessage &&
											!lastMessage.isRead &&
											lastMessage.senderId !== currentUser?.id;

										return (
											<div
												key={conversation.id}
												onClick={() => handleSelectConversation(conversation)}
												className={`p-3 rounded-lg cursor-pointer transition-colors ${
													selectedConversation?.id === conversation.id
														? "bg-cyan-600/20 border border-cyan-500/40"
														: "hover:bg-gray-800/50"
												}`}
											>
												<div className="flex items-center gap-3">
													<div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center">
														{/* <Icon className="h-5 w-5 text-gray-400" /> */}
														{Icon}
													</div>

													<div className="flex-1 min-w-0">
														<div className="flex items-center justify-between">
															<h4 className="font-medium text-cyan-400 truncate">
																{conversation.displayName}
															</h4>
															<div className="flex items-center justify-between gap-2">
																<Badge
																	variant="outline"
																	className="text-xs"
																>
																	{conversation.kindLabel}
																</Badge>
																{hasUnreadIncomingMessage && (
																	<Badge className="bg-cyan-600 text-xs">
																		New
																	</Badge>
																)}
															</div>
														</div>

														<div className="flex justify-between items-center gap-2">
															{lastMessage && (
																<p className="text-sm text-gray-400 truncate mt-1">
																	{lastMessage.content}
																</p>
															)}
															{lastMessage && (
																<span className="text-xs text-gray-500 min-w-fit">
																	{getTimeAgo(lastMessage.createdAt, now)}
																</span>
															)}
														</div>
													</div>
												</div>
											</div>
										);
									})}
								</div>
							) : (
								<div className="text-center py-8 px-4">
									<MessageCircleIcon className="h-12 w-12 text-gray-500 mx-auto mb-4" />
									<h3 className="text-lg font-medium text-gray-300 mb-2">
										No conversations
									</h3>
									<p className="text-gray-500 text-sm">
										Start a new conversation to get started.
									</p>
								</div>
							)}
						</CardContent>
					</Card>
				</div>

				{/* Message Thread */}
				<div className="lg:col-span-2 min-h-0">
					{selectedConversation ? (
						<Card className="bg-gray-900/50 border-cyan-500/20 h-full flex flex-col">
							{/* Chat Header */}
							<CardHeader className="border-b border-gray-700">
								<div className="flex items-center justify-between gap-4">
									<div className="flex items-center gap-3">
										<div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center">
											<MessageCircleIcon className="h-5 w-5 text-gray-400" />
										</div>
										<div>
											<h3 className="font-medium text-cyan-400">
												{selectedConversation.displayName}
											</h3>
											<p className="text-sm text-gray-400">
												{selectedConversation.participants.length} participants
											</p>
										</div>
									</div>

									{selectedConversation.kind === "DIRECT" &&
										selectedConversation.peerUserId && (
											<div className="flex items-center gap-2">
												<Link
													href={`/profile/${selectedConversation.peerUserId}/stats`}
												>
													<Button
														variant="outline"
														size="sm"
														className="border-cyan-500 text-cyan-400"
													>
														View Profile
													</Button>
												</Link>
												<Button
													variant="outline"
													size="sm"
													className="border-cyan-500 text-cyan-400"
													disabled={friendshipButtonDisabled}
													onClick={() =>
														sendFriendRequestMutation.mutate({
															addresseeId:
																selectedConversation.peerUserId!,
														})
													}
												>
													<UserPlusIcon className="h-4 w-4 mr-2" />
													{friendshipButtonLabel}
												</Button>
											</div>
										)}
								</div>
							</CardHeader>

							{/* Messages */}
							<CardContent className="flex-1 overflow-y-auto p-4">
								{messagesLoading ? (
									<div className="text-center py-8">
										<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400 mx-auto"></div>
										<p className="text-gray-300 mt-2">Loading messages...</p>
									</div>
								) : messagesList && messagesList.length > 0 ? (
									<div className="space-y-4">
										{messagesList.map((message) => (
											<div
												key={message.id}
												className={`flex ${
													message.senderId === currentUser?.id
														? "justify-end"
														: "justify-start"
												}`}
											>
												<div
													className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
														message.senderId === currentUser?.id
															? "bg-cyan-600 text-white"
															: "bg-gray-800 text-gray-300"
													}`}
												>
													{message.senderId !== currentUser?.id && (
														<p className="text-xs text-cyan-400 mb-1">
															{message.sender.name}
														</p>
													)}
													<p className="text-sm">{message.content}</p>
													<p className="text-xs opacity-70 mt-1">
														<LocalizedDateTime
															date={message.createdAt}
															options={{
																timeStyle: "short",
															}}
														/>
													</p>
												</div>
											</div>
										))}
										<div ref={messagesEndRef} />
									</div>
								) : (
									<div className="text-center py-8">
										<MessageCircleIcon className="h-12 w-12 text-gray-500 mx-auto mb-4" />
										<h3 className="text-lg font-medium text-gray-300 mb-2">
											No messages yet
										</h3>
										<p className="text-gray-500">Start the conversation!</p>
									</div>
								)}
							</CardContent>

							{/* Message Input */}
							<div className="border-t border-gray-700 p-4 flex-shrink-0">
								<div className="flex items-end gap-3">
									<div className="flex-1">
										<Textarea
											placeholder="Type your message..."
											value={messageText}
											onChange={(e) => setMessageText(e.target.value)}
											onKeyDown={(e) => {
												if (e.key === "Enter" && !e.shiftKey) {
													e.preventDefault();
													handleSendMessage();
												}
											}}
											className="bg-gray-800 border-gray-600 resize-none min-h-[60px]"
											rows={2}
										/>
									</div>

									<div className="flex items-center gap-2">
										{/* <Button
											variant="outline"
											size="sm"
											className="border-cyan-500 text-cyan-400"
										>
											<PaperclipIcon className="h-4 w-4" />
										</Button>
										<Button
											variant="outline"
											size="sm"
											className="border-cyan-500 text-cyan-400"
										>
											<SmileIcon className="h-4 w-4" />
										</Button> */}
										<Button
											onClick={handleSendMessage}
											disabled={
												!messageText.trim() || sendMessageMutation.isPending
											}
											className="bg-cyan-600 hover:bg-cyan-700"
										>
											<SendIcon className="h-4 w-4" />
										</Button>
									</div>
								</div>
							</div>
						</Card>
					) : (
						<Card className="bg-gray-900/50 border-cyan-500/20 h-full flex items-center justify-center">
							<div className="text-center">
								<MessageCircleIcon className="h-16 w-16 text-gray-500 mx-auto mb-4" />
								<h3 className="text-xl font-medium text-gray-300 mb-2">
									Select a conversation
								</h3>
								<p className="text-gray-500">
									Choose a conversation from the sidebar to start messaging.
								</p>
							</div>
						</Card>
					)}
				</div>
			</div>

			<NewConversationModal
				open={showNewMessageModal}
				onOpenChange={setShowNewMessageModal}
				onSuccess={() => {
					void queryClient.invalidateQueries({
						queryKey: [["messages", "listConversations"]],
					});
				}}
			/>
		</div>
	);
}

function useNow(intervalMs = 10000) {
	const [now, setNow] = useState(() => new Date());

	useEffect(() => {
		const id = setInterval(() => {
			setNow(new Date());
		}, intervalMs);

		return () => clearInterval(id);
	}, [intervalMs]);

	return now;
}
