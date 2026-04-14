"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import {
	CalendarIcon,
	Users,
	Trophy,
	MessageSquare,
	Link,
	AlertTriangle,
	CheckCircle,
	XCircle,
	ArrowLeft,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { AppRouter } from "@/trpc/routers/_app";

const RANK_TIERS = [
	{ value: "IRON", label: "Iron", color: "bg-gray-600" },
	{ value: "BRONZE", label: "Bronze", color: "bg-amber-700" },
	{ value: "SILVER", label: "Silver", color: "bg-gray-400" },
	{ value: "GOLD", label: "Gold", color: "bg-yellow-500" },
	{ value: "PLATINUM", label: "Platinum", color: "bg-cyan-500" },
	{ value: "EMERALD", label: "Emerald", color: "bg-emerald-500" },
	{ value: "DIAMOND", label: "Diamond", color: "bg-blue-400" },
	{ value: "MASTER", label: "Master", color: "bg-purple-500" },
	{ value: "GRANDMASTER", label: "Grandmaster", color: "bg-red-500" },
	{ value: "CHALLENGER", label: "Challenger", color: "bg-yellow-300" },
];

const STATUS_OPTIONS = [
	{ value: "OPEN", label: "Open", color: "bg-green-600", description: "Looking for opponents" },
	{
		value: "REQUESTED",
		label: "Requested",
		color: "bg-yellow-600",
		description: "A team has requested to scrim",
	},
	{
		value: "ACCEPTED",
		label: "Accepted",
		color: "bg-blue-600",
		description: "Request has been accepted",
	},
	{
		value: "CONFIRMED",
		label: "Confirmed",
		color: "bg-purple-600",
		description: "Both teams have confirmed",
	},
	{
		value: "CANCELLED",
		label: "Cancelled",
		color: "bg-red-600",
		description: "Scrim has been cancelled",
	},
	{
		value: "COMPLETED",
		label: "Completed",
		color: "bg-gray-600",
		description: "Scrim has been completed",
	},
];

type ScrimDetail = Awaited<ReturnType<AppRouter["scrims"]["getById"]>>;
type ScrimAction =
	| "request"
	| "accept"
	| "confirm"
	| "cancel"
	| "cancelRequest"
	| "complete"
	| "deny";
const ACTIONS_WITH_AVAILABILITY_CHECK: ScrimAction[] = [
	"request",
	"cancelRequest",
	"confirm",
	"complete",
	"cancel",
];

export default function ScrimDetailPage({ scrimId }: { scrimId: string }) {
	const trpc = useTRPC();
	const router = useRouter();
	const queryClient = useQueryClient();
	const { data: session } = useSession();
	const currentUserId = session?.user?.id;
	const isLoggedIn = !!currentUserId;
	const [requestDialogOpen, setRequestDialogOpen] = useState(false);
	const [selectedRequestTeamId, setSelectedRequestTeamId] = useState("");

	const [confirmDialog, setConfirmDialog] = useState<{
		open: boolean;
		action: string;
		title: string;
		description: string;
		onConfirm: () => void;
	}>({
		open: false,
		action: "",
		title: "",
		description: "",
		onConfirm: () => {},
	});
	const [cancelReason, setCancelReason] = useState("");

	// Fetch scrim data
	const {
		data: scrim,
		isLoading,
		error,
	} = useQuery(trpc.scrims.getById.queryOptions({ scrimId }));

	const { data: userTeamsData } = useQuery({
		...trpc.teams.userTeamsFlat.queryOptions(),
		enabled: !!currentUserId,
	});
	const userTeams = userTeamsData ?? [];

	// Mutations
	const requestScrimMutation = useMutation(
		trpc.scrims.request.mutationOptions({
			onSuccess: () => {
				toast.success("Scrim request sent!");
				setRequestDialogOpen(false);
				setSelectedRequestTeamId("");
				queryClient.invalidateQueries(trpc.scrims.getById.queryOptions({ scrimId }));
			},
			onError: (error) => {
				toast.error(error.message || "Failed to request scrim");
			},
		}),
	);

	const cancelRequestMutation = useMutation(
		trpc.scrims.cancelRequest.mutationOptions({
			onSuccess: () => {
				toast.success("Scrim request cancelled");
				queryClient.invalidateQueries(trpc.scrims.getById.queryOptions({ scrimId }));
			},
			onError: (error) => {
				toast.error(error.message || "Failed to cancel request");
			},
		}),
	);

	const updateStatusMutation = useMutation(
		trpc.scrims.updateStatus.mutationOptions({
			onSuccess: (data) => {
				toast.success(`Scrim ${data.status.toLowerCase()}!`);
				queryClient.invalidateQueries(trpc.scrims.getById.queryOptions({ scrimId }));
				setConfirmDialog({ ...confirmDialog, open: false });
			},
			onError: (error) => {
				toast.error(error.message || "Failed to update scrim");
			},
		}),
	);

	const cancelScrimMutation = useMutation(
		trpc.scrims.cancel.mutationOptions({
			onSuccess: () => {
				toast.success("Scrim cancelled");
				queryClient.invalidateQueries(trpc.scrims.getById.queryOptions({ scrimId }));
				setConfirmDialog({ ...confirmDialog, open: false });
				setCancelReason("");
			},
			onError: (error) => {
				toast.error(error.message || "Failed to cancel scrim");
			},
		}),
	);

	const getRankTierInfo = (tier: string) => {
		return RANK_TIERS.find((t) => t.value === tier);
	};

	const getStatusInfo = (status: string) => {
		return STATUS_OPTIONS.find((s) => s.value === status);
	};

	const formatScrimTime = (startTime: Date, durationMinutes: number) => {
		const start = new Date(startTime);
		const end = new Date(start.getTime() + durationMinutes * 60000);
		return {
			date: format(start, "EEEE, MMMM d, yyyy"),
			time: format(start, "h:mm a"),
			endTime: format(end, "h:mm a"),
			duration: durationMinutes,
		};
	};

	const isScrimInPast = (startTime: Date) => {
		return new Date(startTime) < new Date();
	};

	const canUserPerformAction = (action: ScrimAction, scrim: ScrimDetail, userId?: string) => {
		if (!scrim || !userId) return false;

		const isCreatingTeamMember = scrim.creatingTeam?.members?.some(
			(member) => member.userId === userId,
		);
		const isOpponentTeamMember = scrim.opponentTeam?.members?.some(
			(member) => member.userId === userId,
		);
		const isInvolved = isCreatingTeamMember || isOpponentTeamMember;

		switch (action) {
			case "request":
				return scrim.status === "OPEN" && !isCreatingTeamMember && !isOpponentTeamMember;
			case "accept":
				return scrim.status === "REQUESTED" && isCreatingTeamMember;
			case "confirm":
				return scrim.status === "ACCEPTED" && isInvolved;
			case "cancel":
				return (
					(isInvolved && ["OPEN", "ACCEPTED", "CONFIRMED"].includes(scrim.status)) ||
					(scrim.status === "REQUESTED" && isCreatingTeamMember)
				);
			case "cancelRequest":
				return scrim.status === "REQUESTED" && isOpponentTeamMember;
			case "complete":
				return scrim.status === "CONFIRMED" && isInvolved && isScrimInPast(scrim.startTime);
			default:
				return false;
		}
	};

	const handleAction = (action: string) => {
		if (!scrim) return;

		switch (action) {
			case "request":
				if (userTeams.length === 0) {
					toast.error("You must belong to a team to request a scrim");
					return;
				}
				setSelectedRequestTeamId((prev) => prev || userTeams[0]!.id);
				setRequestDialogOpen(true);
				break;
			case "cancelRequest":
				cancelRequestMutation.mutate({ scrimId });
				break;
			case "deny":
				setConfirmDialog({
					open: true,
					action: "deny",
					title: "Deny Scrim Request",
					description:
						"Are you sure you want to deny this request? The scrim will return to open status.",
					onConfirm: () => updateStatusMutation.mutate({ scrimId, status: "OPEN" }),
				});
				break;
			case "accept":
				setConfirmDialog({
					open: true,
					action: "accept",
					title: "Accept Scrim Request",
					description:
						"Are you sure you want to accept this scrim request? This will move the scrim to the accepted state.",
					onConfirm: () => updateStatusMutation.mutate({ scrimId, status: "ACCEPTED" }),
				});
				break;
			case "confirm":
				setConfirmDialog({
					open: true,
					action: "confirm",
					title: "Confirm Scrim",
					description:
						"Are you sure you want to confirm this scrim? This will lock in the match for both teams.",
					onConfirm: () => updateStatusMutation.mutate({ scrimId, status: "CONFIRMED" }),
				});
				break;
			case "complete":
				setConfirmDialog({
					open: true,
					action: "complete",
					title: "Mark Scrim as Completed",
					description: "Mark this scrim as completed. This action cannot be undone.",
					onConfirm: () => updateStatusMutation.mutate({ scrimId, status: "COMPLETED" }),
				});
				break;
			case "cancel":
				setConfirmDialog({
					open: true,
					action: "cancel",
					title: "Cancel Scrim",
					description:
						"Are you sure you want to cancel this scrim? This action cannot be undone.",
					onConfirm: () => cancelScrimMutation.mutate({ scrimId, reason: cancelReason }),
				});
				break;
		}
	};

	const submitRequest = () => {
		if (!selectedRequestTeamId) {
			toast.error("Select a team before requesting this scrim");
			return;
		}

		requestScrimMutation.mutate({ scrimId, teamId: selectedRequestTeamId });
	};

	if (isLoading) {
		return (
			<div className="container mx-auto py-8 px-4 max-w-4xl">
				<div className="space-y-6">
					<Skeleton className="h-8 w-1/3 bg-gray-700" />
					<Card className="bg-gray-900/50 border-gray-700">
						<CardContent className="p-6 space-y-4">
							<Skeleton className="h-6 w-1/2 bg-gray-700" />
							<Skeleton className="h-4 w-3/4 bg-gray-700" />
							<Skeleton className="h-4 w-1/2 bg-gray-700" />
						</CardContent>
					</Card>
				</div>
			</div>
		);
	}

	if (error || !scrim) {
		return (
			<div className="container mx-auto py-8 px-4 max-w-4xl">
				<Card className="bg-gray-900/50 border-gray-700">
					<CardContent className="p-6 text-center">
						<AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
						<h3 className="text-lg font-semibold text-white mb-2">Scrim Not Found</h3>
						<p className="text-gray-400 mb-4">
							{error?.message ||
								"The scrim you're looking for doesn't exist or has been removed."}
						</p>
						<Button onClick={() => router.push("/scrims")}>
							<ArrowLeft className="h-4 w-4 mr-2" />
							Back to Scrims
						</Button>
					</CardContent>
				</Card>
			</div>
		);
	}

	const statusInfo = getStatusInfo(scrim.status);
	const isPast = isScrimInPast(scrim.startTime);
	const timeInfo = formatScrimTime(scrim.startTime, scrim.durationMinutes);
	const canManageRequests = canUserPerformAction("accept", scrim, currentUserId);
	const pendingRequests =
		scrim.status === "REQUESTED" && scrim.opponentTeam ? [scrim.opponentTeam] : [];
	const canRequestScrim = canUserPerformAction("request", scrim, currentUserId);
	const showLoggedOutRequestState = !isLoggedIn && scrim.status === "OPEN";
	const hasAvailableActions = ACTIONS_WITH_AVAILABILITY_CHECK.some((action) =>
		canUserPerformAction(action, scrim, currentUserId),
	);

	return (
		<div className="container mx-auto py-8 px-4 max-w-4xl">
			{/* Header */}
			<div className="flex items-center gap-4 mb-8">
				<Button
					variant="outline"
					size="sm"
					onClick={() => router.back()}
					className="border-gray-600 text-white hover:bg-gray-800"
				>
					<ArrowLeft className="h-4 w-4 mr-2" />
					Back
				</Button>
				<div className="flex-1">
					<h1 className="text-3xl font-bold text-white mb-2">
						{scrim.creatingTeam.name}
						{scrim.opponentTeam && (
							<span className="text-gray-400"> vs {scrim.opponentTeam.name}</span>
						)}
					</h1>
					<div className="flex items-center gap-3">
						{statusInfo && (
							<Badge className={cn("text-white", statusInfo.color)}>
								{statusInfo.label}
							</Badge>
						)}
						{isPast && (
							<Badge variant="secondary" className="bg-gray-600 text-gray-300">
								Past
							</Badge>
						)}
					</div>
				</div>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				{/* Main Content */}
				<div className="lg:col-span-2 space-y-6">
					{/* Scrim Details */}
					<Card className="bg-gray-900/50 border-gray-700">
						<CardHeader>
							<CardTitle className="text-white flex items-center gap-2">
								<Trophy className="h-5 w-5" />
								Scrim Details
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							{/* Date and Time */}
							<div className="flex items-center gap-4 text-gray-300">
								<CalendarIcon className="h-5 w-5 text-gray-400" />
								<div>
									<p className="font-medium">{timeInfo.date}</p>
									<p className="text-sm text-gray-400">
										{timeInfo.time} - {timeInfo.endTime} ({timeInfo.duration}{" "}
										minutes)
									</p>
								</div>
							</div>

							{/* Match Format */}
							<div className="flex items-center gap-4 text-gray-300">
								<Trophy className="h-5 w-5 text-gray-400" />
								<div>
									<p className="font-medium">Best of {scrim.bestOf}</p>
									<p className="text-sm text-gray-400">Match format</p>
								</div>
							</div>

							{/* Rank Requirements */}
							{(scrim.minRankTier || scrim.maxRankTier) && (
								<div className="space-y-2">
									<h4 className="font-medium text-white">Rank Requirements</h4>
									<div className="flex items-center gap-2">
										{scrim.minRankTier && (
											<Badge
												variant="outline"
												className="border-gray-600 text-gray-300"
											>
												{getRankTierInfo(scrim.minRankTier)?.label}{" "}
												{scrim.minRankDivision}+
											</Badge>
										)}
										{scrim.minRankTier && scrim.maxRankTier && (
											<span className="text-gray-500">-</span>
										)}
										{scrim.maxRankTier && (
											<Badge
												variant="outline"
												className="border-gray-600 text-gray-300"
											>
												{getRankTierInfo(scrim.maxRankTier)?.label}{" "}
												{scrim.maxRankDivision}
											</Badge>
										)}
									</div>
								</div>
							)}

							{/* Roles Needed */}
							{scrim.rolesNeeded && scrim.rolesNeeded.length > 0 && (
								<div className="space-y-2">
									<h4 className="font-medium text-white">Roles Needed</h4>
									<div className="flex gap-1">
										{scrim.rolesNeeded.map((role) => (
											<Badge
												key={role}
												variant="outline"
												className="border-gray-600 text-gray-300"
											>
												{role}
											</Badge>
										))}
									</div>
								</div>
							)}

							{/* Communication Link */}
							{scrim.commsLink && (
								<div className="space-y-2">
									<h4 className="font-medium text-white flex items-center gap-2">
										<Link className="h-4 w-4" />
										Communication
									</h4>
									<a
										href={scrim.commsLink}
										target="_blank"
										rel="noopener noreferrer"
										className="text-blue-400 hover:text-blue-300 underline break-all"
									>
										{scrim.commsLink}
									</a>
								</div>
							)}

							{/* Notes */}
							{scrim.notes && (
								<div className="space-y-2">
									<h4 className="font-medium text-white flex items-center gap-2">
										<MessageSquare className="h-4 w-4" />
										Notes
									</h4>
									<p className="text-gray-300 whitespace-pre-wrap">
										{scrim.notes}
									</p>
								</div>
							)}
						</CardContent>
					</Card>

					{/* Status Information */}
					<Card className="bg-gray-900/50 border-gray-700">
						<CardHeader>
							<CardTitle className="text-white">Status Information</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="flex items-center gap-3 mb-4">
								{statusInfo && (
									<Badge className={cn("text-white", statusInfo.color)}>
										{statusInfo.label}
									</Badge>
								)}
								<span className="text-gray-400">{statusInfo?.description}</span>
							</div>
							<p className="text-sm text-gray-400">
								Created on{" "}
								{format(new Date(scrim.createdAt), "MMMM d, yyyy 'at' h:mm a")}
							</p>
							{scrim.updatedAt !== scrim.createdAt && (
								<p className="text-sm text-gray-400">
									Last updated on{" "}
									{format(new Date(scrim.updatedAt), "MMMM d, yyyy 'at' h:mm a")}
								</p>
							)}
						</CardContent>
					</Card>

					{/* Request List */}
					<Card className="bg-gray-900/50 border-gray-700">
						<CardHeader>
							<CardTitle className="text-white">Scrim Requests</CardTitle>
						</CardHeader>
						<CardContent className="space-y-3">
							{pendingRequests.length > 0 ? (
								pendingRequests.map((team) => (
									<div
										key={team.id}
										className="rounded-lg border border-gray-700 bg-gray-950/60 p-4"
									>
										<div className="flex flex-wrap items-center justify-between gap-3">
											<div>
												<p className="font-medium text-white">
													{team.name}
												</p>
												<p className="text-sm text-gray-400">
													Requesting team
												</p>
											</div>
											{canManageRequests && (
												<div className="flex items-center gap-2">
													<Button
														onClick={() => handleAction("accept")}
														disabled={updateStatusMutation.isPending}
													>
														Accept
													</Button>
													<Button
														onClick={() => handleAction("deny")}
														disabled={updateStatusMutation.isPending}
														variant="destructive"
													>
														Deny
													</Button>
												</div>
											)}
										</div>
									</div>
								))
							) : (
								<p className="text-sm text-gray-400">
									No teams have requested this scrim yet.
								</p>
							)}
						</CardContent>
					</Card>
				</div>

				{/* Sidebar */}
				<div className="space-y-6">
					{/* Teams */}
					<Card className="bg-gray-900/50 border-gray-700">
						<CardHeader>
							<CardTitle className="text-white flex items-center gap-2">
								<Users className="h-5 w-5" />
								Teams
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							{/* Creating Team */}
							<div>
								<h4 className="font-medium text-white mb-2">
									{scrim.creatingTeam.name}
								</h4>
								<p className="text-sm text-gray-400 mb-2">Creating Team</p>
								<div className="space-y-1">
									{scrim.creatingTeam.members?.map((member) => (
										<div
											key={member.id}
											className="flex items-center justify-between text-sm"
										>
											<span className="text-gray-300">
												{member.user.name}
											</span>
											<Badge
												variant="outline"
												className="border-gray-600 text-gray-400 text-xs"
											>
												{member.role}
											</Badge>
										</div>
									))}
								</div>
							</div>

							{/* Opponent Team */}
							{scrim.opponentTeam ? (
								<div>
									<h4 className="font-medium text-white mb-2">
										{scrim.opponentTeam.name}
									</h4>
									<p className="text-sm text-gray-400 mb-2">Opponent Team</p>
									<div className="space-y-1">
										{scrim.opponentTeam.members?.map((member) => (
											<div
												key={member.id}
												className="flex items-center justify-between text-sm"
											>
												<span className="text-gray-300">
													{member.user.name}
												</span>
												<Badge
													variant="outline"
													className="border-gray-600 text-gray-400 text-xs"
												>
													{member.role}
												</Badge>
											</div>
										))}
									</div>
								</div>
							) : (
								<div className="text-center py-4">
									<p className="text-gray-400 text-sm">
										Waiting for opponent team
									</p>
								</div>
							)}
						</CardContent>
					</Card>

					{/* Actions */}
					<Card className="bg-gray-900/50 border-gray-700">
						<CardHeader>
							<CardTitle className="text-white">Actions</CardTitle>
						</CardHeader>
						<CardContent className="space-y-3">
							{/* Request Scrim */}
							{canRequestScrim && (
								<Button
									onClick={() => handleAction("request")}
									disabled={requestScrimMutation.isPending}
									className="w-full bg-green-600 hover:bg-green-700 text-white"
								>
									<CheckCircle className="h-4 w-4 mr-2" />
									{requestScrimMutation.isPending
										? "Requesting..."
										: "Request Scrim"}
								</Button>
							)}
							{showLoggedOutRequestState && (
								<>
									<Button
										disabled
										className="w-full bg-green-600 text-white disabled:opacity-60"
									>
										<CheckCircle className="h-4 w-4 mr-2" />
										Sign In to Request
									</Button>
									<p className="text-sm text-gray-400">
										You can browse scrims while signed out, but you need to sign in
										to request one.
									</p>
								</>
							)}

							{/* Cancel Request */}
							{canUserPerformAction("cancelRequest", scrim, currentUserId) && (
								<Button
									onClick={() => handleAction("cancelRequest")}
									disabled={cancelRequestMutation.isPending}
									variant="outline"
									className="w-full border-yellow-500 text-yellow-300 hover:bg-yellow-500/10"
								>
									<XCircle className="h-4 w-4 mr-2" />
									{cancelRequestMutation.isPending
										? "Cancelling Request..."
										: "Cancel Request"}
								</Button>
							)}

							{/* Confirm Scrim */}
							{canUserPerformAction("confirm", scrim, currentUserId) && (
								<Button
									onClick={() => handleAction("confirm")}
									disabled={updateStatusMutation.isPending}
									className="w-full bg-purple-600 hover:bg-purple-700 text-white"
								>
									<CheckCircle className="h-4 w-4 mr-2" />
									{updateStatusMutation.isPending
										? "Confirming..."
										: "Confirm Scrim"}
								</Button>
							)}

							{/* Complete Scrim */}
							{canUserPerformAction("complete", scrim, currentUserId) && (
								<Button
									onClick={() => handleAction("complete")}
									disabled={updateStatusMutation.isPending}
									className="w-full bg-gray-600 hover:bg-gray-700 text-white"
								>
									<CheckCircle className="h-4 w-4 mr-2" />
									{updateStatusMutation.isPending
										? "Completing..."
										: "Mark as Completed"}
								</Button>
							)}

							{/* Cancel Scrim */}
							{canUserPerformAction("cancel", scrim, currentUserId) && (
								<Button
									onClick={() => handleAction("cancel")}
									disabled={cancelScrimMutation.isPending}
									variant="destructive"
									className="w-full"
								>
									<XCircle className="h-4 w-4" />
									{cancelScrimMutation.isPending
										? "Cancelling..."
										: "Cancel Scrim"}
								</Button>
							)}

							{/* No actions available */}
							{!showLoggedOutRequestState && !hasAvailableActions && (
								<p className="text-sm text-gray-400 text-center py-4">
									No actions available
								</p>
							)}
						</CardContent>
					</Card>
				</div>
			</div>

			{/* Request Dialog */}
			<Dialog
				open={requestDialogOpen}
				onOpenChange={(open) => {
					setRequestDialogOpen(open);
					if (!open) {
						setSelectedRequestTeamId("");
					}
				}}
			>
				<DialogContent className="bg-gray-900 border-gray-700">
					<DialogHeader>
						<DialogTitle className="text-white">Request Scrim</DialogTitle>
						<DialogDescription className="text-gray-400">
							Select the team you want to use to request this scrim.
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-2">
						<label className="text-sm font-medium text-white">Your Team</label>
						<Select
							value={selectedRequestTeamId}
							onValueChange={(value) => setSelectedRequestTeamId(value)}
						>
							<SelectTrigger className="bg-gray-800 border-gray-600">
								<SelectValue placeholder="Select team" />
							</SelectTrigger>
							<SelectContent>
								{userTeams.map((team) => (
									<SelectItem key={team.id} value={team.id}>
										{team.name} [{team.tag}]
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => {
								setRequestDialogOpen(false);
								setSelectedRequestTeamId("");
							}}
							className="border-gray-600 text-white hover:bg-gray-800"
						>
							Cancel
						</Button>
						<Button
							onClick={submitRequest}
							disabled={requestScrimMutation.isPending || !selectedRequestTeamId}
							className="bg-green-600 hover:bg-green-700 text-white"
						>
							{requestScrimMutation.isPending ? "Requesting..." : "Send Request"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Confirmation Dialog */}
			<Dialog
				open={confirmDialog.open}
				onOpenChange={(open) => setConfirmDialog({ ...confirmDialog, open })}
			>
				<DialogContent className="bg-gray-900 border-gray-700">
					<DialogHeader>
						<DialogTitle className="text-white">{confirmDialog.title}</DialogTitle>
						<DialogDescription className="text-gray-400">
							{confirmDialog.description}
						</DialogDescription>
					</DialogHeader>

					{confirmDialog.action === "cancel" && (
						<div className="space-y-2">
							<label className="text-sm font-medium text-white">
								Reason for cancellation (optional)
							</label>
							<Textarea
								value={cancelReason}
								onChange={(e) => setCancelReason(e.target.value)}
								placeholder="Provide a reason for cancelling this scrim..."
								className="bg-gray-800 border-gray-600 text-white"
								rows={3}
							/>
						</div>
					)}

					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setConfirmDialog({ ...confirmDialog, open: false })}
							className="border-gray-600 text-white hover:bg-gray-800"
						>
							Cancel
						</Button>
						<Button
							onClick={confirmDialog.onConfirm}
							disabled={
								updateStatusMutation.isPending || cancelScrimMutation.isPending
							}
							className={cn(
								"text-white",
								confirmDialog.action === "cancel"
									? "bg-red-600 hover:bg-red-700"
									: "",
							)}
						>
							{updateStatusMutation.isPending || cancelScrimMutation.isPending
								? "Processing..."
								: "Confirm"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
