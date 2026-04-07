"use client";

import useDraft from "@/hooks/use-draft";
import { socket } from "@/lib/sockets";
import { cn, draftTeamTextColor, sortRoomMembers } from "@/lib/utils";
import { PlusIcon } from "lucide-react";
import { memo, useMemo } from "react";
import { TJoinTeamFunction } from "@/app/(main-layout)/draft/[roomId]/page";
import { TRoomMember } from "@compesn/shared/common/types/room-member";
import { TTeamColor } from "@compesn/shared/common/types/team-color";

const MembersBox = memo(function MembersBox({ joinTeam }: { joinTeam: TJoinTeamFunction }) {
	const { player, room, activeDraft } = useDraft();

	const { blueMembers, redMembers, spectators } = useMemo(
		() => sortRoomMembers(room.members),
		[room.members],
	);

	return (
		<div className="w-full h-full flex flex-col gap-2 overflow-y-auto select-none">
			<div className="flex flex-col gap-4">
				<Team
					teamName={room.drafts[activeDraft].blue.name}
					player={player}
					team={"blue"}
					members={blueMembers}
					joinTeam={joinTeam}
				/>
				<Team
					teamName={room.drafts[activeDraft].red.name}
					player={player}
					team={"red"}
					members={redMembers}
					joinTeam={joinTeam}
				/>
				<Team
					teamName="Spectators"
					player={player}
					team={undefined}
					members={spectators}
					joinTeam={joinTeam}
				/>
			</div>
		</div>
	);
});

const Team = memo(function Team({
	teamName,
	members,
	player,
	team,
	joinTeam,
}: {
	teamName: string;
	members: TRoomMember[];
	player: TRoomMember;
	team: TTeamColor | undefined;
	joinTeam: TJoinTeamFunction;
}) {
	const { room } = useDraft();
	const textColor = draftTeamTextColor(team);

	return (
		<div className="flex flex-col gap-1">
			<div className="border-b w-full flex justify-between items-center gap-2 py-1">
				<span className={cn("text-lg", textColor)}>{teamName}</span>
				{team && !player.team && (
					<span
						className={cn("text-sm hover:cursor-pointer", textColor)}
						onClick={() => {
							joinTeam(room.id, room.drafts[room.currentDraft][team].id, false, true);
						}}
					>
						Join Team
					</span>
				)}
			</div>
			<div className="flex flex-col">
				{members.length !== 0 ? (
					members.map((member) => {
						return (
							<div
								key={member.socketId}
								className="flex items-center justify-between py-1"
							>
								<div className="flex items-center justify-start">
									<span
										className={cn(
											member.socketId === player.socketId && "underline",
										)}
									>
										{member.name}
									</span>
								</div>
							</div>
						);
					})
				) : (
					<div className="w-full py-4 text-neutral-500 flex items-center justify-center">
						There are no members
					</div>
				)}
			</div>
		</div>
	);
});

export default MembersBox;
