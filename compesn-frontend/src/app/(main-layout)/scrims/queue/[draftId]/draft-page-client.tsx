"use client";

import { useAuthModal } from "@/components/auth/auth-modal-provider";
import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { socket } from "@/lib/sockets";
import LoaderSpin from "@/components/loader-spin";
import { DraftHeader } from "./draft-header";
import { DraftTeamSection } from "./draft-team-section";
import { ChampionGrid } from "./champion-grid";
import { DraftTimer } from "./draft-timer";
import { DraftExpiredModal } from "./draft-expired-modal";
import { DraftCompletedModal } from "./draft-completed-modal";
import { useMutation } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";

interface DraftPageClientProps {
	draftId: string;
}

export function DraftPageClient({ draftId }: DraftPageClientProps) {
	const { data: session, status } = useSession();
	const router = useRouter();
	const trpc = useTRPC();
	const { openAuthModal } = useAuthModal();

	const [isConnected, setIsConnected] = useState(false);
	const [showExpiredModal, setShowExpiredModal] = useState(false);
	const [showCompletedModal, setShowCompletedModal] = useState(false);
	const [selectedChampion, setSelectedChampion] = useState<number | null>(null);
	const [timeRemaining, setTimeRemaining] = useState<number>(0);

	// tRPC queries and mutations
	const {
		data: draft,
		isLoading,
		error,
		refetch,
	} = (trpc.drafts.getById as any).useQuery(
		{ draftId },
		{
			enabled: !!session?.user?.id,
			refetchInterval: 30000, // Refetch every 30 seconds as fallback
		},
	);

	const makeActionMutation = useMutation(
		trpc.drafts.makeAction.mutationOptions({
			onSuccess: () => {
				setSelectedChampion(null);
				toast.success("Action completed successfully!");
			},
			onError: (error) => {
				toast.error(error.message);
			},
		}),
	);

	const joinRoomMutation = useMutation(trpc.drafts.joinRoom.mutationOptions());

	// Determine user's team
	const userTeam =
		draft && session?.user?.id
			? (() => {
					const isBlueTeam = draft.blueTeam.members.some(
						(m: any) => m.user.id === session.user.id,
					);
					const isRedTeam = draft.redTeam.members.some(
						(m: any) => m.user.id === session.user.id,
					);
					return isBlueTeam ? "BLUE" : isRedTeam ? "RED" : null;
				})()
			: null;

	// Check if it's user's turn
	const isUserTurn =
		draft && userTeam
			? (() => {
					const currentTeam = draft.currentTurn.startsWith("BLUE_") ? "BLUE" : "RED";
					return currentTeam === userTeam && draft.status === "ACTIVE";
				})()
			: false;

	// Get current action type
	const currentAction = draft?.currentTurn.includes("_PICK_") ? "PICK" : "BAN";

	// Socket.IO event handlers
	const handleDraftUpdate = useCallback(
		(data: any) => {
			console.log("Draft update received:", data);
			refetch();

			// Show notification for opponent actions
			if (data.action && userTeam && data.action.team !== userTeam) {
				const actionText = data.action.type === "PICK" ? "picked" : "banned";
				toast.info(`Opponent ${actionText} a champion`);
			}
		},
		[refetch, userTeam],
	);

	const handleDraftCompleted = useCallback(
		(data: any) => {
			console.log("Draft completed:", data);
			setShowCompletedModal(true);
			refetch();
		},
		[refetch],
	);

	const handleDraftExpired = useCallback(() => {
		console.log("Draft expired");
		setShowExpiredModal(true);
		refetch();
	}, [refetch]);

	// Initialize socket connection and join room
	useEffect(() => {
		if (!session?.user?.id || !draft) return;

		const connectSocket = async () => {
			try {
				// Join the draft room via tRPC
				await joinRoomMutation.mutateAsync({ draftId });

				// Connect to socket and join room
				socket.connect();
				socket.emit("draft:join-room", { draftId });

				// Set up event listeners
				socket.on("connect", () => setIsConnected(true));
				socket.on("disconnect", () => setIsConnected(false));
				socket.on("draft:update", handleDraftUpdate);
				socket.on("draft:completed", handleDraftCompleted);
				socket.on("draft:expired", handleDraftExpired);

				setIsConnected(socket.connected);
			} catch (error) {
				console.error("Failed to join draft room:", error);
				toast.error("Failed to connect to draft room");
			}
		};

		connectSocket();

		return () => {
			socket.off("draft:update", handleDraftUpdate);
			socket.off("draft:completed", handleDraftCompleted);
			socket.off("draft:expired", handleDraftExpired);
			socket.emit("draft:leave-room", { draftId });
		};
	}, [
		session?.user?.id,
		draftId,
		joinRoomMutation,
		handleDraftUpdate,
		handleDraftCompleted,
		handleDraftExpired,
		draft,
	]);

	// Timer for draft expiration
	useEffect(() => {
		if (!draft) return;

		const updateTimer = () => {
			const now = new Date();
			const remaining = draft.expiresAt.getTime() - now.getTime();
			setTimeRemaining(Math.max(0, remaining));

			if (remaining <= 0 && draft.status !== "EXPIRED" && draft.status !== "COMPLETED") {
				handleDraftExpired();
			}
		};

		updateTimer();
		const interval = setInterval(updateTimer, 1000);

		return () => clearInterval(interval);
	}, [draft, handleDraftExpired]);

	// Handle champion selection
	const handleChampionSelect = (championId: number) => {
		if (!isUserTurn || makeActionMutation.isPending) return;
		setSelectedChampion(championId);
	};

	// Handle action confirmation
	const handleActionConfirm = async () => {
		if (!selectedChampion || !isUserTurn || makeActionMutation.isPending) return;

		try {
			await makeActionMutation.mutateAsync({
				draftId,
				actionType: currentAction,
				championId: selectedChampion,
			});
		} catch (error) {
			// Error is handled by the mutation's onError
		}
	};

	// Redirect if not authenticated
	useEffect(() => {
		if (status === "unauthenticated") {
			openAuthModal({
				callbackUrl: `/scrims/queue/${draftId}`,
			});
		}
	}, [draftId, openAuthModal, status]);

	// Loading states
	if (status === "loading" || isLoading) {
		return (
			<div className="flex items-center justify-center min-h-screen">
				<LoaderSpin />
			</div>
		);
	}

	if (error) {
		return (
			<div className="flex items-center justify-center min-h-screen">
				<div className="text-center">
					<h2 className="text-2xl font-bold text-red-600 mb-4">Error Loading Draft</h2>
					<p className="text-muted-foreground mb-4">{error.message}</p>
					<button
						onClick={() => router.push("/scrims")}
						className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
					>
						Back to Scrims
					</button>
				</div>
			</div>
		);
	}

	if (!draft) {
		return (
			<div className="flex items-center justify-center min-h-screen">
				<div className="text-center">
					<h2 className="text-2xl font-bold mb-4">Draft Not Found</h2>
					<button
						onClick={() => router.push("/scrims")}
						className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
					>
						Back to Scrims
					</button>
				</div>
			</div>
		);
	}

	if (!userTeam) {
		return (
			<div className="flex items-center justify-center min-h-screen">
				<div className="text-center">
					<h2 className="text-2xl font-bold mb-4">Access Denied</h2>
					<p className="text-muted-foreground mb-4">
						You are not part of either team in this draft.
					</p>
					<button
						onClick={() => router.push("/scrims")}
						className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
					>
						Back to Scrims
					</button>
				</div>
			</div>
		);
	}

	return (
		<div className="container mx-auto px-4 py-6 max-w-7xl">
			{/* Header */}
			<DraftHeader
				draft={draft}
				userTeam={userTeam}
				isConnected={isConnected}
				timeRemaining={timeRemaining}
			/>

			{/* Timer */}
			<DraftTimer
				draft={draft}
				timeRemaining={timeRemaining}
				isUserTurn={isUserTurn}
				currentAction={currentAction}
			/>

			{/* Team Sections */}
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
				<DraftTeamSection
					team={draft.blueTeam}
					picks={draft.bluePicks}
					bans={draft.blueBans}
					color="blue"
					isUserTeam={userTeam === "BLUE"}
				/>
				<DraftTeamSection
					team={draft.redTeam}
					picks={draft.redPicks}
					bans={draft.redBans}
					color="red"
					isUserTeam={userTeam === "RED"}
				/>
			</div>

			{/* Champion Grid */}
			<ChampionGrid
				selectedChampion={selectedChampion}
				onChampionSelect={handleChampionSelect}
				bannedChampions={[...draft.blueBans, ...draft.redBans]}
				pickedChampions={[...draft.bluePicks, ...draft.redPicks]}
				isUserTurn={isUserTurn}
				currentAction={currentAction}
				onActionConfirm={handleActionConfirm}
				isLoading={makeActionMutation.isPending}
			/>

			{/* Modals */}
			<DraftExpiredModal
				isOpen={showExpiredModal}
				onClose={() => {
					setShowExpiredModal(false);
					router.push("/scrims");
				}}
			/>

			<DraftCompletedModal
				isOpen={showCompletedModal}
				draft={draft}
				onClose={() => {
					setShowCompletedModal(false);
					router.push("/scrims");
				}}
			/>
		</div>
	);
}
