"use client";

import { EMPTY_ROOM } from "@/constants/room";
import { useSession } from "next-auth/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { getTeamCode } from "@/lib/utils";
import { socket } from "@/lib/sockets";
import { useTimer } from "react-timer-hook";
import { toast } from "sonner";
import { TJoinTeamFunction } from "@/app/(main-layout)/draft/[roomId]/page";
import { TTeamColor } from "@compesn/shared/common/types/team-color";
import { TRoom } from "@compesn/shared/common/types/room";
import { TRoomMember } from "@compesn/shared/common/types/room-member";
import { TChampion } from "@compesn/shared/common/types/champion";
import { TStyles } from "@compesn/shared/common/types/styles";
import { TDraft } from "@compesn/shared/common/types/draft";
import { useTRPCClient } from "@/trpc/client";

const INITIAL_PLAYER: TRoomMember = {
	socketId: "",
	userId: "",
	name: "",
	team: undefined,
	isGuest: false,
};

const INITIAL_STYLES: TStyles = {
	bgColor: "",
	borderColor: "",
	textColor: "",
};

const TEAM_STYLES: Record<TTeamColor | "default", TStyles> = {
	blue: {
		bgColor: "bg-draft-blue",
		borderColor: "border-draft-blue",
		textColor: "text-draft-blue",
	},
	red: {
		bgColor: "bg-draft-red",
		borderColor: "border-draft-red",
		textColor: "text-draft-red",
	},
	default: {
		bgColor: "bg-background",
		borderColor: "border-background",
		textColor: "text-text_primary",
	},
};

const OPPOSITE_TEAM: Record<TTeamColor, TTeamColor> = {
	blue: "red",
	red: "blue",
};

export const useDraftData = (
	roomId: string,
	addMessagetoChatBox: (
		name: string,
		team: TTeamColor | undefined,
		all: boolean,
		text: string,
	) => void,
	setJoinRoomModalActive: (value: boolean) => void,
	setTimeOverModalActive: (value: boolean) => void,
	setRepeatPreviousTurnModalActive: (value: boolean) => void,
	joinTeam: TJoinTeamFunction,
) => {
	const trpcClient = useTRPCClient();
	const session = useSession();
	const params = useSearchParams();

	// State
	const [loadingDraftData, setLoadingDraftData] = useState<boolean>(true);
	const [roomInitialized, setRoomInitialized] = useState<boolean>(false);
	const [activeDraft, setActiveDraft] = useState<number>(0);
	const [room, setRoom] = useState<TRoom>(EMPTY_ROOM);
	const [player, setPlayer] = useState<TRoomMember>(INITIAL_PLAYER);
	const [selectedChampion, setSelectedChampion] = useState<TChampion | null>(null);
	const [turnTimeIsOver, setTurnTimeIsOver] = useState<boolean>(false);
	const [styles, setStyles] = useState<TStyles>(INITIAL_STYLES);

	// Refs for accessing current state in event handlers
	const playerRef = useRef<TRoomMember>(player);
	const addMessagetoChatBoxRef = useRef(addMessagetoChatBox);
	const setJoinRoomModalActiveRef = useRef(setJoinRoomModalActive);
	const setTimeOverModalActiveRef = useRef(setTimeOverModalActive);
	const setRepeatPreviousTurnModalActiveRef = useRef(setRepeatPreviousTurnModalActive);
	const setStylesByTeamRef = useRef<((team: TTeamColor | undefined) => void) | undefined>(
		undefined,
	);

	// Update refs when values change
	useEffect(() => {
		playerRef.current = player;
	}, [player]);

	useEffect(() => {
		addMessagetoChatBoxRef.current = addMessagetoChatBox;
	}, [addMessagetoChatBox]);

	useEffect(() => {
		setJoinRoomModalActiveRef.current = setJoinRoomModalActive;
	}, [setJoinRoomModalActive]);

	useEffect(() => {
		setTimeOverModalActiveRef.current = setTimeOverModalActive;
	}, [setTimeOverModalActive]);

	useEffect(() => {
		setRepeatPreviousTurnModalActiveRef.current = setRepeatPreviousTurnModalActive;
	}, [setRepeatPreviousTurnModalActive]);

	// Timer
	const { totalSeconds, restart } = useTimer({
		expiryTimestamp: new Date(),
		interval: 100,
	});

	// Memoized team code from URL params
	const teamCode = useMemo(() => params.get("team"), [params]);

	// Styles setter
	const setStylesByTeam = useCallback((team: TTeamColor | undefined) => {
		const teamStyles =
			team === undefined ? TEAM_STYLES.default : (TEAM_STYLES[team] ?? TEAM_STYLES.default);
		setStyles(teamStyles);
	}, []);

	// Update ref for setStylesByTeam
	useEffect(() => {
		setStylesByTeamRef.current = setStylesByTeam;
	}, [setStylesByTeam]);

	// Initialize room data
	const initializeRoom = useCallback(async () => {
		if (!roomId) {
			setLoadingDraftData(false);
			return;
		}

		try {
			const roomData = await trpcClient.rooms.get.query({ roomId });
			if (!roomData) {
				setLoadingDraftData(false);
				return;
			}

			setRoom(roomData);
			setActiveDraft(roomData.currentDraft);
			localStorage.setItem("live-draft", roomData.id);

			let joinedTeam = false;
			const currentDraft = roomData.drafts[roomData.currentDraft];

			// Try to autojoin player team if authenticated
			if (session.status === "authenticated") {
				try {
					const userTeams = await trpcClient.teams.userTeams.query();

					for (const teamMember of userTeams) {
						let teamToJoin: TTeamColor | undefined;
						let teamId = "";

						if (teamMember.team.name === currentDraft.blue.name) {
							teamToJoin = "blue";
							teamId = currentDraft.blue.id;
						} else if (teamMember.team.name === currentDraft.red.name) {
							teamToJoin = "red";
							teamId = currentDraft.red.id;
						}

						if (teamToJoin && teamId) {
							joinTeam(roomData.id, teamId, false, true);
							joinedTeam = true;
							break;
						}
					}
				} catch (error) {
					console.error("Failed to fetch user teams:", error);
				}
			}

			// Try autojoin team with code
			if (!joinedTeam && teamCode) {
				const blueTeamCode = getTeamCode(currentDraft.blue.id);
				const redTeamCode = getTeamCode(currentDraft.red.id);

				if (teamCode === blueTeamCode) {
					joinTeam(roomData.id, currentDraft.blue.id, false, true);
					joinedTeam = true;
				} else if (teamCode === redTeamCode) {
					joinTeam(roomData.id, currentDraft.red.id, false, true);
					joinedTeam = true;
				}
			}

			// Open join team modal if autojoin failed
			if (!joinedTeam) {
				setJoinRoomModalActiveRef.current(true);
			}
		} catch (error) {
			console.error("Failed to initialize room:", error);
			toast.error("Failed to load draft room");
		} finally {
			setRoomInitialized(true);
			setLoadingDraftData(false);
		}
	}, [
		roomId,
		session.status,
		teamCode,
		trpcClient.rooms.get,
		trpcClient.teams.userTeams,
		joinTeam,
	]);

	// Socket event handlers
	// Define handlers that are used by other handlers first
	const handleTimeOver = useCallback((team: TTeamColor | undefined) => {
		const currentPlayer = playerRef.current;
		if (currentPlayer.socketId && currentPlayer.team && currentPlayer.team !== team) {
			setTimeOverModalActiveRef.current(true);
		} else if (team) {
			toast.info(`Turn time is over. Wait for ${OPPOSITE_TEAM[team]} member decision.`);
		}
	}, []);

	const handleRequestedRepeatPreviousTurn = useCallback((team: TTeamColor | undefined) => {
		const currentPlayer = playerRef.current;
		if (currentPlayer.socketId && currentPlayer.team && currentPlayer.team !== team) {
			setRepeatPreviousTurnModalActiveRef.current(true);
		} else if (team) {
			toast.info(
				`The ${team} team has requested to repeat the previous turn. Wait for ${OPPOSITE_TEAM[team]} member decision.`,
			);
		}
	}, []);

	const handleUserJoinTeam = useCallback(
		({
			room,
			roomMember,
			userId,
		}: {
			room: TRoom;
			roomMember: TRoomMember;
			userId?: string;
		}) => {
			setStylesByTeamRef.current?.(roomMember.team);
			setJoinRoomModalActiveRef.current(false);
			setRoom(room);
			setPlayer(roomMember);

			if (userId) {
				localStorage.setItem("userId", userId);
			}

			toast.info(`You've joined the ${roomMember.team} team!`);

			playerRef.current = roomMember;

			const currentDraft = room.drafts[room.currentDraft];
			if (currentDraft.state === "time-over") {
				handleTimeOver(currentDraft.turn?.team);
			}
			if (currentDraft.state === "requested-repeat-prev-turn") {
				handleRequestedRepeatPreviousTurn(currentDraft.turn?.team);
			}
		},
		[handleTimeOver, handleRequestedRepeatPreviousTurn],
	);

	const handleUpdateMembers = useCallback((roomMembers: TRoomMember[]) => {
		// Find current player in updated members list
		const currentPlayer = roomMembers.find(
			(member) => member.socketId === playerRef.current.socketId,
		);

		if (currentPlayer) {
			setPlayer(currentPlayer);
			playerRef.current = currentPlayer;
		}

		setRoom((prevRoom) => ({
			...prevRoom,
			members: roomMembers,
		}));
	}, []);

	const handleDraftUpdate = useCallback(
		({ draft, draftIdx }: { draft: TDraft; draftIdx: number }) => {
			setRoom((prevRoom) => {
				const currentTurnNumber = prevRoom.drafts[prevRoom.currentDraft]?.turn?.number;
				const newTurnNumber = draft.turn?.number;

				if (currentTurnNumber !== newTurnNumber) {
					setSelectedChampion(null);
				}

				if (draft.state === "ongoing") {
					setTurnTimeIsOver(false);
				}

				const newDrafts = [...prevRoom.drafts];
				newDrafts[draftIdx] = draft;

				return {
					...prevRoom,
					drafts: newDrafts,
				};
			});
		},
		[],
	);

	const handleChatMessage = useCallback(
		({
			name,
			team,
			all,
			text,
		}: {
			name: string;
			team: TTeamColor;
			all: boolean;
			text: string;
		}) => {
			const currentPlayer = playerRef.current;
			if (currentPlayer.socketId) {
				addMessagetoChatBoxRef.current(name, team, all, text);
			}
		},
		[],
	);

	const handleTerminateDraft = useCallback((nextDraft: boolean) => {
		setTimeOverModalActiveRef.current(false);
		if (nextDraft) {
			toast.info("The current draft has finished.");
		}
	}, []);

	const handleNextDraft = useCallback((room: TRoom, swapTeams: boolean) => {
		setActiveDraft(room.currentDraft);
		setRoom(room);

		if (swapTeams) {
			const currentPlayer = playerRef.current;
			const newTeam: TTeamColor = currentPlayer.team === "blue" ? "red" : "blue";
			const updatedPlayer: TRoomMember = {
				...currentPlayer,
				team: newTeam,
			};
			setPlayer(updatedPlayer);
			playerRef.current = updatedPlayer;
			setStylesByTeamRef.current?.(newTeam);
		}
	}, []);

	const handleError = useCallback((error: string) => {
		toast.error(error);
	}, []);

	const handleCountdown = useCallback(
		({ countdown }: { countdown: number }) => {
			const time = new Date();
			time.setSeconds(time.getSeconds() + countdown - 3);
			restart(time);
		},
		[restart],
	);

	// Socket connection and event setup
	useEffect(() => {
		if (session.status === "loading") return;

		socket.connect();

		// Register all event handlers
		socket.on("draft:countdown", handleCountdown);
		socket.on("room:user-joined-team", handleUserJoinTeam);
		socket.on("room:update-members", handleUpdateMembers);
		socket.on("chat:message", handleChatMessage);
		socket.on("draft:update", handleDraftUpdate);
		socket.on("draft:time-over", handleTimeOver);
		socket.on("draft:reset-turn", () => setTimeOverModalActiveRef.current(false));
		socket.on("draft:reset-draft", () => setTimeOverModalActiveRef.current(false));
		socket.on("draft:terminate-draft", handleTerminateDraft);
		socket.on("draft:requested-repeat-previous-turn", handleRequestedRepeatPreviousTurn);
		socket.on("draft:repeat-previous-turn", () =>
			setRepeatPreviousTurnModalActiveRef.current(false),
		);
		socket.on("draft:decline-repeat-previous-turn", () =>
			setRepeatPreviousTurnModalActiveRef.current(false),
		);
		socket.on("draft:next-draft", handleNextDraft);
		socket.on("error:joining-room", handleError);
		socket.on("error:room", handleError);
		socket.on("error:not-connected", handleError);
		socket.on("error:locking-champion", handleError);
		socket.on("error:selecting-champion", handleError);

		// Cleanup function
		return () => {
			socket.off("draft:countdown", handleCountdown);
			socket.off("room:user-joined-team", handleUserJoinTeam);
			socket.off("room:update-members", handleUpdateMembers);
			socket.off("chat:message", handleChatMessage);
			socket.off("draft:update", handleDraftUpdate);
			socket.off("draft:time-over", handleTimeOver);
			socket.off("draft:reset-turn");
			socket.off("draft:reset-draft");
			socket.off("draft:terminate-draft", handleTerminateDraft);
			socket.off("draft:requested-repeat-previous-turn", handleRequestedRepeatPreviousTurn);
			socket.off("draft:repeat-previous-turn");
			socket.off("draft:decline-repeat-previous-turn");
			socket.off("draft:next-draft", handleNextDraft);
			socket.off("error:joining-room", handleError);
			socket.off("error:room", handleError);
			socket.off("error:not-connected", handleError);
			socket.off("error:locking-champion", handleError);
			socket.off("error:selecting-champion", handleError);
			socket.disconnect();
		};
	}, [
		session.status,
		handleCountdown,
		handleUserJoinTeam,
		handleUpdateMembers,
		handleChatMessage,
		handleDraftUpdate,
		handleTimeOver,
		handleTerminateDraft,
		handleRequestedRepeatPreviousTurn,
		handleNextDraft,
		handleError,
	]);

	// Initialize room when ready
	useEffect(() => {
		if (session.status === "loading" || roomInitialized) return;

		socket.emit("room:join-room", { roomId });
		initializeRoom();
	}, [session.status, roomId, roomInitialized, initializeRoom]);

	return {
		room,
		player,
		styles,
		loadingDraftData,
		activeDraft,
		turnTimeIsOver,
		totalSeconds,
		setTurnTimeIsOver,
		selectedChampion,
		setSelectedChampion,
		setActiveDraft,
		setRoom,
	};
};
