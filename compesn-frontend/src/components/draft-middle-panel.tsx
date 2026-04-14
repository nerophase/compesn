import { TTeamColor } from "@compesn/shared/types/team-color";
import { TURNS } from "@/constants/turns";
import useDraft from "@/hooks/use-draft";
import { socket } from "@/lib/sockets";
import { clamp, cn } from "@/lib/utils";
import { RotateCcwIcon, Check, TriangleIcon, LucideIcon, Lightbulb } from "lucide-react";
import { memo, useEffect, useState } from "react";

const DraftMiddlePanel = memo(function DraftMiddlePanel({
	team,
}: {
	team: TTeamColor | undefined;
}) {
	const [loadingDraftState, setLoadingDraftState] = useState<boolean>(false);
	const { room, player, styles, activeDraft } = useDraft();
	const draft = room.drafts[activeDraft];

	useEffect(() => {
		socket.on("draft:updated-status", () => {
			setLoadingDraftState(false);
		});

		return () => {
			socket.off("draft:updated-status");
		};
	}, []);

	if (!draft || !player.socketId) return;

	const state = draft?.state;

	const teamReady = player.team && draft[player.team].ready;

	switch (state) {
		case "waiting":
		case "finished":
			return (
				<div className="h-full flex items-center justify-center" style={{ width: 200 }}>
					<span
						className={`w-auto h-full rotated-text text-center font-bold text-[3.5rem] overflow-clip select-none ${
							styles.textColor
						} ${state !== "finished" && "hover:cursor-pointer"}`}
						onClick={() => {
							if (state === "waiting" && !loadingDraftState) {
								socket.emit("draft:set-ready", {
									ready: !teamReady,
								});
								setLoadingDraftState(true);
							}
						}}
					>
						{state === "finished" && "FINISHED"}
						{state === "waiting" && team && teamReady && "WAITING"}
						{state === "waiting" && team && !teamReady && "READY"}
					</span>
				</div>
			);
		case "ongoing":
			return <OngoingPanel />;
	}
});

const OngoingPanel = memo(function OngoingPanel() {
	const {
		room,
		player,
		styles,
		activeDraft,
		totalSeconds,
		selectedChampion,
		setSelectedChampion,
		addMessageToChatBox,
	} = useDraft();
	const draft = room.drafts[activeDraft];
	const currentTurn = draft.turn;
	const currentTeam: TTeamColor | undefined = currentTurn?.team;
	const elapsedTime = draft.currentTurnTime - totalSeconds;

	return (
		<div className="shrink-0 h-full" style={{ width: 200 }}>
			<div className="w-full h-full flex flex-col">
				<div className="w-full flex items-center justify-between shrink-0 gap-2 h-16">
					{currentTurn &&
						currentTurn.number >= 2 &&
						TURNS[currentTurn.number - 2].team === player.team &&
						elapsedTime <= 5 &&
						room.drafts[room.currentDraft].canRepeatPreviousTurn && ( // !turnTimeIsOver &&
							<PanelButton
								Icon={RotateCcwIcon}
								onClick={() => {
									if (player.team) {
										socket.emit("draft:request-repeat-previous-turn", player.team);
									}
								}}
								bgColor={styles.bgColor}
							/>
						)}
					{currentTeam === player.team &&
						selectedChampion && ( // !turnTimeIsOver &&
							<PanelButton
								Icon={true ? Check : Lightbulb} // ifthe  player was not capt they could suggest champions
								onClick={() => {
									// Confirm and Suggest Pick/Ban (add tooltip)
									if (!currentTurn?.number) return;
									socket.emit("draft:lock-champion", {
										turnNumber: currentTurn.number,
									});

									// Suggest pick/ban
									// const message = {
									// 	name: "COMPESN",
									// 	team: undefined,
									// 	all: false,
									// 	text: `${player.name} suggested to ${draft.turn?.type} ${selectedChampion}`,
									// };
									// socket.emit("chat:message", message);
									// addMessageToChatBox(
									// 	message.name,
									// 	message.team,
									// 	message.all,
									// 	message.text
									// );

									setSelectedChampion(null);
								}}
								bgColor={styles.bgColor}
							/>
						)}
				</div>
				<Timer
					time={draft.currentTurnTime}
					elapsedTime={elapsedTime}
					showTimer={draft.currentTurnTime >= 0}
				/>
				<div className="flex items-center justify-center h-16 shrink-0">
					<TriangleIcon
						className={cn(
							currentTeam === "blue" && "-rotate-90",
							currentTeam === "red" && "rotate-90",
						)}
						fill="#D9D9D9"
						stroke="#D9D9D9"
						size={32}
					/>
				</div>
			</div>
		</div>
	);
});

const Timer = memo(function Timer({
	time,
	elapsedTime,
	showTimer,
}: {
	time: number;
	elapsedTime: number;
	showTimer?: boolean;
}) {
	return (
		<div className="w-full h-full flex items-center justify-center text-[8rem] leading-0 select-none">
			{showTimer !== false && Math.trunc(clamp(time - elapsedTime, 0, time))}
		</div>
	);
});

function PanelButton({
	Icon,
	onClick,
	bgColor,
}: {
	Icon: LucideIcon;
	onClick: () => void;
	bgColor: string;
}) {
	return (
		<div
			className={cn(
				"p-2 h-12 rounded hover:cursor-pointer w-full flex items-center justify-center",
				bgColor,
			)}
			onClick={onClick}
		>
			<Icon size={28} stroke="#D9D9D9" />
		</div>
	);
}

export default DraftMiddlePanel;
