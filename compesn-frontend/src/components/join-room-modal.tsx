import { memo } from "react";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { TJoinTeamFunction } from "@/app/(main-layout)/draft/[roomId]/page";
import { TRoom } from "@compesn/shared/common/types/room";

const JoinRoomModal = memo(function JoinRoomModal({
	room,
	isActive,
	onJoinTeam,
}: {
	room: TRoom;
	isActive: boolean;
	onJoinTeam: TJoinTeamFunction;
}) {
	const draft = room.drafts[room.currentDraft];

	return (
		<Dialog open={isActive}>
			<DialogContent showCloseButton={false} className="sm:max-w-lg">
				<DialogHeader className="items-center">
					<DialogTitle className="text-2xl font-bold">Join Draft</DialogTitle>
					<DialogDescription className="text-center">
						Choose a side to join this draft room or enter as a spectator.
					</DialogDescription>
				</DialogHeader>
				<div className="w-full flex flex-col gap-6 p-2">
					{/* Team Selection Buttons */}
					<div className="grid grid-cols-2 gap-6">
						{/* Blue Team Button */}
						<Button
							onClick={() => onJoinTeam(room.id, draft.blue.id, true, true)}
							disabled={false}
							className="
								relative h-32 w-full bg-gradient-to-br from-blue-500 to-blue-600 
								hover:from-blue-400 hover:to-blue-500 
								active:from-blue-600 active:to-blue-700
								text-white font-bold text-lg shadow-lg
								transform transition-all duration-200 ease-out
								hover:scale-105 hover:shadow-xl hover:-translate-y-1
								active:scale-95 active:shadow-md
								border-2 border-blue-400/30 hover:border-blue-300/50
								group overflow-hidden
							"
						>
							<div
								className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent 
								transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"
							></div>
							<div className="relative z-10 flex flex-col items-center gap-2">
								<div className="text-2xl font-black tracking-wide">
									{draft.blue.name}
								</div>
								<div className="text-sm opacity-70 font-semibold">Blue Team</div>
							</div>
						</Button>

						{/* Red Team Button */}
						<Button
							onClick={() => onJoinTeam(room.id, draft.red.id, true, true)}
							disabled={false}
							className="
								relative h-32 w-full bg-gradient-to-br from-red-500 to-red-600 
								hover:from-red-400 hover:to-red-500 
								active:from-red-600 active:to-red-700
								text-white font-bold text-lg shadow-lg
								transform transition-all duration-200 ease-out
								hover:scale-105 hover:shadow-xl hover:-translate-y-1
								active:scale-95 active:shadow-md
								border-2 border-red-400/30 hover:border-red-300/50
								group overflow-hidden
							"
						>
							<div
								className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent 
								transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"
							></div>
							<div className="relative z-10 flex flex-col items-center gap-2">
								<div className="text-2xl font-black tracking-wide">
									{draft.red.name}
								</div>
								<div className="text-sm opacity-70 font-semibold">Red Team</div>
							</div>
						</Button>
					</div>

					{/* Spectator Button */}
					<Button
						onClick={() => onJoinTeam(room.id, "spectators", false, false)}
						disabled={false}
						className="
							relative h-12 bg-gradient-to-r from-gray-600 to-gray-700 
							hover:from-gray-500 hover:to-gray-600 
							active:from-gray-700 active:to-gray-800
							text-white font-semibold
							transform transition-all duration-200 ease-out
							hover:scale-102 hover:shadow-lg hover:-translate-y-0.5
							active:scale-98 active:shadow-sm
							border border-gray-500/30 hover:border-gray-400/50
							group overflow-hidden
						"
					>
						<div
							className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent 
							transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-500"
						></div>
						<div className="relative z-10 flex items-center gap-2">
							<svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
								<path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
								<path
									fillRule="evenodd"
									d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
									clipRule="evenodd"
								/>
							</svg>
							<span>Spectate</span>
						</div>
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
});

export default JoinRoomModal;
