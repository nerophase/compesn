"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { CalendarIcon, MessageCircleIcon, SwordsIcon, UserPlusIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useTRPC } from "@/trpc/client";
import type { TeamProfile, ViewerTeam } from "./types";

export function ChallengeTeamDialog({ team }: { team: TeamProfile }) {
	const [open, setOpen] = useState(false);
	const [message, setMessage] = useState("");

	const handleChallenge = () => {
		toast.success(`Challenge sent to ${team.name}!`);
		setOpen(false);
		setMessage("");
	};

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Button className="bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 shadow-lg">
					<SwordsIcon className="h-4 w-4 mr-2" />
					Challenge Team
				</Button>
			</DialogTrigger>
			<DialogContent className="bg-gray-900/95 backdrop-blur-xl border-cyan-500/30">
				<DialogHeader>
					<DialogTitle className="text-cyan-400">Challenge {team.name}</DialogTitle>
					<DialogDescription className="text-gray-400">
						Send a scrim challenge to this team
					</DialogDescription>
				</DialogHeader>
				<div className="space-y-4 py-4">
					<div className="space-y-2">
						<Label className="text-gray-300">Message (Optional)</Label>
						<Input
							placeholder="Add a message to your challenge..."
							value={message}
							onChange={(event) => setMessage(event.target.value)}
							className="bg-gray-800/50 backdrop-blur-sm border-gray-600"
						/>
					</div>
				</div>
				<DialogFooter>
					<Button
						variant="outline"
						onClick={() => setOpen(false)}
						className="border-gray-600/50 text-gray-300"
					>
						Cancel
					</Button>
					<Button
						onClick={handleChallenge}
						className="bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400"
					>
						Send Challenge
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

export function OpenTeamChatButton({
	team,
	className,
}: {
	team: Pick<TeamProfile, "id" | "name">;
	className?: string;
}) {
	const trpc = useTRPC();
	const router = useRouter();
	const openConversationMutation = useMutation(
		trpc.messages.createOrGetTeamConversation.mutationOptions({
			onSuccess: ({ conversationId }) => {
				router.push(`/messages?conversationId=${conversationId}`);
			},
			onError: (error) => {
				toast.error(error.message || "Unable to open team chat");
			},
		}),
	);

	return (
		<Button
			onClick={() =>
				openConversationMutation.mutate({
					teamId: team.id,
				})
			}
			className={cn(
				"bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 shadow-lg",
				className,
			)}
			disabled={openConversationMutation.isPending}
		>
			<MessageCircleIcon className="h-4 w-4 mr-2" />
			{openConversationMutation.isPending ? "Opening..." : "Open Team Chat"}
		</Button>
	);
}

export function MessageTeamDialog({
	team,
	viewerTeams,
}: {
	team: Pick<TeamProfile, "id" | "name">;
	viewerTeams: ViewerTeam[];
}) {
	const trpc = useTRPC();
	const router = useRouter();
	const [open, setOpen] = useState(false);
	const [selectedSourceTeamId, setSelectedSourceTeamId] = useState<string>(
		viewerTeams[0]?.id || "",
	);

	const openConversationMutation = useMutation(
		trpc.messages.createOrGetTeamConversation.mutationOptions({
			onSuccess: ({ conversationId }) => {
				setOpen(false);
				router.push(`/messages?conversationId=${conversationId}`);
			},
			onError: (error) => {
				toast.error(error.message || "Unable to open team conversation");
			},
		}),
	);

	const handleOpenConversation = (sourceTeamId?: string) => {
		const resolvedSourceTeamId = sourceTeamId || selectedSourceTeamId;
		if (!resolvedSourceTeamId) {
			toast.error("Pick which of your teams should open the conversation.");
			return;
		}

		openConversationMutation.mutate({
			teamId: resolvedSourceTeamId,
			counterpartTeamId: team.id,
		});
	};

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Button
					variant="outline"
					className="border-cyan-500/50 bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 backdrop-blur-sm"
					onClick={(event) => {
						if (viewerTeams.length === 1) {
							event.preventDefault();
							handleOpenConversation(viewerTeams[0].id);
						}
					}}
				>
					<MessageCircleIcon className="h-4 w-4 mr-2" />
					Message Team
				</Button>
			</DialogTrigger>
			<DialogContent className="bg-gray-900/95 backdrop-blur-xl border-cyan-500/30">
				<DialogHeader>
					<DialogTitle className="text-cyan-400">Message {team.name}</DialogTitle>
					<DialogDescription className="text-gray-400">
						Choose which of your teams should open this shared conversation.
					</DialogDescription>
				</DialogHeader>
				<div className="space-y-4 py-4">
					<div className="space-y-2">
						<Label className="text-gray-300">Open conversation as</Label>
						<Select
							value={selectedSourceTeamId}
							onValueChange={setSelectedSourceTeamId}
						>
							<SelectTrigger className="bg-gray-800/50 backdrop-blur-sm border-gray-600">
								<SelectValue placeholder="Choose your team" />
							</SelectTrigger>
							<SelectContent>
								{viewerTeams.map((viewerTeam) => (
									<SelectItem key={viewerTeam.id} value={viewerTeam.id}>
										{viewerTeam.name} [{viewerTeam.tag}]
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
				</div>
				<DialogFooter>
					<Button
						variant="outline"
						onClick={() => setOpen(false)}
						className="border-gray-600/50 text-gray-300"
					>
						Cancel
					</Button>
					<Button
						onClick={() => handleOpenConversation()}
						disabled={openConversationMutation.isPending}
						className="bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400"
					>
						{openConversationMutation.isPending ? "Opening..." : "Open Conversation"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

export function ScheduleScrimDialog({ team }: { team: TeamProfile }) {
	const [open, setOpen] = useState(false);
	const [scrimDate, setScrimDate] = useState("");
	const [scrimTime, setScrimTime] = useState("");

	const handleSchedule = () => {
		toast.success(`Scrim scheduled successfully for ${team.name}!`);
		setOpen(false);
		setScrimDate("");
		setScrimTime("");
	};

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Button className="w-full bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 shadow-lg">
					<CalendarIcon className="h-4 w-4 mr-2" />
					Schedule Scrim
				</Button>
			</DialogTrigger>
			<DialogContent className="bg-gray-900/95 backdrop-blur-xl border-cyan-500/30">
				<DialogHeader>
					<DialogTitle className="text-cyan-400">Schedule Scrim</DialogTitle>
					<DialogDescription className="text-gray-400">
						Set up a new scrim for your team
					</DialogDescription>
				</DialogHeader>
				<div className="space-y-4 py-4">
					<div className="space-y-2">
						<Label className="text-gray-300">Date</Label>
						<Input
							type="date"
							value={scrimDate}
							onChange={(event) => setScrimDate(event.target.value)}
							className="bg-gray-800/50 backdrop-blur-sm border-gray-600"
						/>
					</div>
					<div className="space-y-2">
						<Label className="text-gray-300">Time</Label>
						<Input
							type="time"
							value={scrimTime}
							onChange={(event) => setScrimTime(event.target.value)}
							className="bg-gray-800/50 backdrop-blur-sm border-gray-600"
						/>
					</div>
				</div>
				<DialogFooter>
					<Button
						variant="outline"
						onClick={() => setOpen(false)}
						className="border-gray-600/50 text-gray-300"
					>
						Cancel
					</Button>
					<Button
						onClick={handleSchedule}
						className="bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400"
					>
						Schedule
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

export function InvitePlayerButton({ team }: { team: TeamProfile }) {
	return (
		<Button
			variant="outline"
			className="w-full border-cyan-500/50 bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 backdrop-blur-sm"
			onClick={() => toast.info(`Go to Roster tab to invite players to ${team.name}`)}
		>
			<UserPlusIcon className="h-4 w-4 mr-2" />
			Invite Player
		</Button>
	);
}
