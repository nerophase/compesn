"use client";

import { Badge } from "@/components/ui/badge";
import { formatTimeRemaining } from "@/utils/draft-time";
import { Clock, Users, Wifi, WifiOff } from "lucide-react";

interface DraftHeaderProps {
	draft: any;
	userTeam: "BLUE" | "RED";
	isConnected: boolean;
	timeRemaining: number;
}

export function DraftHeader({ draft, userTeam, isConnected, timeRemaining }: DraftHeaderProps) {
	const getStatusColor = (status: string) => {
		switch (status) {
			case "PENDING":
				return "bg-yellow-500";
			case "ACTIVE":
				return "bg-green-500";
			case "COMPLETED":
				return "bg-blue-500";
			case "EXPIRED":
				return "bg-red-500";
			default:
				return "bg-gray-500";
		}
	};

	const getStatusText = (status: string) => {
		switch (status) {
			case "PENDING":
				return "Waiting to Start";
			case "ACTIVE":
				return "In Progress";
			case "COMPLETED":
				return "Completed";
			case "EXPIRED":
				return "Expired";
			default:
				return status;
		}
	};

	return (
		<div className="bg-card rounded-lg border p-6 mb-6">
			<div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
				{/* Left side - Teams */}
				<div className="flex items-center gap-4">
					<div className="flex items-center gap-2">
						<div className="w-3 h-3 bg-blue-500 rounded-full"></div>
						<span
							className={`font-semibold ${userTeam === "BLUE" ? "text-blue-500" : ""}`}
						>
							{draft.blueTeam.name}
						</span>
					</div>
					<span className="text-muted-foreground">vs</span>
					<div className="flex items-center gap-2">
						<div className="w-3 h-3 bg-red-500 rounded-full"></div>
						<span
							className={`font-semibold ${userTeam === "RED" ? "text-red-500" : ""}`}
						>
							{draft.redTeam.name}
						</span>
					</div>
				</div>

				{/* Right side - Status and Info */}
				<div className="flex items-center gap-4">
					{/* Connection Status */}
					<div className="flex items-center gap-2">
						{isConnected ? (
							<Wifi className="w-4 h-4 text-green-500" />
						) : (
							<WifiOff className="w-4 h-4 text-red-500" />
						)}
						<span className="text-sm text-muted-foreground">
							{isConnected ? "Connected" : "Disconnected"}
						</span>
					</div>

					{/* Draft Status */}
					<Badge className={`${getStatusColor(draft.status)} text-white`}>
						{getStatusText(draft.status)}
					</Badge>

					{/* Time Remaining */}
					{draft.status !== "COMPLETED" && draft.status !== "EXPIRED" && (
						<div className="flex items-center gap-2">
							<Clock className="w-4 h-4 text-muted-foreground" />
							<span className="text-sm font-mono">
								{formatTimeRemaining(timeRemaining)}
							</span>
						</div>
					)}
				</div>
			</div>

			{/* Scrim Info */}
			<div className="mt-4 pt-4 border-t">
				<div className="flex items-center gap-6 text-sm text-muted-foreground">
					<div className="flex items-center gap-2">
						<Users className="w-4 h-4" />
						<span>Best of {draft.scrim.bestOf}</span>
					</div>
					<div>Duration: {draft.scrim.durationMinutes} minutes</div>
					<div>Start Time: {new Date(draft.scrim.startTime).toLocaleString()}</div>
				</div>
			</div>
		</div>
	);
}
