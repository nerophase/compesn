import { TDraftState } from "@compesn/shared/types/state";
import useDraft from "@/hooks/use-draft";
import { cn } from "@/lib/utils";
import { memo } from "react";

const STATE_MESSAGES: { [key in TDraftState]: string } = {
	"waiting": "waiting",
	"ongoing": "ongoing",
	"time-over": "turn time over",
	"requested-repeat-prev-turn": "requested repeat previous turn",
	"finished": "finished",
};

const DraftsBox = memo(function DraftsBox() {
	const { room, activeDraft, setActiveDraft } = useDraft();
	const draftIteratorList = Array.from(Array(room.draftsCount).keys());
	// const currentDraft = room.drafts[room.currentDraft];

	return (
		<div className="w-full h-full flex flex-col items-start justify-between">
			<div className=" overflow-y-auto w-full">
				{draftIteratorList.map((draftIdx) => {
					const disabled = draftIdx > room.currentDraft;
					return (
						<div
							key={draftIdx}
							className={cn(
								"flex justify-start items-center w-fullrounded select-none py-1 rounded",
								!disabled && " hover:cursor-pointer hover:bg-background/30",
							)}
							onClick={() => {
								if (draftIdx <= room.currentDraft && draftIdx !== activeDraft)
									setActiveDraft(draftIdx);
							}}
						>
							<div className="w-8 flex items-center justify-center shrink-0">
								{draftIdx === room.currentDraft && (
									<div className={cn("rounded-full w-2 h-2", "bg-primary")}></div>
								)}
							</div>
							<span
								className={cn(
									"pr-4",
									true && "text-gray-400",
									!disabled && draftIdx === activeDraft && "text-primary",
								)}
							>
								Draft {draftIdx + 1}
							</span>
							<div className="flex items-center justify-center gap-2">
								{draftIdx <= room.currentDraft && (
									<span className={cn("rounded-full px-2 text-sm bg-primary/60")}>
										{STATE_MESSAGES[room.drafts[draftIdx].state]}
									</span>
								)}
							</div>
						</div>
					);
				})}
			</div>
		</div>
	);
});

export default DraftsBox;
