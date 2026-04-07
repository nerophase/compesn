"use client";

import { useState } from "react";
import { usePrivateChat } from "@/hooks/use-private-chat";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export const PrivateChatPanel = () => {
	const { currentUserId, threads, sendPrivateMessage } = usePrivateChat();
	const [activePeer, setActivePeer] = useState<string | null>(null);
	const [peerInput, setPeerInput] = useState("");
	const [message, setMessage] = useState("");

	const activeThread = threads.find((t) => t.peerUserId === activePeer);

	const handleSend = () => {
		if (!activePeer || !message.trim()) return;
		sendPrivateMessage(activePeer, message.trim());
		setMessage("");
	};

	return (
		<Card className="bg-gray-900/80 border-cyan-500/40 w-full max-w-xl h-[400px] flex flex-col">
			<CardHeader>
				<CardTitle className="text-cyan-400 flex items-center justify-between">
					Live DMs (not saved)
					<span className="text-xs text-gray-400">
						You: {currentUserId ?? "not signed in"}
					</span>
				</CardTitle>
			</CardHeader>
			<div className="flex flex-1 overflow-hidden">
				{/* Threads list */}
				<div className="w-48 border-r border-gray-700 flex flex-col">
					<div className="p-2">
						<Input
							placeholder="Peer userId..."
							value={peerInput}
							onChange={(e) => setPeerInput(e.target.value)}
							className="bg-gray-800 border-gray-600 text-xs"
						/>
						<Button
							size="sm"
							className="mt-2 w-full bg-cyan-600 hover:bg-cyan-700 text-xs"
							onClick={() => {
								if (!peerInput.trim()) return;
								setActivePeer(peerInput.trim());
								setPeerInput("");
							}}
						>
							Open DM
						</Button>
					</div>
					<div className="flex-1 overflow-y-auto text-xs">
						{threads.map((t) => (
							<div
								key={t.peerUserId}
								onClick={() => setActivePeer(t.peerUserId)}
								className={`px-3 py-2 cursor-pointer ${
									activePeer === t.peerUserId
										? "bg-cyan-600/30"
										: "hover:bg-gray-800/60"
								}`}
							>
								{t.peerUserId}
								<div className="text-[10px] text-gray-400">
									{t.messages.length} messages
								</div>
							</div>
						))}
					</div>
				</div>

				{/* Active thread */}
				<div className="flex-1 flex flex-col">
					<CardContent className="flex-1 overflow-y-auto space-y-2 text-sm">
						{activePeer ? (
							activeThread && activeThread.messages.length > 0 ? (
								activeThread.messages.map((m, idx) => (
									<div
										key={idx}
										className={`flex ${
											m.fromUserId === currentUserId
												? "justify-end"
												: "justify-start"
										}`}
									>
										<div
											className={`px-3 py-2 rounded-lg max-w-xs ${
												m.fromUserId === currentUserId
													? "bg-cyan-600 text-white"
													: "bg-gray-800 text-gray-200"
											}`}
										>
											<div className="text-[10px] text-gray-300 mb-1">
												{m.fromUserId}
											</div>
											<div>{m.text}</div>
										</div>
									</div>
								))
							) : (
								<div className="text-gray-500 text-xs">
									No messages yet. Say hi to {activePeer}.
								</div>
							)
						) : (
							<div className="text-gray-500 text-xs">
								Select or open a DM on the left.
							</div>
						)}
					</CardContent>
					<div className="border-t border-gray-700 p-3 flex items-end gap-2">
						<Textarea
							rows={2}
							placeholder={
								activePeer
									? `Message ${activePeer} (not stored)`
									: "Select a peer first"
							}
							value={message}
							onChange={(e) => setMessage(e.target.value)}
							onKeyDown={(e) => {
								if (e.key === "Enter" && !e.shiftKey) {
									e.preventDefault();
									handleSend();
								}
							}}
							disabled={!activePeer}
							className="bg-gray-800 border-gray-600 text-sm resize-none"
						/>
						<Button
							onClick={handleSend}
							disabled={!activePeer || !message.trim()}
							className="bg-cyan-600 hover:bg-cyan-700"
							size="sm"
						>
							Send
						</Button>
					</div>
				</div>
			</div>
		</Card>
	);
};
