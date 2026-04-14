"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useTRPC } from "@/trpc/client";
import { Button } from "@/components/ui/button";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, ClockIcon, UsersIcon, PlusIcon } from "lucide-react";
import { REGIONS, regionToName } from "@/constants/regions";
import { LocalizedDateTime } from "@/components/localized-datetime";
import { useQuery, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { getRankTierValue } from "@/trpc/routers/scrims/scrims.schema";
import type { AppRouter } from "@/trpc/routers/_app";
import {
	Pagination,
	PaginationContent,
	PaginationEllipsis,
	PaginationItem,
	PaginationLink,
	PaginationNext,
	PaginationPrevious,
} from "@/components/ui/pagination";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";

const RANK_TIERS = [
	"IRON",
	"BRONZE",
	"SILVER",
	"GOLD",
	"PLATINUM",
	"EMERALD",
	"DIAMOND",
	"MASTER",
	"GRANDMASTER",
	"CHALLENGER",
] as const;

type RankTier = (typeof RANK_TIERS)[number];
type ScrimsListResult = Awaited<ReturnType<AppRouter["scrims"]["list"]>>;
type ScrimListItem = ScrimsListResult["items"][number];
type ScrimMember = ScrimListItem["creatingTeam"]["members"][number];
type UserTeam = Awaited<ReturnType<AppRouter["teams"]["userTeamsFlat"]>>[number];
type Region =
	| "br"
	| "eune"
	| "euw"
	| "jp"
	| "lan"
	| "las"
	| "na"
	| "oce"
	| "kr"
	| "ru"
	| "tr"
	| "me"
	| "ph"
	| "sg"
	| "th"
	| "tw"
	| "vn"
	| "pbe";
type ScrimStatus = "OPEN" | "REQUESTED" | "ACCEPTED" | "CONFIRMED" | "CANCELLED" | "COMPLETED";

const defaultFilters: { status: ScrimStatus[]; teamName: string } = {
	status: ["OPEN", "REQUESTED"], // Add "REQUESTED" and test
	teamName: "",
};

function useDebounce(value: string, delay: number) {
	const [debounced, setDebounced] = useState(value);

	useEffect(() => {
		if (value === "") {
			return setDebounced(value);
		}

		const id = setTimeout(() => setDebounced(value), delay);
		return () => clearTimeout(id);
	}, [value, delay]);

	return debounced;
}

export default function ScrimsPage() {
	const router = useRouter();
	const trpc = useTRPC();
	const { data: session } = useSession();
	const currentUserId = session?.user?.id;
	const isLoggedIn = !!currentUserId;
	const [requestingScrimId, setRequestingScrimId] = useState<string | null>(null);
	const [cancellingRequestScrimId, setCancellingRequestScrimId] = useState<string | null>(null);
	const [requestDialogScrimId, setRequestDialogScrimId] = useState<string | null>(null);
	const [selectedRequestTeamId, setSelectedRequestTeamId] = useState<string>("");
	const [currentPage, setCurrentPage] = useState(1);
	const pageSize = 12;
	const [filters, setFilters] = useState<{
		minRankTier?: RankTier;
		maxRankTier?: RankTier;
		regions?: Region[];
		status?: ScrimStatus[];
	}>(defaultFilters);

	const [teamName, setTeamName] = useState("");
	const debouncedTeamName = useDebounce(teamName, 400);

	const {
		data: scrimsData,
		isLoading,
		refetch,
	} = useQuery(
		trpc.scrims.list.queryOptions({
			...filters,
			teamName: debouncedTeamName,
			limit: pageSize,
			offset: (currentPage - 1) * pageSize,
		}),
	);

	const { data: userTeamsData } = useQuery({
		...trpc.teams.userTeamsFlat.queryOptions(),
		enabled: !!currentUserId,
	});

	const scrimsResult: ScrimsListResult | undefined = scrimsData;
	const userTeams: UserTeam[] = userTeamsData ?? [];
	const totalPages = Math.max(1, Math.ceil((scrimsResult?.total ?? 0) / pageSize));
	const visibleScrims = scrimsResult?.items ?? [];

	const paginationItems = useMemo(() => {
		const pages: Array<number | "ellipsis"> = [];
		const maxVisible = 5;

		if (totalPages <= maxVisible) {
			for (let page = 1; page <= totalPages; page += 1) {
				pages.push(page);
			}
			return pages;
		}

		pages.push(1);

		if (currentPage > 3) {
			pages.push("ellipsis");
		}

		const start = Math.max(2, currentPage - 1);
		const end = Math.min(totalPages - 1, currentPage + 1);
		for (let page = start; page <= end; page += 1) {
			pages.push(page);
		}

		if (currentPage < totalPages - 2) {
			pages.push("ellipsis");
		}

		pages.push(totalPages);
		return pages;
	}, [currentPage, totalPages]);

	// Request scrim mutation
	const requestScrimMutation = useMutation(
		trpc.scrims.request.mutationOptions({
			onSuccess: () => {
				toast.success("Scrim request sent successfully!");
				setRequestingScrimId(null);
				setRequestDialogScrimId(null);
				setSelectedRequestTeamId("");
				refetch();
			},
			onError: (error) => {
				toast.error(error.message || "Failed to request scrim");
				setRequestingScrimId(null);
			},
		}),
	);

	const cancelRequestMutation = useMutation(
		trpc.scrims.cancelRequest.mutationOptions({
			onSuccess: () => {
				toast.success("Scrim request cancelled");
				setCancellingRequestScrimId(null);
				refetch();
			},
			onError: (error) => {
				toast.error(error.message || "Failed to cancel scrim request");
				setCancellingRequestScrimId(null);
			},
		}),
	);

	const openRequestDialog = (scrimId: string) => {
		if (userTeams.length === 0) {
			toast.error("You must belong to a team to request scrims");
			return;
		}

		setRequestDialogScrimId(scrimId);
		setSelectedRequestTeamId((prev) => prev || userTeams[0]!.id);
	};

	const handleSubmitRequest = () => {
		if (!requestDialogScrimId) return;
		if (!selectedRequestTeamId) {
			toast.error("Select a team before sending the request");
			return;
		}

		setRequestingScrimId(requestDialogScrimId);
		requestScrimMutation.mutate({
			scrimId: requestDialogScrimId,
			teamId: selectedRequestTeamId,
		});
	};

	const handleCancelRequest = (scrimId: string) => {
		setCancellingRequestScrimId(scrimId);
		cancelRequestMutation.mutate({ scrimId });
	};

	const handleViewDetails = (scrimId: string) => {
		router.push(`/scrims/${scrimId}`);
	};

	const getRankBadgeColor = (tier: string) => {
		const colors: Record<string, string> = {
			IRON: "bg-gray-600",
			BRONZE: "bg-amber-700",
			SILVER: "bg-gray-400",
			GOLD: "bg-yellow-500",
			PLATINUM: "bg-teal-500",
			EMERALD: "bg-emerald-500",
			DIAMOND: "bg-blue-500",
			MASTER: "bg-purple-500",
			GRANDMASTER: "bg-red-500",
			CHALLENGER: "bg-gradient-to-r from-yellow-400 to-red-500",
		};
		return colors[tier] || "bg-gray-500";
	};

	useEffect(() => {
		setCurrentPage(1);
	}, [
		debouncedTeamName,
		filters.minRankTier,
		filters.maxRankTier,
		filters.regions,
		filters.status,
	]);

	return (
		<div className="container mx-auto py-8 px-6">
			{/* Header with Post Scrim Button */}
			<div className="flex justify-between items-center mb-6">
				<div>
					<h1 className="text-3xl font-bold text-white mb-2">Find Scrims</h1>
					<p className="text-gray-400">
						Browse and request scrimmage matches with other teams
					</p>
				</div>
				{isLoggedIn ? (
					<Link href="/scrims/new">
						<Button className="bg-cyan-600 hover:bg-cyan-700">
							<PlusIcon className="h-4 w-4 mr-2" />
							Post Scrim
						</Button>
					</Link>
				) : (
					<Button disabled className="bg-cyan-600 text-white disabled:opacity-60">
						<PlusIcon className="h-4 w-4 mr-2" />
						Sign In to Post
					</Button>
				)}
			</div>

			{/* Filters */}
			<Card className="mb-6 bg-gray-900/50 border-cyan-500/20">
				<CardHeader>
					<CardTitle className="text-cyan-400">Filter Scrims</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
						<div>
							<Field>
								<FieldLabel htmlFor="team-name">Team Name</FieldLabel>
								<Input
									id="team-name"
									type="text"
									placeholder="Team Name"
									value={teamName}
									onChange={(e) => setTeamName(e.target.value)}
								/>
							</Field>
						</div>
						<div>
							<label className="block text-sm font-medium text-gray-300 mb-2">
								Min Rank
							</label>
							<Select
								value={filters.minRankTier || ""}
								onValueChange={(value) =>
									setFilters((prev) => {
										if (
											filters.maxRankTier &&
											getRankTierValue(value) >
												getRankTierValue(filters.maxRankTier)
										) {
											return {
												...prev,
												minRankTier: value as RankTier,
												maxRankTier: undefined,
											};
										}

										return {
											...prev,
											minRankTier: value as RankTier,
										};
									})
								}
							>
								<SelectTrigger className="bg-gray-800 border-gray-600 min-h-10">
									<SelectValue placeholder="Any rank" />
								</SelectTrigger>
								<SelectContent>
									{RANK_TIERS.map((tier) => (
										<SelectItem key={tier} value={tier}>
											{tier}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-300 mb-2">
								Max Rank
							</label>
							<Select
								value={filters.maxRankTier || ""}
								onValueChange={(value) =>
									setFilters((prev) => {
										if (
											filters.minRankTier &&
											getRankTierValue(value) <
												getRankTierValue(filters.minRankTier)
										) {
											return {
												...prev,
												minRankTier: undefined,
												maxRankTier: value as RankTier,
											};
										}

										return {
											...prev,
											maxRankTier: value as RankTier,
										};
									})
								}
							>
								<SelectTrigger className="bg-gray-800 border-gray-600 min-h-10">
									<SelectValue placeholder="Any rank" />
								</SelectTrigger>
								<SelectContent>
									{RANK_TIERS.map((tier) => (
										<SelectItem key={tier} value={tier}>
											{tier}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-300 mb-2">
								Region
							</label>
							<Select
								value={filters.regions?.[0] || ""}
								onValueChange={(value) =>
									setFilters((prev) => ({
										...prev,
										regions: [value as Region],
									}))
								}
							>
								<SelectTrigger className="bg-gray-800 border-gray-600 min-h-10">
									<SelectValue placeholder="Any region" />
								</SelectTrigger>
								<SelectContent>
									{REGIONS.map((region) => (
										<SelectItem key={region.value} value={region.value}>
											{region.label}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						<div className="flex items-end">
							<Button
								onClick={() => {
									setFilters(defaultFilters);
									setTeamName("");
								}}
								className="w-full bg-cyan-600 hover:bg-cyan-700"
							>
								Reset Filters
							</Button>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Scrims List */}
			{isLoading ? (
				<div className="text-center py-8">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto"></div>
					<p className="text-gray-300 mt-4">Loading scrims...</p>
				</div>
			) : visibleScrims.length > 0 ? (
				<>
					<div className="grid gap-4">
						{visibleScrims.map((scrim: ScrimListItem) => {
							const isUsersScrim =
								!!currentUserId &&
								scrim.creatingTeam?.members?.some(
									(member: ScrimMember) => member.userId === currentUserId,
								);
							const isRequestingTeamMember =
								!!currentUserId &&
								!!scrim.opponentTeam?.members?.some(
									(member: ScrimMember) => member.userId === currentUserId,
								);
							const canCancelRequest =
								scrim.status === "REQUESTED" && isRequestingTeamMember;
							const isRequestDisabled =
								!isLoggedIn ||
								scrim.status !== "OPEN" ||
								requestingScrimId === scrim.id;

							return (
								<Card
									key={scrim.id}
									className={`bg-gray-900/50 hover:border-cyan-500/40 transition-colors`}
								>
									<CardContent>
										<div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
											<div className="flex-1">
												<div className="flex items-center gap-3 mb-3">
													<h3 className="text-xl font-semibold text-cyan-400">
														{scrim.creatingTeam?.name || "Unknown Team"}
													</h3>
													<Badge
														variant="outline"
														className="text-cyan-300 border-cyan-500"
													>
														{scrim.creatingTeam?.tag || "???"}
													</Badge>
													<Badge
														className={`text-white ${scrim.status === "OPEN" ? "bg-green-600" : scrim.status === "REQUESTED" ? "bg-yellow-600" : "bg-gray-600"}`}
													>
														{scrim.status}
													</Badge>
													{isUsersScrim && (
														<Badge className="bg-emerald-600 text-white">
															Your Scrim
														</Badge>
													)}
												</div>

												<div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-gray-300">
													<div className="flex items-center gap-2">
														<CalendarIcon className="h-4 w-4 text-cyan-400" />
														<LocalizedDateTime
															date={scrim.startTime}
															options={{
																dateStyle: "medium",
																timeStyle: "short",
															}}
														/>
													</div>
													<div className="flex items-center gap-2">
														<ClockIcon className="h-4 w-4 text-cyan-400" />
														<span>{scrim.durationMinutes} min</span>
													</div>
													<div className="flex items-center gap-2">
														<UsersIcon className="h-4 w-4 text-cyan-400" />
														<span>Best of {scrim.bestOf}</span>
													</div>
													{scrim.minRankTier && (
														<div className="flex items-center gap-2">
															<Badge
																className={`text-xs ${getRankBadgeColor(scrim.minRankTier)}`}
															>
																{scrim.minRankTier}+
															</Badge>
														</div>
													)}
												</div>

												{scrim.notes && (
													<p className="mt-3 text-gray-400 text-sm">
														{scrim.notes}
													</p>
												)}

												{scrim.rolesNeeded &&
													scrim.rolesNeeded.length > 0 && (
														<div className="mt-3 flex flex-wrap gap-2">
															<span className="text-sm text-gray-400">
																Roles needed:
															</span>
															{(scrim.rolesNeeded as string[]).map(
																(role) => (
																	<Badge
																		key={role}
																		variant="secondary"
																		className="text-xs"
																	>
																		{role}
																	</Badge>
																),
															)}
														</div>
													)}
												{scrim.creatingTeam.region && (
													<p className="mt-3 text-gray-400 text-sm">
														Region:{" "}
														{scrim.creatingTeam.region.toUpperCase()} -{" "}
														{regionToName[scrim.creatingTeam.region]}
													</p>
												)}
											</div>

											<div className="flex flex-col gap-2 lg:w-48">
												{!isUsersScrim && (
													<>
														<Button
															className="bg-cyan-600 hover:bg-cyan-700"
															disabled={isRequestDisabled}
															onClick={() =>
																openRequestDialog(scrim.id)
															}
														>
															{requestingScrimId === scrim.id
																? "Requesting..."
																: !isLoggedIn
																	? "Sign In to Request"
																	: "Request Scrim"}
														</Button>
														{canCancelRequest && (
															<Button
																variant="outline"
																className="border-yellow-500 text-yellow-300 hover:bg-yellow-500/10"
																onClick={() =>
																	handleCancelRequest(scrim.id)
																}
																disabled={
																	cancellingRequestScrimId ===
																	scrim.id
																}
															>
																{cancellingRequestScrimId ===
																scrim.id
																	? "Cancelling..."
																	: "Cancel Request"}
															</Button>
														)}
													</>
												)}
												<Button
													variant="outline"
													className="border-cyan-500 text-cyan-400 hover:bg-cyan-500/10"
													onClick={() => handleViewDetails(scrim.id)}
												>
													{isUsersScrim ? "Manage Scrim" : "View Details"}
												</Button>
											</div>
										</div>
									</CardContent>
								</Card>
							);
						})}
					</div>
					{!isLoggedIn && (
						<p className="mt-4 text-sm text-gray-400">
							Sign in to request an open scrim.
						</p>
					)}
					{totalPages > 1 && (
						<div className="mt-8 flex justify-center">
							<Pagination className="justify-center">
								<PaginationContent>
									<PaginationItem>
										<PaginationPrevious
											onClick={() =>
												setCurrentPage((prev) => Math.max(1, prev - 1))
											}
											disabled={currentPage === 1}
											className="cursor-pointer text-cyan-300 hover:bg-cyan-500/10 disabled:pointer-events-none disabled:opacity-50"
										/>
									</PaginationItem>
									{paginationItems.map((item, index) => (
										<PaginationItem key={`${item}-${index}`}>
											{item === "ellipsis" ? (
												<PaginationEllipsis className="text-cyan-300" />
											) : (
												<PaginationLink
													onClick={() => setCurrentPage(item)}
													isActive={item === currentPage}
													className="cursor-pointer text-cyan-300 hover:bg-cyan-500/10 data-[active=true]:bg-cyan-600 data-[active=true]:text-white"
												>
													{item}
												</PaginationLink>
											)}
										</PaginationItem>
									))}
									<PaginationItem>
										<PaginationNext
											onClick={() =>
												setCurrentPage((prev) =>
													Math.min(totalPages, prev + 1),
												)
											}
											disabled={currentPage === totalPages}
											className="cursor-pointer text-cyan-300 hover:bg-cyan-500/10 disabled:pointer-events-none disabled:opacity-50"
										/>
									</PaginationItem>
								</PaginationContent>
							</Pagination>
						</div>
					)}
				</>
			) : (
				<Card className="bg-gray-900/50 border-cyan-500/20">
					<CardContent className="text-center py-12">
						<UsersIcon className="h-12 w-12 text-gray-500 mx-auto mb-4" />
						<h3 className="text-lg font-medium text-gray-300 mb-2">No scrims found</h3>
						<p className="text-gray-500 mb-4">
							Try adjusting your filters or check back later for new scrim requests.
						</p>
						{isLoggedIn ? (
							<Link href="/scrims/new">
								<Button className="bg-cyan-600 hover:bg-cyan-700">
									<PlusIcon className="h-4 w-4 mr-2" />
									Post Your Own Scrim
								</Button>
							</Link>
						) : (
							<Button disabled className="bg-cyan-600 text-white disabled:opacity-60">
								<PlusIcon className="h-4 w-4 mr-2" />
								Sign In to Post
							</Button>
						)}
					</CardContent>
				</Card>
			)}

			<Dialog
				open={!!requestDialogScrimId}
				onOpenChange={(open) => {
					if (!open) {
						setRequestDialogScrimId(null);
						setSelectedRequestTeamId("");
					}
				}}
			>
				<DialogContent className="bg-gray-900 border-gray-700">
					<DialogHeader>
						<DialogTitle className="text-white">Request Scrim</DialogTitle>
						<DialogDescription className="text-gray-400">
							Select which of your teams should send this scrim request.
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-2">
						<label className="text-sm font-medium text-white">Your Team</label>
						<Select
							value={selectedRequestTeamId}
							onValueChange={(value) => setSelectedRequestTeamId(value)}
						>
							<SelectTrigger className="bg-gray-800 border-gray-600">
								<SelectValue placeholder="Select team" />
							</SelectTrigger>
							<SelectContent>
								{userTeams.map((team) => (
									<SelectItem key={team.id} value={team.id}>
										{team.name} [{team.tag}]
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
					<DialogFooter>
						<Button
							variant="outline"
							className="border-gray-600 text-white hover:bg-gray-800"
							onClick={() => {
								setRequestDialogScrimId(null);
								setSelectedRequestTeamId("");
							}}
						>
							Cancel
						</Button>
						<Button
							className="bg-cyan-600 hover:bg-cyan-700"
							disabled={requestScrimMutation.isPending || !selectedRequestTeamId}
							onClick={handleSubmitRequest}
						>
							{requestScrimMutation.isPending ? "Requesting..." : "Send Request"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
