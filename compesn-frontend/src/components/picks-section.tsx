"use client";

import { TDraft } from "@compesn/shared/common/types/draft";
import { TTeamColor } from "@compesn/shared/common/types/team-color";
import { cn, getChampionSmallImgURL } from "@/lib/utils";
import Image from "next/image";
import { memo } from "react";
import { Tooltip } from "react-tooltip";

const PicksSection = memo(function PicksSection({
	drafts,
	activeDraft,
	team,
}: {
	drafts: TDraft[];
	activeDraft: number;
	team: TTeamColor;
}) {
	const currentDraft = drafts[activeDraft];
	const teamId = currentDraft[team].id;

	return (
		<div className="w-fit h-full p-2">
			<div className="w-full h-full rounded bg-bg_primary/80 flex flex-col pt-1 pb-2 px-2 pr-1 overflow-y-auto">
				<span className={cn("mb-2", team === "blue" ? "text-primary" : "text-secondary")}>
					{currentDraft[team].name}
				</span>
				<div className="flex-1 w-full overflow-y-auto pr-1 flex flex-col gap-4">
					{drafts.map((draft, idx) => {
						const picks = draft.blue.id === teamId ? draft.blue.pick : draft.red.pick;
						const draftTeam: TTeamColor = draft.blue.id === teamId ? "blue" : "red";

						return (
							<div className="w-full flex flex-col" key={idx}>
								<span className="border-b pb-1 w-full">Draft #{idx + 1}</span>
								<div className="w-full h-auto grid grid-cols-[repeat(3,_minmax(40px,_1fr))] gap-2 pt-2">
									{picks.map((champion, idx) => {
										if (!champion) return;
										return (
											<div
												key={idx}
												className={cn(
													"w-10 h-10 bg-background/70 rounded border relative overflow-clip",
													draftTeam === "blue"
														? "border-primary"
														: "border-secondary",
												)}
												data-tooltip-id={team + "picks-section-tooltip"}
												data-tooltip-content={champion.name}
											>
												<Image
													alt=""
													fill={true}
													src={getChampionSmallImgURL(champion)}
												/>
											</div>
										);
									})}
								</div>
							</div>
						);
					})}
				</div>
			</div>
			<Tooltip
				id={team + "picks-section-tooltip"}
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

export default PicksSection;
