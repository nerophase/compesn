"use client";

import { Badge } from "@/components/ui/badge";
import { formatTimeRemaining } from "@/utils/draft-time";
import { Clock, AlertTriangle } from "lucide-react";

interface DraftTimerProps {
	draft: any;
	timeRemaining: number;
	isUserTurn: boolean;
	currentAction: "PICK" | "BAN";
}

export function DraftTimer({ draft, timeRemaining, isUserTurn, currentAction }: DraftTimerProps) {
	if (draft.status === "COMPLETED" || draft.status === "EXPIRED") {
		return null;
	}

	const getCurrentTurnText = () => {
		const turn = draft.currentTurn;
		const team = turn.startsWith("BLUE_") ? "Blue Team" : "Red Team";
		const action = turn.includes("_PICK_") ? "Pick" : "Ban";
		const number = turn.split("_")[2];

		return `${team} ${action} ${number}`;
	};

	const isLowTime = timeRemaining < 30000; // Less than 30 seconds
	const isCriticalTime = timeRemaining < 10000; // Less than 10 seconds

	return (
		<div className="bg-card rounded-lg border p-4 mb-6">
			<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
				{/* Current Turn */}
				<div className="flex items-center gap-3">
					<div className="flex items-center gap-2">
						<div
							className={`w-3 h-3 rounded-full ${
								draft.currentTurn.startsWith("BLUE_") ? "bg-blue-500" : "bg-red-500"
							}`}
						></div>
						<span className="font-semibold">{getCurrentTurnText()}</span>
					</div>

					{isUserTurn && (
						<Badge variant="default" className="bg-green-500 text-white">
							Your Turn
						</Badge>
					)}
				</div>

				{/* Timer */}
				<div className="flex items-center gap-3">
					{draft.status === "PENDING" ? (
						<div className="flex items-center gap-2 text-yellow-600">
							<Clock className="w-4 h-4" />
							<span className="font-mono text-lg">Waiting to start...</span>
						</div>
					) : (
						<div
							className={`flex items-center gap-2 ${
								isCriticalTime
									? "text-red-600"
									: isLowTime
										? "text-yellow-600"
										: "text-muted-foreground"
							}`}
						>
							{isCriticalTime && <AlertTriangle className="w-4 h-4 animate-pulse" />}
							<Clock className="w-4 h-4" />
							<span
								className={`font-mono text-lg ${
									isCriticalTime ? "animate-pulse" : ""
								}`}
							>
								{formatTimeRemaining(timeRemaining)}
							</span>
						</div>
					)}

					{/* Action Indicator */}
					<Badge
						variant="outline"
						className={`
                        ${currentAction === "PICK" ? "border-green-500 text-green-600" : "border-red-500 text-red-600"}
                    `}
					>
						{currentAction}
					</Badge>
				</div>
			</div>

			{/* User Turn Notification */}
			{isUserTurn && (
				<div className="mt-3 p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-md">
					<div className="flex items-center gap-2 text-green-700 dark:text-green-300">
						<AlertTriangle className="w-4 h-4" />
						<span className="font-medium">
							It&apos;s your turn to {currentAction.toLowerCase()} a champion!
						</span>
					</div>
				</div>
			)}
		</div>
	);
}
