"use client";

import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { CalendarIcon, HistoryIcon } from "lucide-react";
import { useTRPC } from "@/trpc/client";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { LocalizedDateTime } from "@/components/localized-datetime";
import { cn } from "@/lib/utils";

export function TeamDraftHistoryTab({ teamId }: { teamId: string }) {
	const trpc = useTRPC();
	const router = useRouter();

	const {
		data: draftHistory,
		isLoading,
		error,
	} = useQuery({
		...(trpc.draftHistory.byTeam as any).queryOptions({
			teamId,
			limit: 20,
			offset: 0,
		}),
	});

	if (isLoading) {
		return (
			<Card className="bg-gray-900/30 backdrop-blur-xl border-cyan-500/30 shadow-2xl">
				<CardContent className="py-12">
					<div className="text-center">
						<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto"></div>
						<p className="text-gray-300 mt-4">Loading draft history...</p>
					</div>
				</CardContent>
			</Card>
		);
	}

	if (error) {
		return (
			<Card className="bg-gray-900/30 backdrop-blur-xl border-cyan-500/30 shadow-2xl">
				<CardContent className="py-12">
					<div className="text-center">
						<HistoryIcon className="h-12 w-12 text-red-400 mx-auto mb-4" />
						<h3 className="text-lg font-medium text-gray-300 mb-2">
							Error loading draft history
						</h3>
						<p className="text-gray-500">{(error as Error).message}</p>
					</div>
				</CardContent>
			</Card>
		);
	}

	const drafts = draftHistory as any[] | undefined;

	if (!drafts || drafts.length === 0) {
		return (
			<Card className="bg-gray-900/30 backdrop-blur-xl border-cyan-500/30 shadow-2xl">
				<CardContent className="py-12">
					<div className="text-center">
						<HistoryIcon className="h-12 w-12 text-gray-500 mx-auto mb-4" />
						<h3 className="text-lg font-medium text-gray-300 mb-2">
							No draft history yet
						</h3>
						<p className="text-gray-500">
							Completed scrims with drafts will appear here.
						</p>
					</div>
				</CardContent>
			</Card>
		);
	}

	return (
		<div className="space-y-6">
			<Card className="bg-gray-900/30 backdrop-blur-xl border-cyan-500/30 shadow-2xl">
				<CardHeader>
					<CardTitle className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">
						Draft History
					</CardTitle>
					<CardDescription className="text-gray-400">
						{drafts.length} completed draft{drafts.length !== 1 ? "s" : ""} from scrims
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="space-y-4">
						{drafts.map((draft: any) => (
							<div
								key={draft.id}
								className="p-4 bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm rounded-lg border border-gray-700/50 hover:border-cyan-500/30 transition-all cursor-pointer"
								onClick={() => {
									if (draft.scrimId) {
										router.push(`/scrims/${draft.scrimId}`);
									}
								}}
							>
								<div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
									<div className="flex-1">
										<div className="flex items-center gap-3 mb-2">
											<Badge
												className={
													draft.isBlueTeam ? "bg-blue-600/80" : "bg-red-600/80"
												}
											>
												{draft.isBlueTeam ? "Blue Side" : "Red Side"}
											</Badge>
											<Badge
												variant="outline"
												className={cn(
													"backdrop-blur-sm",
													draft.status === "COMPLETED"
														? "border-green-500/50 bg-green-500/10 text-green-400"
														: draft.status === "ACTIVE"
															? "border-yellow-500/50 bg-yellow-500/10 text-yellow-400"
															: "border-gray-500/50 bg-gray-500/10 text-gray-400",
												)}
											>
												{draft.status}
											</Badge>
										</div>

										{draft.opponentTeam && (
											<div className="flex items-center gap-2 text-gray-300 mb-2">
												<span className="text-sm text-gray-500">vs</span>
												<span className="font-medium">
													{draft.opponentTeam.name}
												</span>
												<Badge
													variant="outline"
													className="text-xs border-gray-600"
												>
													{draft.opponentTeam.tag}
												</Badge>
											</div>
										)}

										<div className="flex items-center gap-2 text-sm text-gray-400">
											<CalendarIcon className="h-4 w-4" />
											<LocalizedDateTime
												date={draft.createdAt}
												options={{
													dateStyle: "medium",
													timeStyle: "short",
												}}
											/>
										</div>
									</div>

									<div className="flex flex-col gap-2">
										<div className="flex items-center gap-1">
											<span className="text-xs text-gray-500 w-12">Picks:</span>
											<div className="flex gap-1">
												{(draft.teamPicks as number[])
													?.slice(0, 5)
													.map((champId: number, index: number) => (
														<div
															key={index}
															className="w-8 h-8 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded border border-cyan-500/30 flex items-center justify-center text-xs text-cyan-400"
														>
															{champId || "?"}
														</div>
													))}
												{(!draft.teamPicks || draft.teamPicks.length === 0) && (
													<span className="text-gray-500 text-sm">
														No picks
													</span>
												)}
											</div>
										</div>

										<div className="flex items-center gap-1">
											<span className="text-xs text-gray-500 w-12">Bans:</span>
											<div className="flex gap-1">
												{(draft.teamBans as number[])
													?.slice(0, 5)
													.map((champId: number, index: number) => (
														<div
															key={index}
															className="w-6 h-6 bg-gradient-to-br from-red-500/20 to-orange-500/20 rounded border border-red-500/30 flex items-center justify-center text-xs text-red-400"
														>
															{champId || "?"}
														</div>
													))}
												{(!draft.teamBans || draft.teamBans.length === 0) && (
													<span className="text-gray-500 text-sm">
														No bans
													</span>
												)}
											</div>
										</div>
									</div>
								</div>
							</div>
						))}
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
