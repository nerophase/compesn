"use client";

import { useState } from "react";
import { useTRPC } from "@/trpc/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { SearchIcon, UsersIcon, EyeIcon, XIcon, ShieldIcon } from "lucide-react";
import { REGIONS } from "@/constants/regions";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import { CreateTeamDialog } from "@/components/create-team-dialog";
import {
	ActivityLevel,
	MemberCountFilter,
	RankTier,
	RegionCode,
	ACTIVITY_LEVELS,
	RANK_TIERS,
	SORT_OPTIONS,
	SortBy,
	TeamCard,
	TeamsDirectoryResult,
} from "./types";

export default function TeamsPage() {
	const { data: session } = useSession();
	const isUserLoggedIn = !!session?.user.id;
	const trpc = useTRPC();
	const [searchTerm, setSearchTerm] = useState("");
	const [filters, setFilters] = useState({
		ranks: [] as RankTier[],
		regions: [] as RegionCode[],
		activityLevels: [] as ActivityLevel[],
		memberCount: "" as MemberCountFilter,
	});
	const [sortBy, setSortBy] = useState<SortBy>("activity");
	const [currentPage, setCurrentPage] = useState(1);
	const [pageSize, setPageSize] = useState(12);
	const [showCreateDialog, setShowCreateDialog] = useState(false);
	const listQueryInput = {
		name: searchTerm || undefined,
		ranks: filters.ranks.length ? filters.ranks : undefined,
		regions: filters.regions.length ? filters.regions : undefined,
		activityLevels: filters.activityLevels.length ? filters.activityLevels : undefined,
		memberCount: (filters.memberCount || undefined) as
			| "full"
			| "recruiting"
			| "new"
			| undefined,
		sortBy,
		page: currentPage,
		limit: pageSize,
	};

	const { data, isLoading, refetch } = useQuery({
		...trpc.teams.list.queryOptions(listQueryInput),
	});
	const teamsData = data as unknown as TeamsDirectoryResult | undefined;

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

	const getActivityIndicator = (level: string) => {
		const indicators = {
			CASUAL: { color: "bg-green-500", text: "Casual" },
			REGULAR: { color: "bg-blue-500", text: "Regular" },
			COMPETITIVE: { color: "bg-purple-500", text: "Competitive" },
			HARDCORE: { color: "bg-red-500", text: "Hardcore" },
		} as const;
		return indicators[(level as ActivityLevel) || "REGULAR"] || indicators.REGULAR;
	};

	const handleRankFilter = (rank: RankTier, checked: boolean) => {
		setFilters((prev) => ({
			...prev,
			ranks: checked ? [...prev.ranks, rank] : prev.ranks.filter((r) => r !== rank),
		}));
	};

	const handleRegionFilter = (region: RegionCode, checked: boolean) => {
		setFilters((prev) => ({
			...prev,
			regions: checked ? [...prev.regions, region] : prev.regions.filter((r) => r !== region),
		}));
	};

	const handleActivityFilter = (activity: ActivityLevel, checked: boolean) => {
		setFilters((prev) => ({
			...prev,
			activityLevels: checked
				? [...prev.activityLevels, activity]
				: prev.activityLevels.filter((a) => a !== activity),
		}));
	};

	const totalPages = teamsData ? Math.ceil(teamsData.total / pageSize) : 0;

	// Show team directory
	return (
		<div className="container mx-auto py-8 px-6">
			{/* Header with Create Team button */}
			<div className="flex items-center justify-between mb-6">
				<div>
					<h1 className="text-3xl font-bold text-cyan-400 mb-2">Teams Directory</h1>
					<p className="text-gray-400">
						Find a team or create your own to start competing
					</p>
				</div>
				{isUserLoggedIn && (
					<CreateTeamDialog open={showCreateDialog} onOpenChange={setShowCreateDialog} />
				)}
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
				{/* Filters Sidebar */}
				<div className="lg:col-span-1">
					<Card className="bg-gray-900/50 border-cyan-500/20 sticky top-6">
						<CardHeader>
							<CardTitle className="text-cyan-400">Filters</CardTitle>
						</CardHeader>
						<CardContent className="space-y-6">
							{/* Search */}
							<div>
								<label className="block text-sm font-medium text-gray-300 mb-2">
									Team Name
								</label>
								<div className="relative">
									<SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
									<Input
										placeholder="Search teams..."
										value={searchTerm}
										onChange={(e) => setSearchTerm(e.target.value)}
										className="pl-10 bg-gray-800 border-gray-600"
									/>
								</div>
							</div>

							{/* Rank Filter */}
							<div>
								<label className="block text-sm font-medium text-gray-300 mb-3">
									Rank Tiers
								</label>
								<div className="custom-scrollbar space-y-2 max-h-48 overflow-y-auto pr-2">
									{RANK_TIERS.map((rank) => (
										<div key={rank} className="flex items-center space-x-2">
											<Checkbox
												id={`rank-${rank}`}
												checked={filters.ranks.includes(rank)}
												onCheckedChange={(checked) =>
													handleRankFilter(rank, checked as boolean)
												}
											/>
											<label
												htmlFor={`rank-${rank}`}
												className="text-sm text-gray-300"
											>
												{rank}
											</label>
										</div>
									))}
								</div>
							</div>

							{/* Region Filter */}
							<div>
								<label className="block text-sm font-medium text-gray-300 mb-3">
									Regions
								</label>
								<div className="custom-scrollbar space-y-2 max-h-48 overflow-y-auto pr-2">
									{REGIONS.map((region) => (
										<div
											key={region.value}
											className="flex items-center space-x-2"
										>
											<Checkbox
												id={`region-${region.value}`}
												checked={filters.regions.includes(region.value)}
												onCheckedChange={(checked) =>
													handleRegionFilter(
														region.value,
														checked as boolean,
													)
												}
											/>
											<label
												htmlFor={`region-${region.value}`}
												className="text-sm text-gray-300"
											>
												{region.label}
											</label>
										</div>
									))}
								</div>
							</div>

							{/* Activity Level Filter */}
							<div>
								<label className="block text-sm font-medium text-gray-300 mb-3">
									Activity Level
								</label>
								<div className="space-y-2">
									{ACTIVITY_LEVELS.map((activity) => (
										<div key={activity} className="flex items-center space-x-2">
											<Checkbox
												id={`activity-${activity}`}
												checked={filters.activityLevels.includes(activity)}
												onCheckedChange={(checked) =>
													handleActivityFilter(
														activity,
														checked as boolean,
													)
												}
											/>
											<label
												htmlFor={`activity-${activity}`}
												className="text-sm text-gray-300"
											>
												{activity}
											</label>
										</div>
									))}
								</div>
							</div>

							{/* Member Count */}
							<div>
								<label className="block text-sm font-medium text-gray-300 mb-2">
									Team Size
								</label>
								<div className="flex items-center gap-1">
									<Select
										value={filters.memberCount}
										onValueChange={(value) =>
											setFilters((prev) => ({
												...prev,
												memberCount: value as MemberCountFilter,
											}))
										}
									>
										<SelectTrigger className="bg-gray-800 border-gray-600">
											<SelectValue placeholder="Any size" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="full">Full team (5/5)</SelectItem>
											<SelectItem value="recruiting">
												Recruiting (1-4/5)
											</SelectItem>
											<SelectItem value="new">New team (1/5)</SelectItem>
										</SelectContent>
									</Select>
									{filters.memberCount !== "" && (
										<XIcon
											color="gray"
											size={16}
											className="hover:cursor-pointer"
											onClick={() => {
												setFilters((prev) => ({
													...prev,
													memberCount: "",
												}));
											}}
										/>
									)}
								</div>
							</div>

							<Button
								onClick={() => refetch()}
								className="w-full bg-cyan-600 hover:bg-cyan-700"
							>
								Apply Filters
							</Button>
						</CardContent>
					</Card>
				</div>

				{/* Main Content */}
				<div className="lg:col-span-3">
					{/* Sort and View Options */}
					<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
						<div className="flex items-center gap-4">
							<Select
								value={sortBy}
								onValueChange={(value) => setSortBy(value as SortBy)}
							>
								<SelectTrigger className="w-48 bg-gray-800 border-gray-600">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									{SORT_OPTIONS.map((option) => (
										<SelectItem key={option.value} value={option.value}>
											{option.label}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
							<Select
								value={pageSize.toString()}
								onValueChange={(value) => setPageSize(Number(value))}
							>
								<SelectTrigger className="w-32 bg-gray-800 border-gray-600">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="12">12 per page</SelectItem>
									<SelectItem value="24">24 per page</SelectItem>
									<SelectItem value="48">48 per page</SelectItem>
								</SelectContent>
							</Select>
						</div>

						{teamsData && (
							<p className="text-sm text-gray-400">
								Showing {(currentPage - 1) * pageSize + 1}-
								{Math.min(currentPage * pageSize, teamsData.total)} of{" "}
								{teamsData.total} teams
							</p>
						)}
					</div>

					{/* Teams Grid */}
					{isLoading ? (
						<div className="text-center py-12">
							<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto"></div>
							<p className="text-gray-300 mt-4">Loading teams...</p>
						</div>
					) : teamsData && teamsData.teams.length > 0 ? (
						<>
							<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
								{teamsData.teams.map((team: TeamCard) => {
									return (
										<Card
											key={team.id}
											className={cn(
												"bg-gray-900/50 border-cyan-500/20 hover:border-cyan-500/40 transition-all duration-200 hover:shadow-lg hover:shadow-cyan-500/10 relative",
												// team.isMember &&
												// 	"border-cyan-500/60 border-2 shadow-cyan-500/20"
											)}
										>
											{(team.isMember || team.isInvited) && (
												<div className="absolute top-2 right-2">
													{team.isMember ? (
														<Badge className="bg-cyan-600 text-white text-xs flex items-center gap-1">
															Member
														</Badge>
													) : (
														<Badge
															variant="outline"
															className="border-yellow-500/50 bg-yellow-500/10 text-yellow-400 text-xs"
														>
															Invited
														</Badge>
													)}
												</div>
											)}
											<CardContent>
												<div className="flex items-start gap-4 mb-4 py-1">
													<div className="w-12 h-12 bg-gray-700 rounded-lg flex items-center justify-center">
														{/* {team.logoUrl ? (
														<Image
															src={team.logoUrl}
															alt={team.name.charAt(
																0
															)}
															width={40}
															height={40}
															className="rounded-lg"
														/>
													) : (
														<UsersIcon className="h-6 w-6 text-gray-400" />
													)} */}
														<ShieldIcon className="h-8 w-8 text-cyan-400" />
													</div>
													<div className="flex-1 min-w-0">
														<h3 className="font-semibold text-cyan-400 truncate">
															{team.name}
														</h3>
														<p className="text-sm text-gray-400">
															{team.tag}
														</p>
													</div>
													{/* <div className="flex items-center gap-1">
														<div
															className={`w-2 h-2 rounded-full ${
																getActivityIndicator(
																	team.activityLevel
																).color
															}`}
														></div>
													</div> */}
												</div>

												<div className="space-y-3">
													<div className="flex items-center justify-between">
														<span className="text-sm text-gray-400">
															Rank
														</span>
														<Badge
															className={`text-xs ${getRankBadgeColor(
																team.currentRank ?? "UNRANKED",
															)}`}
														>
															{team.currentRank ?? "UNRANKED"}
														</Badge>
													</div>

													<div className="flex items-center justify-between">
														<span className="text-sm text-gray-400">
															Region
														</span>
														<span className="text-sm text-gray-300">
															{team.region}
														</span>
													</div>

													<div className="flex items-center justify-between">
														<span className="text-sm text-gray-400">
															Members
														</span>
														<div className="flex items-center gap-1">
															<UsersIcon className="h-3 w-3 text-gray-400" />
															<span className="text-sm text-gray-300">
																{team.memberCount}
															</span>
														</div>
													</div>

													<div className="flex items-center justify-between">
														<span className="text-sm text-gray-400">
															Status
														</span>
														<Badge
															variant="outline"
															className={`text-xs ${
																team.activityLevel === "HARDCORE"
																	? "border-red-500 text-red-400"
																	: team.activityLevel ===
																		  "COMPETITIVE"
																		? "border-purple-500 text-purple-400"
																		: team.activityLevel ===
																			  "REGULAR"
																			? "border-blue-500 text-blue-400"
																			: "border-green-500 text-green-400"
															}`}
														>
															{
																getActivityIndicator(
																	team.activityLevel,
																).text
															}
														</Badge>
													</div>
												</div>

												<div className="flex gap-2 mt-6">
													<Link
														href={`/teams/${team.id}`}
														className="flex-1"
													>
														<Button
															className="w-full bg-cyan-600 hover:bg-cyan-700"
															size="sm"
														>
															<EyeIcon className="h-4 w-4 mr-2" />
															View Profile
														</Button>
													</Link>
												</div>
											</CardContent>
										</Card>
									);
								})}
							</div>

							{/* Pagination */}
							{totalPages > 1 && (
								<div className="flex items-center justify-center gap-2 mt-8">
									<Button
										variant="outline"
										size="sm"
										onClick={() =>
											setCurrentPage((prev) => Math.max(1, prev - 1))
										}
										disabled={currentPage === 1}
										className="border-cyan-500 text-cyan-400 hover:bg-cyan-500/10"
									>
										Previous
									</Button>

									<div className="flex items-center gap-1">
										{Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
											const pageNum =
												currentPage <= 3 ? i + 1 : currentPage - 2 + i;
											if (pageNum > totalPages) return null;

											return (
												<Button
													key={pageNum}
													variant={
														pageNum === currentPage
															? "default"
															: "outline"
													}
													size="sm"
													onClick={() => setCurrentPage(pageNum)}
													className={
														pageNum === currentPage
															? "bg-cyan-600 hover:bg-cyan-700"
															: "border-cyan-500 text-cyan-400 hover:bg-cyan-500/10"
													}
												>
													{pageNum}
												</Button>
											);
										})}
									</div>

									<Button
										variant="outline"
										size="sm"
										onClick={() =>
											setCurrentPage((prev) => Math.min(totalPages, prev + 1))
										}
										disabled={currentPage === totalPages}
										className="border-cyan-500 text-cyan-400 hover:bg-cyan-500/10"
									>
										Next
									</Button>
								</div>
							)}
						</>
					) : (
						<Card className="bg-gray-900/50 border-cyan-500/20">
							<CardContent className="text-center py-12">
								<UsersIcon className="h-12 w-12 text-gray-500 mx-auto mb-4" />
								<h3 className="text-lg font-medium text-gray-300 mb-2">
									No teams found
								</h3>
								<p className="text-gray-500 mb-4">
									Try adjusting your filters or search terms to find teams.
								</p>
								{isUserLoggedIn && (
									<Button
										variant="outline"
										className="border-cyan-500 text-cyan-400 hover:bg-cyan-500/10"
										onClick={() => setShowCreateDialog(true)}
									>
										Create Team
									</Button>
								)}
							</CardContent>
						</Card>
					)}
				</div>
			</div>
		</div>
	);
}
