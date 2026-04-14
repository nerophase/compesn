import { TURNS } from "@/constants/turns";
import useDraft from "@/hooks/use-draft";
import { socket } from "@/lib/sockets";
import { motion } from "framer-motion";
import { PlayIcon } from "lucide-react";
import { useEffect, useState } from "react";

export default function DraftControls() {
	const [loadingDraftState, setLoadingDraftState] = useState<boolean>(false);
	const { room, player, activeDraft, selectedChampion } = useDraft();
	const draft = room.drafts[activeDraft];
	const teamReady = player.team && draft[player.team].ready;
	const currentTurn = draft.turn;

	useEffect(() => {
		const stopLoading = () => {
			setLoadingDraftState(false);
		};

		socket.on("draft:updated-status", () => {
			setLoadingDraftState(false);
		});
		socket.on("error:room", stopLoading);
		socket.on("error:not-connected", stopLoading);
		socket.on("error:joining-room", stopLoading);

		return () => {
			socket.off("draft:updated-status");
			socket.off("error:room", stopLoading);
			socket.off("error:not-connected", stopLoading);
			socket.off("error:joining-room", stopLoading);
		};
	}, []);

	if (!draft || !player.socketId) return;

	return (
		<div className="flex items-center gap-4 col-start-1">
			<div className="flex items-center gap-3">
				{
					draft.state === "waiting" && player.team && (
						<motion.button
							whileHover={{ scale: 1.05 }}
							whileTap={{ scale: 0.95 }}
							onClick={() => {
								if (draft.state === "waiting" && !loadingDraftState) {
									socket.emit("draft:set-ready", {
										ready: !teamReady,
									});
									setLoadingDraftState(true);
								}
							}}
							className="px-4 h-8 w-fit bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-white font-semibold rounded-lg shadow-lg hover:shadow-emerald-500/25 transition-all duration-200 flex items-center gap-2"
						>
							<PlayIcon size={14} fill="white" />
							{!teamReady ? "Start Draft" : "Cancel"}
						</motion.button>
					)
				}

				{draft.state === "waiting" && !player.team && (
					<span className="text-sm text-gray-400">
						Join a team to start the draft.
					</span>
				)}

				{draft.state === "ongoing" && selectedChampion && (
					<div className="flex justify-center">
						<motion.button
							whileHover={{ scale: 1.05 }}
							whileTap={{ scale: 0.95 }}
							onClick={() => {
								if (!draft.turn?.number) return;
								socket.emit("draft:lock-champion", {
									turnNumber: draft.turn.number,
								});
							}}
							className="px-4 h-8 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold rounded-lg shadow-lg hover:shadow-cyan-500/25 transition-all duration-200"
						>
							Confirm {draft.turn?.type === "ban" && "Ban: "}
							{draft.turn?.type === "pick" && "Pick: "}
							{selectedChampion.name}
						</motion.button>
					</div>
				)}

				{currentTurn &&
					currentTurn.number >= 2 &&
					TURNS[currentTurn.number - 2].team === player.team &&
					// elapsedTime <= 5 &&
					room.drafts[room.currentDraft].canRepeatPreviousTurn && ( // !turnTimeIsOver &&
						<RepeatPreviousTurnButton />
					)}
			</div>
		</div>
	);
}

function RepeatPreviousTurnButton() {
	const { player, totalSeconds, room, activeDraft } = useDraft();
	const draft = room.drafts[activeDraft];
	const elapsedTime = draft.turn ? room.time[draft.turn.type] - totalSeconds : null;

	if (elapsedTime && elapsedTime <= 5)
		return (
			<motion.button
				whileHover={{ scale: 1.05 }}
				whileTap={{ scale: 0.95 }}
				className="px-6 h-8 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold rounded-xl shadow-lg hover:shadow-cyan-500/25 transition-all duration-200"
				onClick={() => {
					if (player.team) {
						socket.emit("draft:request-repeat-previous-turn", player.team);
					}
				}}
			>
				Repeat Previous Turn
			</motion.button>
		);
}
