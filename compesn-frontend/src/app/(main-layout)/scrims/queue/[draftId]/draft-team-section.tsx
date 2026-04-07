"use client";

import React from "react";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { useTRPC } from "@/trpc/client";
import type { ChampionData } from "@/lib/champion-cache";
import LoaderSpin from "@/components/loader-spin";
import { Users, Ban, Target } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface DraftTeamSectionProps {
	team: any;
	picks: number[];
	bans: number[];
	color: "blue" | "red";
	isUserTeam: boolean;
}

export function DraftTeamSection({ team, picks, bans, color, isUserTeam }: DraftTeamSectionProps) {
	const trpc = useTRPC();
	// Fetch champion data for picks and bans using tRPC
	const allChampionIds = [...picks, ...bans];
	const { data: championData = {}, isLoading } = useQuery(
		trpc.champions.getByIds.queryOptions(allChampionIds, {
			enabled: allChampionIds.length > 0,
		}),
	);

	const getChampionImageUrl = (championId: number) => {
		const champion = championData[championId];
		if (!champion) return "/imgs/champions/default.jpg";
		return `https://ddragon.leagueoflegends.com/cdn/14.1.1/img/champion/${champion.image.full}`;
	};

	const getChampionName = (championId: number) => {
		return championData[championId]?.name || "Unknown";
	};

	const colorClasses = {
		blue: {
			border: "border-blue-500",
			bg: "bg-blue-50 dark:bg-blue-950",
			text: "text-blue-600 dark:text-blue-400",
			accent: "bg-blue-500",
		},
		red: {
			border: "border-red-500",
			bg: "bg-red-50 dark:bg-red-950",
			text: "text-red-600 dark:text-red-400",
			accent: "bg-red-500",
		},
	};

	const classes = colorClasses[color];

	return (
		<Card className={`p-6 ${classes.border} ${isUserTeam ? classes.bg : ""}`}>
			{/* Team Header */}
			<div className="flex items-center justify-between mb-4">
				<div className="flex items-center gap-3">
					<div className={`w-4 h-4 rounded-full ${classes.accent}`}></div>
					<h3 className={`text-xl font-bold ${classes.text}`}>{team.name}</h3>
					<Badge variant="outline" className="text-xs">
						{team.tag}
					</Badge>
					{isUserTeam && (
						<Badge className={`${classes.accent} text-white text-xs`}>Your Team</Badge>
					)}
				</div>
				<div className="flex items-center gap-2 text-sm text-muted-foreground">
					<Users className="w-4 h-4" />
					<span>{team.members.length} members</span>
				</div>
			</div>

			{/* Team Members */}
			<div className="mb-6">
				<h4 className="text-sm font-semibold text-muted-foreground mb-2">Team Members</h4>
				<div className="space-y-2">
					{team.members.map((member: any) => (
						<div key={member.id} className="flex items-center gap-3 text-sm">
							<Badge
								variant="outline"
								className="text-xs min-w-[60px] justify-center"
							>
								{member.role}
							</Badge>
							<span className="font-medium">{member.user.username}</span>
							{member.user.riotAccount && (
								<span className="text-muted-foreground">
									{member.user.riotAccount.gameName}#
									{member.user.riotAccount.tagLine}
								</span>
							)}
						</div>
					))}
				</div>
			</div>

			{/* Picks Section */}
			<div className="mb-6">
				<div className="flex items-center gap-2 mb-3">
					<Target className="w-4 h-4 text-green-600" />
					<h4 className="text-sm font-semibold">Picks ({picks.length}/5)</h4>
				</div>
				<div className="grid grid-cols-5 gap-2">
					{Array.from({ length: 5 }, (_, index) => {
						const championId = picks[index];
						return (
							<div
								key={index}
								className="aspect-square bg-muted rounded-md border-2 border-green-500 overflow-hidden relative"
							>
								{championId ? (
									isLoading ? (
										<div className="flex items-center justify-center h-full">
											<LoaderSpin />
										</div>
									) : (
										<>
											<Image
												src={getChampionImageUrl(championId)}
												alt={getChampionName(championId)}
												fill
												className="object-cover"
												unoptimized
											/>
											<div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-xs p-1 text-center">
												{getChampionName(championId)}
											</div>
										</>
									)
								) : (
									<div className="flex items-center justify-center h-full text-muted-foreground">
										<span className="text-xs">Pick {index + 1}</span>
									</div>
								)}
							</div>
						);
					})}
				</div>
			</div>

			{/* Bans Section */}
			<div>
				<div className="flex items-center gap-2 mb-3">
					<Ban className="w-4 h-4 text-red-600" />
					<h4 className="text-sm font-semibold">Bans ({bans.length}/5)</h4>
				</div>
				<div className="grid grid-cols-5 gap-2">
					{Array.from({ length: 5 }, (_, index) => {
						const championId = bans[index];
						return (
							<div
								key={index}
								className="aspect-square bg-muted rounded-md border-2 border-red-500 overflow-hidden relative"
							>
								{championId ? (
									isLoading ? (
										<div className="flex items-center justify-center h-full">
											<LoaderSpin />
										</div>
									) : (
										<>
											<Image
												src={getChampionImageUrl(championId)}
												alt={getChampionName(championId)}
												fill
												className="object-cover grayscale"
												unoptimized
											/>
											<div className="absolute inset-0 bg-red-500/20 flex items-center justify-center">
												<Ban className="w-6 h-6 text-red-600" />
											</div>
											<div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-xs p-1 text-center">
												{getChampionName(championId)}
											</div>
										</>
									)
								) : (
									<div className="flex items-center justify-center h-full text-muted-foreground">
										<span className="text-xs">Ban {index + 1}</span>
									</div>
								)}
							</div>
						);
					})}
				</div>
			</div>
		</Card>
	);
}
