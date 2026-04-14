"use client";

import { useState } from "react";
import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTRPC } from "@/trpc/client";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { AppRouter } from "@/trpc/routers/_app";

type ConversationListItem = Awaited<ReturnType<AppRouter["messages"]["listConversations"]>>[number];

export function FloatingChatButton() {
	const { data: session } = useSession();
	const trpc = useTRPC();
	const [isHovered, setIsHovered] = useState(false);

	// Only query conversations if user is logged in
	const { data: conversations } = useQuery(
		trpc.messages.listConversations.queryOptions({
			search: "",
			type: null,
			limit: 50,
			offset: 0,
		}, {
			enabled: !!session?.user && false, // TODO: DISABLED TEMPORARILY
			refetchInterval: 30000,
		}),
	);

	// Count unread conversations (conversations with unread messages)
	const unreadCount =
		(conversations as ConversationListItem[] | undefined)?.filter(
			(c) =>
				c.lastMessage &&
				!c.lastMessage.isRead &&
				c.lastMessage.senderId !== session?.user?.id,
		).length ?? 0;

	// Don't show if not logged in
	if (!session?.user) {
		return null;
	}

	return (
		<div className="fixed bottom-6 right-6 z-50">
			<Link href="/messages">
				<motion.div
					onHoverStart={() => setIsHovered(true)}
					onHoverEnd={() => setIsHovered(false)}
					whileHover={{ scale: 1.05 }}
					whileTap={{ scale: 0.95 }}
				>
					<Button className="h-14 w-14 rounded-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 shadow-lg shadow-cyan-500/30 border border-cyan-400/30 relative">
						<MessageCircle className="h-6 w-6 text-white" />

						{/* Unread indicator */}
						<AnimatePresence>
							{unreadCount > 0 && (
								<motion.div
									initial={{ scale: 0, opacity: 0 }}
									animate={{ scale: 1, opacity: 1 }}
									exit={{ scale: 0, opacity: 0 }}
									className="absolute -top-1 -right-1"
								>
									<Badge className="h-6 min-w-6 rounded-full bg-red-500 text-white text-xs flex items-center justify-center px-1.5 border-2 border-gray-900">
										{unreadCount > 99 ? "99+" : unreadCount}
									</Badge>
								</motion.div>
							)}
						</AnimatePresence>

						{/* Pulse animation ring */}
						{unreadCount > 0 && (
							<span className="absolute inset-0 rounded-full animate-ping bg-cyan-400/30" />
						)}
					</Button>

					{/* Tooltip on hover */}
					<AnimatePresence>
						{isHovered && (
							<motion.div
								initial={{ opacity: 0, x: 10 }}
								animate={{ opacity: 1, x: 0 }}
								exit={{ opacity: 0, x: 10 }}
								className="absolute right-full mr-3 top-1/2 -translate-y-1/2 bg-gray-800 text-white px-3 py-1.5 rounded-md text-sm whitespace-nowrap shadow-lg border border-cyan-500/20"
							>
								{unreadCount > 0 ? `${unreadCount} unread messages` : "Messages"}
							</motion.div>
						)}
					</AnimatePresence>
				</motion.div>
			</Link>
		</div>
	);
}
