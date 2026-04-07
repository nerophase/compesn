import { memo, useState } from "react";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "./ui/button";

const RepeatPreviousTurnModal = memo(function RepeatPreviousTurnModal({
	isActive,
	onAccept,
	onDecline,
}: {
	isActive: boolean;
	onAccept: () => void;
	onDecline: () => void;
}) {
	return (
		<Dialog open={isActive}>
			<DialogContent showCloseButton={false}>
				<DialogHeader>
					<DialogTitle>The other team has requested to repeat the last turn.</DialogTitle>
					<DialogDescription>
						Accept to roll the draft back by one turn, or decline to keep the current
						state.
					</DialogDescription>
				</DialogHeader>
				<div className="w-full flex justify-evenly select-none gap-5">
					<Button
						onClick={() => {
							onAccept();
						}}
						className="flex-1"
					>
						Accept
					</Button>
					<Button
						onClick={() => {
							onDecline();
						}}
						className="flex-1"
						variant={"destructive"}
					>
						Decline
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
});

export default RepeatPreviousTurnModal;
