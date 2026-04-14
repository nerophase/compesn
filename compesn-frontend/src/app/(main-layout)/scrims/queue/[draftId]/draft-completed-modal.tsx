"use client";

import Image from "next/image";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useTRPC } from "@/trpc/client";
import LoaderSpin from "@/components/loader-spin";
import { Trophy, Target, Ban } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import type { QueueDraft } from "./draft-types";

interface DraftCompletedModalProps {
	isOpen: boolean;
	draft: QueueDraft | null;
	onClose: () => void;
}

export function DraftCompletedModal({ isOpen, draft, onClose }: DraftCompletedModalProps) {
	const trpc = useTRPC();
	// Fetch champion data for the final picks and bans using tRPC
	const allChampionIds = draft
		? [...draft.bluePicks, ...draft.redPicks, ...draft.blueBans, ...draft.redBans]
		: [];
	const { data: championData = {}, isLoading } = useQuery(
		trpc.champions.getByIds.queryOptions(allChampionIds, {
			enabled: isOpen && !!draft && allChampionIds.length > 0,
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

	if (!draft) return null;

	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<div className="flex items-center gap-3">
						<div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
							<Trophy className="w-6 h-6 text-green-600" />
						</div>
						<div>
							<DialogTitle className="text-green-600">Draft Completed!</DialogTitle>
							<DialogDescription>
								The champion select phase has been completed successfully.
							</DialogDescription>
						</div>
					</div>
				</DialogHeader>

				{isLoading ? (
					<div className="flex items-center justify-center py-8">
						<LoaderSpin />
					</div>
				) : (
					<div className="py-4 space-y-6">
						{/* Teams Summary */}
						<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
							{/* Blue Team */}
							<div className="space-y-4">
								<div className="flex items-center gap-2">
									<div className="w-4 h-4 bg-blue-500 rounded-full"></div>
									<h3 className="text-lg font-semibold text-blue-600">
										{draft.blueTeam.name}
									</h3>
									<Badge variant="outline">{draft.blueTeam.tag}</Badge>
								</div>

								{/* Blue Picks */}
								<div>
									<div className="flex items-center gap-2 mb-2">
										<Target className="w-4 h-4 text-green-600" />
										<span className="text-sm font-medium">Picks</span>
									</div>
									<div className="grid grid-cols-5 gap-2">
										{draft.bluePicks.map(
											(championId: number, index: number) => (
												<div
													key={index}
													className="aspect-square rounded-md overflow-hidden border-2 border-green-500 relative"
												>
													<Image
														src={getChampionImageUrl(championId)}
														alt={getChampionName(championId)}
														fill
														className="object-cover"
														unoptimized
													/>
												</div>
											),
										)}
									</div>
								</div>

								{/* Blue Bans */}
								<div>
									<div className="flex items-center gap-2 mb-2">
										<Ban className="w-4 h-4 text-red-600" />
										<span className="text-sm font-medium">Bans</span>
									</div>
									<div className="grid grid-cols-5 gap-2">
										{draft.blueBans.map((championId: number, index: number) => (
											<div
												key={index}
												className="aspect-square rounded-md overflow-hidden border-2 border-red-500 relative"
											>
												<Image
													src={getChampionImageUrl(championId)}
													alt={getChampionName(championId)}
													fill
													className="object-cover grayscale"
													unoptimized
												/>
												<div className="absolute inset-0 bg-red-500/20 flex items-center justify-center">
													<Ban className="w-4 h-4 text-red-600" />
												</div>
											</div>
										))}
									</div>
								</div>
							</div>

							{/* Red Team */}
							<div className="space-y-4">
								<div className="flex items-center gap-2">
									<div className="w-4 h-4 bg-red-500 rounded-full"></div>
									<h3 className="text-lg font-semibold text-red-600">
										{draft.redTeam.name}
									</h3>
									<Badge variant="outline">{draft.redTeam.tag}</Badge>
								</div>

								{/* Red Picks */}
								<div>
									<div className="flex items-center gap-2 mb-2">
										<Target className="w-4 h-4 text-green-600" />
										<span className="text-sm font-medium">Picks</span>
									</div>
									<div className="grid grid-cols-5 gap-2">
										{draft.redPicks.map((championId: number, index: number) => (
											<div
												key={index}
												className="aspect-square rounded-md overflow-hidden border-2 border-green-500 relative"
											>
												<Image
													src={getChampionImageUrl(championId)}
													alt={getChampionName(championId)}
													fill
													className="object-cover"
													unoptimized
												/>
											</div>
										))}
									</div>
								</div>

								{/* Red Bans */}
								<div>
									<div className="flex items-center gap-2 mb-2">
										<Ban className="w-4 h-4 text-red-600" />
										<span className="text-sm font-medium">Bans</span>
									</div>
									<div className="grid grid-cols-5 gap-2">
										{draft.redBans.map((championId: number, index: number) => (
											<div
												key={index}
												className="aspect-square rounded-md overflow-hidden border-2 border-red-500 relative"
											>
												<Image
													src={getChampionImageUrl(championId)}
													alt={getChampionName(championId)}
													fill
													className="object-cover grayscale"
													unoptimized
												/>
												<div className="absolute inset-0 bg-red-500/20 flex items-center justify-center">
													<Ban className="w-4 h-4 text-red-600" />
												</div>
											</div>
										))}
									</div>
								</div>
							</div>
						</div>

						{/* Next Steps */}
						<div className="bg-muted rounded-md p-4">
							<h4 className="font-medium mb-2">What&apos;s Next?</h4>
							<p className="text-sm text-muted-foreground">
								The draft is complete! Teams can now proceed to create a custom game
								using the selected champions. Make sure to coordinate with the
								opposing team for game setup.
							</p>
						</div>
					</div>
				)}

				<DialogFooter>
					<Button onClick={onClose} className="w-full">
						Back to Scrims
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
