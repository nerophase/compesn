"use client";

import { AnimatePresence, motion } from "framer-motion";
import { MessageCircleIcon, UsersIcon, SwordsIcon, XIcon } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import DraftTeamHistory from "./draft-team-history";
import DraftTeamData from "./draft-team-data";
import { TChampion } from "@compesn/shared/common/types/champion";
import ChampionSelector from "./champion-selector";
import DraftStatusIndicator from "./draft-status-indicator";
import { TMessage } from "@compesn/shared/common/types/message";
import { useSession } from "next-auth/react";
import { socket } from "@/lib/sockets";
import { useDraftData } from "@/hooks/use-draft-data";
import { TTeamColor } from "@compesn/shared/common/types/team-color";
import { TChampionList } from "@compesn/shared/common/types/champion-list";
import { TRoom } from "@compesn/shared/common/types/room";
import { addChampion } from "@/utils/champions";
import LoaderSpin from "@/components/loader-spin";
import { DraftContext } from "@/context/draft-context";
import JoinRoomModal from "@/components/join-room-modal";
import TimeOverModal from "@/components/time-over-modal";
import RepeatPreviousTurnModal from "@/components/repeat-last-turn-modal";
import ChatTab from "./chat-tab";
import MembersTab from "./members-tab";
import DraftTab from "./drafts-tab";
import { useParams } from "next/navigation";
import FloatingFrame from "@/components/floating-frame";
import { v4 } from "uuid";
import DraftControls from "./draft-controls";
import { useBaseUrl } from "@/hooks/use-base-url";
import { CopyLinksMenu } from "@/components/copy-links-menu";

export type TJoinTeamFunction = (
	roomId: string,
	teamId: string,
	isGuest: boolean,
	autoJoin?: boolean,
) => void;

export default function Draft() {
	const params = useParams<{ roomId: string }>();
	const baseUrl = useBaseUrl();
	const roomId = params.roomId ?? "";
	const [chatMessages, setChatMessages] = useState<TMessage[]>([]);
	const notificationSound = useRef<HTMLAudioElement>(undefined);
	const session = useSession();
	const [activeTab, setActiveTab] = useState<"chat" | "members" | "drafts">("chat");
	const [matchAction, setMatchAction] = useState<
		"same_side" | "switch_side" | "end_match" | null
	>(null);
	const [showChat, setShowChat] = useState<boolean>(false);
	const [showSidebar, setShowSidebar] = useState<boolean>(false);

	// Modals
	const [joinRoomModalActive, setJoinRoomModalActive] = useState<boolean>(false);
	const [timeOverModalActive, setTimeOverModalActive] = useState<boolean>(false);
	const [repeatPreviousTurnModalActive, setRepeatPreviousTurnModalActive] =
		useState<boolean>(false);

	// Setup Audio
	useEffect(() => {
		notificationSound.current = new Audio("/audio/notification-sound.mp3");
	}, []);

	const addMessageToChatBox = useCallback(
		(name: string, team: TTeamColor | undefined, all: boolean, text: string) => {
			setChatMessages((prev) => [
				...prev,
				{
					id: v4(),
					name,
					team,
					all,
					text,
				},
			]);

			if (notificationSound.current && navigator.userActivation.isActive) {
				notificationSound.current.currentTime = 0;
				notificationSound.current.play();
			}
		},
		[notificationSound],
	);

	const joinTeam: TJoinTeamFunction = useCallback(
		(roomId: string, teamId: string, isGuest: boolean, autoJoin: boolean = false) => {
			let name = "";
			let userId = localStorage.getItem("userId") ?? "";

			if (session.status === "authenticated" && !!session.data.user.name) {
				name = session.data.user.name;
				userId = session.data.user.id;
			}

			socket.emit("room:join-team", {
				roomId,
				teamId,
				userId,
				name,
				isGuest,
				autoJoin,
			});
		},
		[session.data?.user.name, session.data?.user.id, session.status],
	);

	const {
		room,
		player,
		styles,
		loadingDraftData,
		totalSeconds,
		activeDraft,
		setActiveDraft,
		selectedChampion,
		setSelectedChampion,
		setRoom,
	} = useDraftData(
		roomId,
		addMessageToChatBox,
		setJoinRoomModalActive,
		setTimeOverModalActive,
		setRepeatPreviousTurnModalActive,
		joinTeam,
	);

	const currentDraft = room.drafts[activeDraft];

	const handleChampionSelect = useCallback(
		(champion: TChampion) => {
			if (
				currentDraft.state !== "ongoing" ||
				(currentDraft.state === "ongoing" && currentDraft.turn?.team !== player.team)
			)
				return;

			const champs: TChampionList = [
				...currentDraft.blue.ban,
				...currentDraft.red.ban,
				...currentDraft.blue.pick,
				...currentDraft.red.pick,
				...room.disabledChampions,
			];

			if (
				champs.find((champ) => champ?.name === champion.name) &&
				champion.fileName !== "no-ban"
			)
				return;

			if (currentDraft.turn?.type === "pick" && champion.fileName === "no-ban") return;

			setSelectedChampion(champion);

			setRoom((prevRoom: TRoom) => {
				const newDraft = addChampion(prevRoom.drafts[prevRoom.currentDraft], champion);
				const drafts = [...prevRoom.drafts];
				drafts[prevRoom.currentDraft] = newDraft;
				return { ...prevRoom, drafts };
			});
			socket.emit("draft:select-champion", {
				selectedChampion: champion.fileName,
				turnNumber: currentDraft.turn?.number,
			});
		},
		[currentDraft, player, room.disabledChampions, setRoom, setSelectedChampion],
	);

	const onSubmitChatMessage = useCallback(
		(text: string, all: boolean) => {
			socket.emit("chat:message", {
				name: player.name,
				team: player.team,
				all,
				text,
			});
			addMessageToChatBox(player.name, player.team, all, text);
		},
		[player.name, player.team, addMessageToChatBox],
	);

	const onResetTurn = useCallback(() => {
		setTimeOverModalActive(false);
		socket.emit("draft:reset-turn");
	}, []);

	const onResetDraft = useCallback(() => {
		setTimeOverModalActive(false);
		socket.emit("draft:reset-draft");
	}, []);

	const onTerminateDraft = useCallback(() => {
		setTimeOverModalActive(false);
		socket.emit("draft:terminate-draft");
	}, []);

	const onAcceptRepeatPreviousTurn = useCallback(() => {
		setRepeatPreviousTurnModalActive(false);
		socket.emit("draft:repeat-previous-turn", currentDraft.turn?.number);
	}, [currentDraft]);

	const onDeclineRepeatPreviousTurn = useCallback(() => {
		setRepeatPreviousTurnModalActive(false);
		socket.emit("draft:decline-repeat-previous-turn", currentDraft.turn?.number);
	}, [currentDraft]);

	if (loadingDraftData)
		return (
			<div className="flex items-center justify-center h-full w-full">
				<span className="flex items-center justify-center text-xl gap-2">
					Loading draft <LoaderSpin />
				</span>
			</div>
		);

	if (!currentDraft)
		return (
			<FloatingFrame>
				<div className="w-full h-full flex items-center justify-center">
					<span className="text-2xl text-red-600">Error loading draft</span>
				</div>
			</FloatingFrame>
		);

	return (
		<DraftContext.Provider
			value={{
				room,
				player,
				styles,
				activeDraft,
				totalSeconds,
				setActiveDraft,
				selectedChampion,
				setSelectedChampion,
				addMessageToChatBox,
			}}
		>
			<div className="h-full max-h-full text-white overflow-y-auto">
				{/* Main Layout */}
				<div className="relative z-10 pt-2 px-4 h-full flex flex-col">
					{/* Header Controls */}
					<div className="mb-2">
						{/* Draft Status Bar */}
						<div className="bg-black/20 backdrop-blur-xl border border-white/10 rounded-2xl h-12 shadow-2xl grid-cols-3 grid items-center px-2">
							{/* Draft Controls */}
							<DraftControls />

							{/* Draft Status Indicator */}
							{(currentDraft.state === "ongoing" ||
								currentDraft.state === "finished") && <DraftStatusIndicator />}

							{/* Right Side Controls */}
							<div className="flex items-center justify-end gap-2 col-start-3">
								{/* <DraftControlButton
									Icon={CopyIcon}
									onClick={() => {
										if (navigator.clipboard) {
											navigator.clipboard.writeText(
												baseUrl
											);
											toast.success(
												"Draft Link copied to clipboard"
											);
										}
									}}
								/> */}
								<CopyLinksMenu
									guestLink={baseUrl}
									tournamentCode={currentDraft.tournamentCode}
								/>
								{/* <DraftControlButton
									Icon={MessageCircleIcon}
									onClick={() => setShowChat(!showChat)}
								/> */}
								{/* <DraftControlButton
									Icon={SettingsIcon}
									onClick={() => setShowSidebar(!showSidebar)}
								/> */}
							</div>
						</div>
					</div>

					{/* Main Content Grid */}
					<div className="flex-1 grid grid-cols-16 gap-3 max-h-full pb-2 overflow-y-auto">
						{/* Blue Team History */}
						{room.draftsCount > 1 && (
							<DraftTeamHistory
								teamColor="blue"
								teamId={currentDraft.blue.id}
								drafts={room.drafts}
							/>
						)}
						{/* Blue Team Draft Data */}
						<DraftTeamData
							teamColor="blue"
							teamData={currentDraft.blue}
							currentTurn={currentDraft.turn}
							draftState={currentDraft.state}
							className="col-start-3"
						/>

						{/* Center Column - Champion Select & Draft Status */}
						<div className="col-span-6 flex flex-col gap-2 h-full max-h-full overflow-y-auto">
							{/* Champion Select */}
							<ChampionSelector
								blueTeam={currentDraft.blue}
								redTeam={currentDraft.red}
								selectedChampion={selectedChampion}
								disabledChampions={room.disabledChampions}
								canSelect={
									currentDraft.state === "ongoing" &&
									currentDraft.turn?.team === player.team
								}
								handleChampionSelect={handleChampionSelect}
							/>
							{/* Team Chat with Tabs */}
							<div
								className="bg-black/20 backdrop-blur-xl border border-white/10
							rounded-2xl shadow-2xl
							flex flex-col overflow-hidden
							h-72 max-h-[40%] shrink-0"
							>
								<div className="bg-linear-to-r from-emerald-600/30 to-teal-600/30 backdrop-blur-md p-2 border-b border-emerald-400/20 shrink-0">
									<div className="flex items-center justify-between">
										<div className="flex items-center gap-1">
											{activeTab === "chat" && (
												<MessageCircleIcon
													className="text-emerald-400"
													size={14}
												/>
											)}
											{activeTab === "members" && (
												<UsersIcon className="text-emerald-400" size={14} />
											)}
											{activeTab === "drafts" && (
												<SwordsIcon
													className="text-emerald-400"
													size={14}
												/>
											)}
											<span className="font-bold text-xs">
												{activeTab === "chat"
													? "Chat"
													: activeTab === "members"
														? "Team Members"
														: "Drafts"}
											</span>
										</div>

										{/* Tabs */}
										<div className="flex items-center gap-1 bg-gray-800/50 backdrop-blur-md border border-gray-600/30 rounded-lg p-1">
											<button
												onClick={() => setActiveTab("chat")}
												className={`px-2 py-1 rounded-md text-xs font-medium transition-all duration-200 ${
													activeTab === "chat"
														? "bg-emerald-500 text-white shadow-lg"
														: "text-gray-400 hover:text-white hover:bg-gray-700/50"
												}`}
											>
												Chat
											</button>
											<button
												onClick={() => setActiveTab("members")}
												className={`px-2 py-1 rounded-md text-xs font-medium transition-all duration-200 ${
													activeTab === "members"
														? "bg-emerald-500 text-white shadow-lg"
														: "text-gray-400 hover:text-white hover:bg-gray-700/50"
												}`}
											>
												Members
											</button>
											<button
												onClick={() => setActiveTab("drafts")}
												className={`px-2 py-1 rounded-md text-xs font-medium transition-all duration-200 ${
													activeTab === "drafts"
														? "bg-emerald-500 text-white shadow-lg"
														: "text-gray-400 hover:text-white hover:bg-gray-700/50"
												}`}
											>
												Drafts
											</button>
										</div>
									</div>
								</div>

								{/* Tab Content */}
								<div className="flex-1 overflow-hidden flex flex-col">
									{activeTab === "chat" && (
										<ChatTab
											messages={chatMessages}
											onSubmit={onSubmitChatMessage}
										/>
									)}
									{activeTab === "members" && <MembersTab />}
									{activeTab === "drafts" && <DraftTab />}
								</div>
							</div>
						</div>
						{/* Red Team Draft Data */}
						<DraftTeamData
							teamColor="red"
							teamData={currentDraft.red}
							currentTurn={currentDraft.turn}
							draftState={currentDraft.state}
						/>
						{/* Red Team History */}
						{room.draftsCount > 1 && (
							<DraftTeamHistory
								teamColor="red"
								teamId={currentDraft.red.id}
								drafts={room.drafts}
							/>
						)}
					</div>
				</div>

				{/* Match Completion Options */}
				{currentDraft.state === "finished" &&
					activeDraft + 1 < room.draftsCount &&
					room.currentDraft === activeDraft &&
					player.team && (
						<motion.div
							initial={{ opacity: 0, y: 50 }}
							animate={{ opacity: 1, y: 0 }}
							className="fixed bottom-6 right-6 w-64 bg-black/20 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl z-40"
						>
							<div className="p-4">
								<h3 className="text-white font-semibold mb-3 text-sm">
									Match Actions
								</h3>
								<div className="space-y-2">
									<motion.button
										whileHover={{ scale: 1.02 }}
										whileTap={{ scale: 0.98 }}
										onClick={() => setMatchAction("same_side")}
										className={`w-full p-3 rounded-xl text-sm font-medium transition-all duration-200 ${
											matchAction === "same_side"
												? "bg-linear-to-r from-green-500 to-emerald-600 text-white shadow-lg"
												: "bg-gray-800/50 hover:bg-gray-700/50 text-gray-300 hover:text-white border border-gray-600/30"
										}`}
									>
										Same Side
									</motion.button>

									<motion.button
										whileHover={{ scale: 1.02 }}
										whileTap={{ scale: 0.98 }}
										onClick={() => setMatchAction("switch_side")}
										className={`w-full p-3 rounded-xl text-sm font-medium transition-all duration-200 ${
											matchAction === "switch_side"
												? "bg-linear-to-r from-blue-500 to-cyan-600 text-white shadow-lg"
												: "bg-gray-800/50 hover:bg-gray-700/50 text-gray-300 hover:text-white border border-gray-600/30"
										}`}
									>
										Switch Side
									</motion.button>

									{/* <motion.button
										whileHover={{ scale: 1.02 }}
										whileTap={{ scale: 0.98 }}
										onClick={() =>
											setMatchAction("end_match")
										}
										className={`w-full p-3 rounded-xl text-sm font-medium transition-all duration-200 ${
											matchAction === "end_match"
												? "bg-gradient-to-r from-red-500 to-pink-600 text-white shadow-lg"
												: "bg-gray-800/50 hover:bg-gray-700/50 text-gray-300 hover:text-white border border-gray-600/30"
										}`}
									>
										End Match
									</motion.button> */}
								</div>

								{matchAction && (
									<motion.div
										initial={{ opacity: 0, height: 0 }}
										animate={{ opacity: 1, height: "auto" }}
										className="mt-3 p-3 bg-gray-800/30 rounded-lg border border-gray-600/30"
									>
										<p className="text-gray-400 text-xs mb-2">
											{matchAction === "same_side" &&
												"Continue with the same team compositions for the next game."}
											{matchAction === "switch_side" &&
												"Teams will switch sides for the next game."}
											{matchAction === "end_match" &&
												"End the current match and return to lobby."}
										</p>
										<div className="flex gap-2">
											<motion.button
												whileHover={{ scale: 1.05 }}
												whileTap={{ scale: 0.95 }}
												onClick={() => {
													const swapSide = matchAction === "switch_side";

													socket.emit(
														"draft:next-draft",
														swapSide, // swap side
														room.currentDraft,
													);

													setMatchAction(null);
												}}
												className="px-3 py-1 bg-green-600 hover:bg-green-500 text-white rounded-lg text-xs font-medium transition-colors"
											>
												Confirm
											</motion.button>
											<motion.button
												whileHover={{ scale: 1.05 }}
												whileTap={{ scale: 0.95 }}
												onClick={() => setMatchAction(null)}
												className="px-3 py-1 bg-gray-600 hover:bg-gray-500 text-white rounded-lg text-xs font-medium transition-colors"
											>
												Cancel
											</motion.button>
										</div>
									</motion.div>
								)}
							</div>
						</motion.div>
					)}

				{/* Chat Popup */}
				<AnimatePresence mode="sync">
					{showChat && (
						<motion.div
							initial={{ opacity: 0, x: 300 }}
							animate={{ opacity: 1, x: 0 }}
							exit={{ opacity: 0, x: 300 }}
							className="fixed right-6 top-24 bottom-6 w-80 bg-black/20 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl z-50"
						>
							<div className="h-full flex flex-col">
								<div className="p-4 border-b border-white/10 flex items-center justify-between">
									<h3 className="font-semibold">Draft Chat</h3>
									<button
										onClick={() => setShowChat(false)}
										className="p-1 hover:bg-gray-700/50 rounded-md transition-colors"
									>
										<XIcon size={16} />
									</button>
								</div>
								<div className="flex-1 p-4 text-center text-gray-400">
									Chat functionality coming soon...
								</div>
							</div>
						</motion.div>
					)}
				</AnimatePresence>

				{/* Sidebar */}
				<AnimatePresence mode="sync">
					{showSidebar && (
						<motion.div
							initial={{ opacity: 0, x: 300 }}
							animate={{ opacity: 1, x: 0 }}
							exit={{ opacity: 0, x: 300 }}
							className="fixed right-6 top-24 bottom-6 w-80 bg-black/20 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl z-50"
						>
							<div className="h-full flex flex-col">
								<div className="p-4 border-b border-white/10 flex items-center justify-between">
									<h3 className="font-semibold">Draft Tools</h3>
									<button
										onClick={() => setShowSidebar(false)}
										className="p-1 hover:bg-gray-700/50 rounded-md transition-colors"
									>
										<XIcon size={16} />
									</button>
								</div>
								<div className="flex-1 p-4 space-y-4">
									<div className="text-sm text-gray-400">• Members List</div>
									<div className="text-sm text-gray-400">• Draft History</div>
									<div className="text-sm text-gray-400">• Settings</div>
									<div className="text-sm text-gray-400">
										Additional features coming soon...
									</div>
								</div>
							</div>
						</motion.div>
					)}
				</AnimatePresence>
			</div>
			<JoinRoomModal room={room} isActive={joinRoomModalActive} onJoinTeam={joinTeam} />
			<TimeOverModal
				styles={styles}
				isActive={timeOverModalActive}
				onResetTurn={onResetTurn}
				onResetDraft={onResetDraft}
				onTerminateDraft={onTerminateDraft}
			/>
			<RepeatPreviousTurnModal
				isActive={repeatPreviousTurnModalActive}
				onAccept={onAcceptRepeatPreviousTurn}
				onDecline={onDeclineRepeatPreviousTurn}
			/>
		</DraftContext.Provider>
	);
}
