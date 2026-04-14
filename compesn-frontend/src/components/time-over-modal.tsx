import { memo } from "react";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "./ui/button";
import { TStyles } from "@compesn/shared/types/styles";

const TimeOverModal = memo(function TimeOverModal({
	isActive,
	styles,
	onResetTurn,
	onResetDraft,
	onTerminateDraft,
}: {
	isActive: boolean;
	styles: TStyles;
	onResetTurn: () => void;
	onResetDraft: () => void;
	onTerminateDraft: () => void;
}) {
	return (
		<Dialog open={isActive}>
			<DialogContent showCloseButton={false}>
				<DialogHeader className="items-center">
					<DialogTitle>Turn Time Over</DialogTitle>
					<DialogDescription className="text-center">
						Select how you want to continue now that the active turn timer has expired.
					</DialogDescription>
				</DialogHeader>

				<div className="flex w-full gap-2">
					<Button className="flex-1" onClick={() => onResetTurn()}>
						Reset Turn
					</Button>
					<Button className="flex-1" onClick={() => onResetDraft()}>
						Reset Draft
					</Button>
					<Button className="flex-1" onClick={() => onTerminateDraft()}>
						Terminate Draft
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
});

export default TimeOverModal;
