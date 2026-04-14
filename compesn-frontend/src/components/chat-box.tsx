"use client";

import { memo, useCallback, useEffect, useRef, useState } from "react";
import { cleanString } from "@/utils/sanitizer";
import useDraft from "@/hooks/use-draft";
import { draftTeamTextColor } from "@/lib/utils";
import { ArrowRightLeftIcon } from "lucide-react";
import { TMessage } from "@compesn/shared/types/message";

const ChatBox = memo(function ChatBox({
	messages,
	onSubmit,
}: {
	messages: TMessage[];
	onSubmit: (message: string, toAll: boolean) => void;
}) {
	const { player } = useDraft();
	const messagesBoxRef = useRef<HTMLDivElement>(null);
	const scrollToBottom = useCallback(() => {
		messagesBoxRef.current?.scrollTo({
			top: messagesBoxRef.current.scrollHeight,
			left: 0,
		});
	}, []);

	useEffect(() => {
		scrollToBottom();
	}, [messages, scrollToBottom]);

	return (
		<div className="w-full h-full flex flex-col">
			<div
				className="w-full h-full flex gap-2 flex-col overflow-y-auto py-1 fade-t"
				ref={messagesBoxRef}
			>
				{messages.map((msg) => {
					return (
						<div className="w-full h-auto" key={msg.id}>
							<span className={`font-bold ${draftTeamTextColor(msg.team)}`}>
								{msg.name}
								{msg.all ? " (all): " : ` (team): `}
							</span>
							<span
								className="chat-msg"
								// dangerouslySetInnerHTML={{
								// 	__html: showdownConverter.makeHtml(
								// 		msg.text
								// 	),
								// }}
							>
								{msg.text}
							</span>
						</div>
					);
				})}
			</div>
			{player.team && <ChatInput onSubmit={onSubmit} scrollToBottom={scrollToBottom} />}
		</div>
	);
});

const ChatInput = memo(function ChatInput({
	onSubmit,
	scrollToBottom,
}: {
	onSubmit: (message: string, toAll: boolean) => void;
	scrollToBottom: () => void;
}) {
	const [toAll, setToAll] = useState<boolean>(false);
	const messageInputRef = useRef<HTMLInputElement>(null);

	return (
		<div className="w-full flex h-auto items-center bg-background opacity-100 rounded">
			<div
				className="mr-2 flex items-center shrink-0 bg-primary relative rounded-tl rounded-bl px-2 py-1 select-none hover:cursor-pointer"
				onClick={() => {
					setToAll(!toAll);
				}}
			>
				{/* <div className="w-4 h-4	mr-1 relative">
					<Image src={"/imgs/switch.svg"} fill alt="" />
				</div> */}
				<ArrowRightLeftIcon className="w-4 h-4 mr-1" />
				<span className="font-bold text-bg_primary">To ({toAll ? "All" : "Team"})</span>
			</div>
			<input
				type="text"
				className="w-full bg-transparent outline-none"
				// placeholder="Click the button on the left to toggle between all and team"
				placeholder="Send Message"
				ref={messageInputRef}
				onKeyDown={(e) => {
					const all = e.ctrlKey ? true : toAll;
					if (messageInputRef.current?.value && e.key === "Enter") {
						onSubmit(cleanString(messageInputRef.current.value), all);
						scrollToBottom();
						messageInputRef.current.value = "";
					}
				}}
			/>
		</div>
	);
});

export default ChatBox;
