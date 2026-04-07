import useDraft from "@/hooks/use-draft";
import { getChampionImage } from "@/lib/champions";
import { cn } from "@/lib/utils";
import { TDraftTeam } from "@compesn/shared/common/types/draft-team";
import { TDraftState } from "@compesn/shared/common/types/state";
import { TTeamColor } from "@compesn/shared/common/types/team-color";
import { TTurn } from "@compesn/shared/common/types/turn";
import { ShieldIcon, SwordIcon, XIcon } from "lucide-react";
import Image from "next/image";

export default function DraftTeamData({
	teamColor,
	teamData,
	currentTurn,
	draftState,
	className,
}: {
	teamColor: TTeamColor;
	teamData: TDraftTeam;
	currentTurn?: TTurn;
	draftState: TDraftState;
	className?: string;
}) {
	const { player } = useDraft();
	const team = teamColor === "blue" ? "Blue" : "Red";
	const isBanningPhase = currentTurn?.type === "ban";
	const isPickingPhase = currentTurn?.type === "pick";

	return (
		<div className={cn("col-span-3 h-full max-h-full overflow-y-auto", className)}>
			<div
				className={cn(
					"bg-black/20 backdrop-blur-xl border rounded-2xl shadow-2xl flex flex-col h-full overflow-y-auto",
					teamColor === "blue" ? "border-blue-500/20" : "border-red-500/20",
				)}
			>
				{/* Team Header */}
				<div
					className={cn(
						"bg-gradient-to-r backdrop-blur-md p-3 border-b",
						teamColor === "blue"
							? "from-blue-600/30 to-blue-500/30 border-blue-400/20"
							: "from-red-600/30 to-red-500/30 border-red-400/20",
					)}
				>
					<div className="flex items-center gap-3">
						{currentTurn?.team === teamColor &&
							draftState !== "waiting" &&
							draftState !== "finished" && (
								<div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
							)}
						{teamColor === "blue" ? (
							<ShieldIcon className="text-blue-400" size={16} />
						) : (
							<SwordIcon className="text-red-400" size={16} />
						)}
						<div className="flex items-center justify-center gap-1">
							<span
								className={cn(
									"font-bold text-sm",
									player.team === teamColor && "underline",
								)}
							>
								{team} Side{" "}
							</span>
							{teamData.ready && <span className="font-bold text-sm">(ready)</span>}
						</div>
					</div>
					{/* {!player.team && (
						<motion.button
							whileHover={{ scale: 1.02 }}
							whileTap={{ scale: 0.98 }}
							className={cn(
								"mt-2 w-full px-3 py-1.5  backdrop-blur-md border text-white font-medium rounded-lg transition-all duration-200 text-xs",
								teamColor === "blue"
									? " bg-blue-600/50 hover:bg-blue-500/60 border-blue-400/30"
									: "bg-red-600/50 hover:bg-red-500/60 border-red-400/30"
							)}
							onClick={() => {
								joinTeam(
									room.id,
									room.drafts[room.currentDraft][teamColor]
										.id,
									false,
									true
								);
							}}
						>
							Join {team}
						</motion.button>
					)} */}
				</div>

				<div className="p-3 space-y-3 flex overflow-y-auto flex-col flex-1">
					{/* Bans */}
					<div className="shrink-0">
						<h4
							className={cn(
								"font-medium mb-2 text-xs uppercase tracking-wide",
								teamColor === "blue" ? "text-blue-400" : "text-red-400",
							)}
						>
							Bans
						</h4>
						<div
							className={`grid gap-1 transition-all duration-300 ${
								isBanningPhase ? "grid-cols-3" : "grid-cols-5"
							}`}
						>
							{[0, 1, 2, 3, 4].map((index) => (
								<div
									key={index}
									className={`bg-gray-800/30 backdrop-blur-md border border-gray-700/30 rounded-lg flex items-center justify-center overflow-hidden transition-all duration-300 ${
										isBanningPhase ? "aspect-square" : "aspect-[4/3]"
									}`}
								>
									{teamData.ban[index] ? (
										<div
											className={cn(
												"w-full h-full relative flex items-center justify-center",
											)}
										>
											<Image
												src={getChampionImage(teamData.ban[index].fileName)}
												alt={teamData.ban[index].name}
												width={380}
												height={380}
												className={cn(
													"w-full h-full object-cover",
													teamData.ban[index].fileName === "no-ban" &&
														"h-[80%] w-auto",
												)}
											/>
											<div className="absolute inset-0 bg-red-500/50 flex items-center justify-center">
												<XIcon
													className="text-white"
													size={isBanningPhase ? 14 : 10}
												/>
											</div>
										</div>
									) : (
										<div className="text-gray-500 text-xs">Ban {index + 1}</div>
									)}
								</div>
							))}
						</div>
					</div>

					{/* Picks */}
					<div className="shrink-0">
						<h4
							className={cn(
								"font-medium mb-2 text-xs uppercase tracking-wide",
								teamColor === "blue" ? "text-blue-400" : "text-red-400",
							)}
						>
							Team Composition
						</h4>
						<div className="space-y-1">
							{[0, 1, 2, 3, 4].map((index) => (
								<div
									key={index}
									className={`bg-gray-800/30 backdrop-blur-md border border-gray-700/30 rounded-lg flex items-center gap-2 transition-all duration-300 ${
										isPickingPhase ? "p-3" : "p-2"
									}`}
								>
									<div
										className={`rounded-lg overflow-hidden flex-shrink-0 transition-all duration-300 ${
											isPickingPhase ? "w-12 h-12" : "w-8 h-8"
										} ${
											teamColor === "blue"
												? "bg-blue-500/20"
												: "bg-red-500/20"
										}`}
									>
										{teamData.pick[index] ? (
											<Image
												src={getChampionImage(
													teamData.pick[index].fileName,
												)}
												alt={teamData.pick[index].name}
												width={380}
												height={380}
												className="w-full h-full object-cover"
											/>
										) : (
											<div
												className={`w-full h-full flex items-center justify-center font-bold ${
													isPickingPhase ? "text-xs" : "text-xs"
												} ${
													teamColor === "blue"
														? "text-blue-400"
														: "text-red-400"
												}`}
											>
												{index + 1}
											</div>
										)}
									</div>
									<div className="flex-1 min-w-0">
										{teamData.pick[index] ? (
											<div>
												<div
													className={`text-white font-medium truncate ${
														isPickingPhase ? "text-sm" : "text-xs"
													}`}
												>
													{teamData.pick[index].name}
												</div>
												<div
													className={`${
														teamColor === "blue"
															? "text-blue-400"
															: "text-red-400"
													} ${isPickingPhase ? "text-xs" : "text-xs"}`}
												>
													{teamData.pick[index].roles}
												</div>
											</div>
										) : (
											<div
												className={`text-gray-500 ${
													isPickingPhase ? "text-sm" : "text-xs"
												}`}
											>
												Pick {index + 1}
											</div>
										)}
									</div>
								</div>
							))}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
