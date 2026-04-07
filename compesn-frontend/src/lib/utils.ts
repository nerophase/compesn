import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { TChampion } from "@compesn/shared/common/types/champion";
import { TTeamColor } from "@compesn/shared/common/types/team-color";
import { TRoomMember } from "@compesn/shared/common/types/room-member";
import { TDraft } from "@compesn/shared/common/types/draft";
import { env } from "@/environment";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export function getTeam(teamId: string, draft: TDraft): TTeamColor | undefined {
	return teamId === draft.blue.id ? "blue" : teamId === draft.red.id ? "red" : undefined;
}

export function getTeamCode(teamId: string) {
	return teamId.slice(0, 8);
}

export function sortRoomMembers(members: TRoomMember[], player?: TRoomMember) {
	const blueMembers: TRoomMember[] = [];
	const redMembers: TRoomMember[] = [];
	const spectators: TRoomMember[] = [];

	members.sort((memberA, memberB) => {
		if (memberA.socketId === player?.socketId) return -1;
		if (memberA.socketId === player?.socketId) return -1;
		return 1;
	});

	members.forEach((member) => {
		switch (member.team) {
			case "blue":
				blueMembers.push(member);
				break;
			case "red":
				redMembers.push(member);
				break;
			case undefined:
				spectators.push(member);
				break;
		}
	});

	return { blueMembers, redMembers, spectators };
}

export const formatTimeAgo = (dateParam: string) => {
	const date = new Date(dateParam);
	const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);

	let interval = seconds / 31536000;
	if (interval >= 1) return Math.floor(interval) + "y ago";

	interval = seconds / 2592000;
	if (interval >= 1) return Math.floor(interval) + "mo ago";

	interval = seconds / 86400;
	if (interval >= 1) return Math.floor(interval) + "d ago";

	interval = seconds / 3600;
	if (interval >= 1) return Math.floor(interval) + "h ago";

	interval = seconds / 60;
	if (interval >= 1) return Math.floor(interval) + "m ago";

	return Math.floor(seconds) + "s ago";
};

export function clamp(num: number, min: number, max: number) {
	return Math.min(Math.max(num, min), max);
}

export const getChampionSmallImgURL = (champion: TChampion) => {
	return champion.fileName === "no-ban"
		? `/imgs/no-ban.svg`
		: `/imgs/champions/${champion.fileName}.png`;
};

export const getChampionLargeImgURL = (champion: TChampion) => {
	return `${env.NEXT_PUBLIC_SERVER_URL}/champions_imgs/${champion.fileName}_0.jpg`;
};

export const draftTeamBgColor = (team?: TTeamColor) => {
	return team === "blue" ? "bg-draft-blue" : team === "red" ? "bg-draft-red" : "bg-primary";
};

export const draftTeamTextColor = (team?: TTeamColor) => {
	return team === "blue" ? "text-draft-blue" : team === "red" ? "text-draft-red" : "text-primary";
};
