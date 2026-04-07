"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { useTRPC } from "@/trpc/client";
import type { ChampionData } from "@/lib/champion-cache";
import LoaderSpin from "@/components/loader-spin";
import { Search, Target, Ban, Filter } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface ChampionGridProps {
	selectedChampion: number | null;
	onChampionSelect: (championId: number) => void;
	bannedChampions: number[];
	pickedChampions: number[];
	isUserTurn: boolean;
	currentAction: "PICK" | "BAN";
	onActionConfirm: () => void;
	isLoading: boolean;
}

const ROLE_FILTERS = [
	{ value: "all", label: "All" },
	{ value: "Assassin", label: "Assassin" },
	{ value: "Fighter", label: "Fighter" },
	{ value: "Mage", label: "Mage" },
	{ value: "Marksman", label: "Marksman" },
	{ value: "Support", label: "Support" },
	{ value: "Tank", label: "Tank" },
];

export function ChampionGrid({
	selectedChampion,
	onChampionSelect,
	bannedChampions,
	pickedChampions,
	isUserTurn,
	currentAction,
	onActionConfirm,
	isLoading: actionLoading,
}: ChampionGridProps) {
	const trpc = useTRPC();
	const [searchTerm, setSearchTerm] = useState("");
	const [roleFilter, setRoleFilter] = useState("all");

	// Fetch champion data using tRPC
	const { data: champions = [], isLoading } = useQuery(
		trpc.champions.getDDragonData.queryOptions(),
	);

	// Filter champions based on search and role
	const filteredChampions = useMemo(() => {
		return champions.filter((champion) => {
			const matchesSearch =
				champion.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
				champion.title.toLowerCase().includes(searchTerm.toLowerCase());

			const matchesRole = roleFilter === "all" || champion.tags.includes(roleFilter);

			return matchesSearch && matchesRole;
		});
	}, [champions, searchTerm, roleFilter]);

	const getChampionImageUrl = (champion: ChampionData) => {
		return `https://ddragon.leagueoflegends.com/cdn/14.1.1/img/champion/${champion.image.full}`;
	};

	const isChampionDisabled = (championId: number) => {
		return bannedChampions.includes(championId) || pickedChampions.includes(championId);
	};

	const getChampionStatus = (championId: number) => {
		if (bannedChampions.includes(championId)) return "banned";
		if (pickedChampions.includes(championId)) return "picked";
		return "available";
	};

	if (isLoading) {
		return (
			<Card className="p-6">
				<div className="flex items-center justify-center h-64">
					<LoaderSpin />
				</div>
			</Card>
		);
	}

	return (
		<Card className="p-6">
			{/* Header */}
			<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
				<div className="flex items-center gap-2">
					<h3 className="text-lg font-semibold">Champion Select</h3>
					{selectedChampion && (
						<Badge
							className={`${
								currentAction === "PICK" ? "bg-green-500" : "bg-red-500"
							} text-white`}
						>
							{champions.find((c) => parseInt(c.key) === selectedChampion)?.name}{" "}
							selected
						</Badge>
					)}
				</div>

				{/* Action Button */}
				{isUserTurn && selectedChampion && (
					<Button
						onClick={onActionConfirm}
						disabled={actionLoading}
						className={`${
							currentAction === "PICK"
								? "bg-green-600 hover:bg-green-700"
								: "bg-red-600 hover:bg-red-700"
						} text-white`}
					>
						{actionLoading ? (
							<LoaderSpin />
						) : (
							<>
								{currentAction === "PICK" ? (
									<Target className="w-4 h-4 mr-2" />
								) : (
									<Ban className="w-4 h-4 mr-2" />
								)}
								{currentAction} Champion
							</>
						)}
					</Button>
				)}
			</div>

			{/* Filters */}
			<div className="flex flex-col sm:flex-row gap-4 mb-6">
				{/* Search */}
				<div className="relative flex-1">
					<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
					<Input
						placeholder="Search champions..."
						value={searchTerm}
						onChange={(e) => setSearchTerm(e.target.value)}
						className="pl-10"
					/>
				</div>

				{/* Role Filter */}
				<div className="flex items-center gap-2">
					<Filter className="w-4 h-4 text-muted-foreground" />
					<select
						value={roleFilter}
						onChange={(e) => setRoleFilter(e.target.value)}
						className="px-3 py-2 border rounded-md bg-background"
					>
						{ROLE_FILTERS.map((role) => (
							<option key={role.value} value={role.value}>
								{role.label}
							</option>
						))}
					</select>
				</div>
			</div>

			{/* Champion Grid */}
			<div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2">
				{filteredChampions.map((champion) => {
					const championId = parseInt(champion.key);
					const status = getChampionStatus(championId);
					const isSelected = selectedChampion === championId;
					const isDisabled = isChampionDisabled(championId) || !isUserTurn;

					return (
						<div
							key={champion.id}
							className={`
                                relative aspect-square rounded-md overflow-hidden cursor-pointer border-2 transition-all
                                ${isSelected ? "border-primary ring-2 ring-primary/50" : "border-transparent"}
                                ${isDisabled ? "opacity-50 cursor-not-allowed" : "hover:border-primary/50"}
                                ${status === "banned" ? "grayscale" : ""}
                            `}
							onClick={() => !isDisabled && onChampionSelect(championId)}
							title={`${champion.name} - ${champion.title}`}
						>
							<Image
								src={getChampionImageUrl(champion)}
								alt={champion.name}
								fill
								className="object-cover"
								unoptimized
							/>

							{/* Status Overlay */}
							{status === "banned" && (
								<div className="absolute inset-0 bg-red-500/30 flex items-center justify-center">
									<Ban className="w-6 h-6 text-red-600" />
								</div>
							)}

							{status === "picked" && (
								<div className="absolute inset-0 bg-green-500/30 flex items-center justify-center">
									<Target className="w-6 h-6 text-green-600" />
								</div>
							)}

							{/* Champion Name */}
							<div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-xs p-1 text-center">
								{champion.name}
							</div>

							{/* Selection Indicator */}
							{isSelected && (
								<div className="absolute top-1 right-1 w-3 h-3 bg-primary rounded-full"></div>
							)}
						</div>
					);
				})}
			</div>

			{/* No Results */}
			{filteredChampions.length === 0 && (
				<div className="text-center py-8 text-muted-foreground">
					<p>No champions found matching your criteria.</p>
				</div>
			)}

			{/* Instructions */}
			{!isUserTurn && (
				<div className="mt-6 p-4 bg-muted rounded-md text-center text-muted-foreground">
					<p>Wait for your turn to {currentAction.toLowerCase()} a champion</p>
				</div>
			)}
		</Card>
	);
}
