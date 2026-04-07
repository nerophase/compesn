import useDraft from "@/hooks/use-draft";
import { socket } from "@/lib/sockets";
import { cn, sortRoomMembers } from "@/lib/utils";
import { TRoomMember } from "@compesn/shared/common/types/room-member";
import { TTeamColor } from "@compesn/shared/common/types/team-color";
import { PlusIcon } from "lucide-react";
import { useMemo } from "react";
import { ContextMenu, ContextMenuContent, ContextMenuTrigger } from "@/components/ui/context-menu";

export default function MembersTab() {
	const { room } = useDraft();

	const { blueMembers, redMembers, spectators } = useMemo(
		() => sortRoomMembers(room.members),
		[room.members],
	);

	return (
		<div className="flex-1 p-3 text-xs">
			<div className="grid grid-cols-2 gap-3">
				{/* Blue Team */}
				<TeamMembersList members={blueMembers} team="blue" />
				{/* Red Team */}
				<TeamMembersList members={redMembers} team="red" />
			</div>
		</div>
	);
}

function TeamMembersList({ members, team }: { members: TRoomMember[]; team: TTeamColor }) {
	const { player } = useDraft();

	return (
		<div>
			<div
				className={cn(
					"font-medium mb-2",
					team === "blue" ? "text-blue-400" : "text-red-400 ",
				)}
			>
				{team === "blue" ? "Blue" : "Red"} Team
			</div>
			<div className="space-y-1">
				{members.map((member) => {
					const showContextMenu = false; // Add options..

					return (
						<ContextMenu key={member.socketId}>
							<ContextMenuTrigger
								className="block"
								title={showContextMenu ? "Right click to see options.." : ""}
							>
								<div
									className={cn(
										"flex items-center gap-2 p-2 rounded-md",
										showContextMenu && "hover:cursor-pointer",
										team === "blue" ? "bg-blue-500/10" : "bg-red-500/10",
									)}
									key={member.socketId}
								>
									<div className="w-2 h-2 bg-green-400 rounded-full"></div>
									<div className="flex w-full gap-1">
										<span
											className={cn(
												"text-white",
												player.socketId === member.socketId && "underline",
											)}
										>
											{member.name}
										</span>
									</div>
								</div>
							</ContextMenuTrigger>
							{showContextMenu && (
								<ContextMenuContent>{/* options */}</ContextMenuContent>
							)}
						</ContextMenu>
					);
				})}
			</div>
		</div>
	);
}
