import useDraft from "@/hooks/use-draft";
import { ClockIcon } from "lucide-react";

export default function DraftStatusIndicator() {
	const { room, activeDraft } = useDraft();
	const draft = room.drafts[activeDraft];

	return (
		<div className="col-start-2 h-12 flex items-center justify-center">
			<div className="text-center">
				{draft.state === "finished" ? (
					<div>
						<div className="text-xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent mb-1">
							DRAFT COMPLETE
						</div>
						{/* <p className="text-gray-400 text-sm">
							Ready for battle!
						</p> */}
					</div>
				) : (
					<div className="flex items-center justify-center gap-4">
						<Timer />

						{draft.turn && (
							<div className="flex items-center gap-2">
								<div
									className={`w-3 h-3 rounded-full ${
										draft.turn.team === "blue" ? "bg-blue-500" : "bg-red-500"
									}`}
								></div>
								<div className="text-lg font-semibold">
									{draft.turn.team === "blue" ? "Blue Side" : "Red Side"} -{" "}
									<span className="text-cyan-400">
										{draft.turn.type === "ban" ? "Banning" : "Picking"}
									</span>
								</div>
							</div>
						)}
					</div>
				)}
			</div>
		</div>
	);
}

function Timer() {
	const { totalSeconds } = useDraft();

	return (
		<div className="flex items-center gap-2">
			<ClockIcon className="text-cyan-400" size={20} />
			<div className="text-xl font-bold text-white">
				{/* {Math.trunc(
		clamp(
			draft.currentTurnTime - elapsedTime,
			0,
			draft.currentTurnTime
		)
	)} */}
				{Math.floor(totalSeconds / 60)}:{(totalSeconds % 60).toString().padStart(2, "0")}
			</div>
		</div>
	);
}
