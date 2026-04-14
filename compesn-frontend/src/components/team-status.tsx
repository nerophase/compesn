import Image from "next/image";
import { cn, draftTeamBgColor, getChampionLargeImgURL, getChampionSmallImgURL } from "@/lib/utils";
import useDraft from "@/hooks/use-draft";
import { memo } from "react";
import { Tooltip } from "react-tooltip";
import { TTurnType } from "@compesn/shared/types/turn-type";

const TeamStatus = memo(function TeamStatus({
	team,
	teamName,
	boxWidth,
	championBoxHeight,
	championBoxWidth,
}: {
	team: "blue" | "red";
	teamName: string;
	boxWidth: number;
	championBoxHeight: number;
	championBoxWidth: number;
}) {
	const { room, activeDraft } = useDraft();
	const draft = room.drafts[activeDraft];

	const boxList = Array.from(Array(5).keys());

	function getBoxConfig(idx: number, turnType: TTurnType): { border: string; gridLines: string } {
		const boxConfig = {
			border: "",
			gridLines: "",
		};

		if (
			draft.turn?.team === team &&
			draft.turn.type === turnType &&
			draft.turn.typeNumber === idx + 1
		) {
			boxConfig.border =
				team === "blue" ? "custom-border-active-blue" : "custom-border-active-red";
			boxConfig.gridLines =
				team === "blue" ? "diagonal-gridlines-active" : "rev-diagonal-gridlines-active";
		} else {
			boxConfig.border = "custom-border";
			boxConfig.gridLines = team === "blue" ? "diagonal-gridlines" : "rev-diagonal-gridlines";
		}

		return boxConfig;
	}

	return (
		<div
			className={cn("w-full h-full flex flex-col", team === "blue" ? "pr-1" : "pl-1")}
			style={{ width: boxWidth }}
		>
			<div
				className={`h-[64px] w-full flex ${
					team === "blue" ? "flex-row" : "flex-row-reverse"
				}`}
			>
				<div
					className={`h-full w-1/2 max-w-[256px] text-text_primary text-xl flex items-center justify-center font-bold select-none relative ${
						team === "blue" ? "mr-2 rounded-r" : "ml-2 rounded-l"
					} ${draftTeamBgColor(team)}`}
				>
					{draft[team].ready ? (
						<div
							className={`w-2 h-2 bg-green-400 absolute top-0 rounded-full translate-y-1 ${
								team === "blue" ? "left-0 translate-x-1" : "right-0 -translate-x-1"
							}`}
						></div>
					) : null}
					<span className="text-2xl text-ellipsis overflow-hidden whitespace-nowrap px-2">
						{teamName}
					</span>
				</div>
				<div className={`flex w-auto gap-2 ${team === "red" ? "flex-row-reverse" : ""}`}>
					{boxList.map((idx) => {
						const champion = draft[team].ban[idx];
						const boxConfig = getBoxConfig(idx, "ban");

						return (
							<div
								key={idx + team + "ban"}
								className={`relative ${boxConfig.border} ${boxConfig.gridLines} select-none`}
								style={{ width: 64, height: 64 }}
							>
								{champion ? (
									<Image
										src={getChampionSmallImgURL(champion)}
										alt=""
										fill={true}
										data-tooltip-id={team + "team-status-tooltip"}
										className={cn(champion.fileName === "no-ban" && "p-2")}
										data-tooltip-content={champion.name}
									/>
								) : null}
							</div>
						);
					})}
				</div>
			</div>
			<div className={`w-full h-4 my-1 ${draftTeamBgColor(team)}`}></div>
			<div
				className={`w-full h-full flex gap-2 ${team === "red" ? "flex-row-reverse" : ""}`}
				style={{ height: championBoxHeight }}
			>
				{boxList.map((idx) => {
					const champion = draft[team].pick[idx];
					const boxConfig = getBoxConfig(idx, "pick");
					return (
						<div
							key={idx + team + "pick"}
							className={`h-full w-full relative custom-border select-none ${boxConfig.border} ${boxConfig.gridLines}`}
							style={{ width: championBoxWidth }}
						>
							{champion ? (
								<Image
									src={getChampionLargeImgURL(champion)}
									alt=""
									fill={true}
									data-tooltip-id={team + "team-status-tooltip"}
									data-tooltip-content={champion.name}
								/>
							) : null}
						</div>
					);
				})}
			</div>
			<Tooltip
				id={team + "team-status-tooltip"}
				style={{
					backgroundColor: team === "red" ? "rgb(246, 75, 65)" : "rgb(90, 65, 246)",
					fontSize: "1.125rem",
					userSelect: "none",
					zIndex: "50",
				}}
				className="shadow-[0px_0px_8px_rgba(0,0,0,1)]"
				opacity={1}
			/>
		</div>
	);
});

export default TeamStatus;
