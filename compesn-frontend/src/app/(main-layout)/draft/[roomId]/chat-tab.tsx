import useDraft from "@/hooks/use-draft";
import { cleanString } from "@/utils/sanitizer";
import { TMessage } from "@compesn/shared/common/types/message";
import { SendIcon } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

export default function ChatTab({
	messages,
	onSubmit,
}: {
	messages: TMessage[];
	onSubmit: (message: string, toAll: boolean) => void;
}) {
	const { player } = useDraft();
	const messagesBoxRef = useRef<HTMLDivElement>(null);
	const messageInputRef = useRef<HTMLInputElement>(null);
	const scrollToBottom = useCallback(() => {
		messagesBoxRef.current?.scrollTo({
			top: messagesBoxRef.current.scrollHeight,
			left: 0,
		});
	}, []);

	useEffect(() => {
		scrollToBottom();
	}, [messages, scrollToBottom]);

	const sendMessage = (toAll: boolean = false) => {
		if (messageInputRef.current?.value) {
			onSubmit(cleanString(messageInputRef.current.value), toAll);
			scrollToBottom();
			messageInputRef.current.value = "";
		}
	};

	return (
		<>
			<div className="flex-1 overflow-y-auto p-2 text-xs space-y-1" ref={messagesBoxRef}>
				{messages.map((msg) => (
					<div
						key={msg.id}
						className={`${
							msg.team === undefined
								? "text-gray-400 italic"
								: msg.team === "blue"
									? "text-blue-300"
									: "text-red-300"
						}`}
					>
						<span className="font-medium">
							{msg.all ? "[All] " : "[Team] "}
							{msg.name}:
						</span>{" "}
						{msg.text}
					</div>
				))}
			</div>

			{player.team && (
				<div className="flex-shrink-0 p-2 border-t border-white/10">
					<div className="flex gap-2">
						<input
							type="text"
							ref={messageInputRef}
							placeholder="Type a message (ctrl + enter: send to all)"
							className="flex-1 px-2 py-1 text-sm bg-gray-800/50 backdrop-blur-md border border-gray-600/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400 transition-colors"
							onKeyDown={(e) => {
								if (e.key === "Enter") {
									sendMessage(e.ctrlKey);
								}
							}}
						/>
						<button
							onClick={() => sendMessage()}
							title="Enter: Send to team | Ctrl + Enter: Send to all"
							className="px-2 py-1 text-sm bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg transition-colors"
						>
							<SendIcon size={14} />
						</button>
					</div>
				</div>
			)}
		</>
	);
}
