"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
	User,
	Users,
	Gamepad2,
	Clock,
	MapPin,
	Calendar,
	Search,
	Loader2,
	AlertCircle,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { SearchResult } from "@/trpc/routers/search/search.schema";
import { useTRPC } from "@/trpc/client";
import { useQuery } from "@tanstack/react-query";

type SearchTab = "all" | "player" | "team" | "scrim";

export function SearchResults() {
	const trpc = useTRPC();
	const searchParams = useSearchParams();
	const query = searchParams.get("q");
	const [selectedType, setSelectedType] = useState<SearchTab>("all");

	const { data, isLoading, error } = useQuery(
		trpc.search.query.queryOptions(
			{
				term: query || "",
				type: selectedType === "all" ? undefined : selectedType,
				limit: 20,
				offset: 0,
			},
			{
				enabled: !!query && query.length >= 3,
			},
		),
	);

	if (!query || query.length < 3) {
		return (
			<Card>
				<CardContent className="flex flex-col items-center justify-center py-12 text-center">
					<Search className="h-12 w-12 text-muted-foreground mb-4" />
					<h3 className="text-lg font-semibold mb-2">Start searching</h3>
					<p className="text-muted-foreground">
						Enter at least 3 characters to search for players, teams, and scrims
					</p>
				</CardContent>
			</Card>
		);
	}

	if (isLoading) {
		return (
			<Card>
				<CardContent className="flex flex-col items-center justify-center py-12">
					<Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
					<p className="text-muted-foreground">Searching...</p>
				</CardContent>
			</Card>
		);
	}

	if (error) {
		return (
			<Card>
				<CardContent className="flex flex-col items-center justify-center py-12 text-center">
					<AlertCircle className="h-12 w-12 text-destructive mb-4" />
					<h3 className="text-lg font-semibold mb-2">Search Error</h3>
					<p className="text-muted-foreground mb-4">
						Something went wrong while searching. Please try again.
					</p>
					<Button variant="outline" onClick={() => window.location.reload()}>
						Retry
					</Button>
				</CardContent>
			</Card>
		);
	}

	const allResults = data?.results || [];
	const totalResults = data?.total || 0;

	// Group results by type for tabs
	const playerResults = allResults.filter((r: SearchResult) => r.type === "player");
	const teamResults = allResults.filter((r: SearchResult) => r.type === "team");
	const scrimResults = allResults.filter((r: SearchResult) => r.type === "scrim");

	if (allResults.length === 0) {
		return (
			<Card>
				<CardContent className="flex flex-col items-center justify-center py-12 text-center">
					<Search className="h-12 w-12 text-muted-foreground mb-4" />
					<h3 className="text-lg font-semibold mb-2">No results found</h3>
					<p className="text-muted-foreground">
						No players, teams, or scrims match your search for &quot;{query}&quot;
					</p>
				</CardContent>
			</Card>
		);
	}

	return (
		<div className="space-y-6">
			{/* Results Summary */}
			<div className="flex items-center justify-between">
				<p className="text-sm text-muted-foreground">
					Found {totalResults} result{totalResults !== 1 ? "s" : ""} for &quot;{query}
					&quot;
				</p>
			</div>

			{/* Results Tabs */}
			<Tabs value={selectedType} onValueChange={(value) => setSelectedType(value as SearchTab)}>
				<TabsList className="grid w-full grid-cols-4">
					<TabsTrigger value="all" className="flex items-center gap-2">
						<Search className="h-4 w-4" />
						All ({allResults.length})
					</TabsTrigger>
					<TabsTrigger value="player" className="flex items-center gap-2">
						<User className="h-4 w-4" />
						Players ({playerResults.length})
					</TabsTrigger>
					<TabsTrigger value="team" className="flex items-center gap-2">
						<Users className="h-4 w-4" />
						Teams ({teamResults.length})
					</TabsTrigger>
					<TabsTrigger value="scrim" className="flex items-center gap-2">
						<Gamepad2 className="h-4 w-4" />
						Scrims ({scrimResults.length})
					</TabsTrigger>
				</TabsList>

				<TabsContent value="all" className="space-y-4">
					<SearchResultsList results={allResults} />
				</TabsContent>

				<TabsContent value="player" className="space-y-4">
					<SearchResultsList results={playerResults} />
				</TabsContent>

				<TabsContent value="team" className="space-y-4">
					<SearchResultsList results={teamResults} />
				</TabsContent>

				<TabsContent value="scrim" className="space-y-4">
					<SearchResultsList results={scrimResults} />
				</TabsContent>
			</Tabs>
		</div>
	);
}

function SearchResultsList({ results }: { results: SearchResult[] }) {
	if (results.length === 0) {
		return (
			<Card>
				<CardContent className="flex flex-col items-center justify-center py-8 text-center">
					<p className="text-muted-foreground">No results in this category</p>
				</CardContent>
			</Card>
		);
	}

	return (
		<div className="space-y-3">
			{results.map((result) => (
				<SearchResultCard key={`${result.type}-${result.id}`} result={result} />
			))}
		</div>
	);
}

function SearchResultCard({ result }: { result: SearchResult }) {
	if (result.type === "player") {
		return (
			<Card className="hover:shadow-md transition-shadow">
				<CardContent className="p-4">
					<Link href={`/profile/${result.id}/stats`} className="block">
						<div className="flex items-center space-x-4">
							<Avatar className="h-12 w-12">
								<AvatarImage src={result.image || undefined} />
								<AvatarFallback>
									<User className="h-6 w-6" />
								</AvatarFallback>
							</Avatar>
							<div className="flex-1 min-w-0">
								<div className="flex items-center gap-2 mb-1">
									<Badge variant="secondary" className="text-xs">
										<User className="h-3 w-3 mr-1" />
										Player
									</Badge>
								</div>
								<h3 className="font-semibold text-lg truncate">
									{result.riotGameName ? (
										<>
											{result.riotGameName}
											{result.riotTagLine && (
												<span className="text-muted-foreground">
													#{result.riotTagLine}
												</span>
											)}
										</>
									) : (
										result.name
									)}
								</h3>
								{result.region && (
									<div className="flex items-center text-sm text-muted-foreground mt-1">
										<MapPin className="h-3 w-3 mr-1" />
										{result.region.toUpperCase()}
									</div>
								)}
							</div>
						</div>
					</Link>
				</CardContent>
			</Card>
		);
	}

	if (result.type === "team") {
		return (
			<Card className="hover:shadow-md transition-shadow">
				<CardContent className="p-4">
					<Link href={`/teams/${result.id}`} className="block">
						<div className="flex items-center space-x-4">
							<div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center">
								<Users className="h-6 w-6 text-primary" />
							</div>
							<div className="flex-1 min-w-0">
								<div className="flex items-center gap-2 mb-1">
									<Badge variant="secondary" className="text-xs">
										<Users className="h-3 w-3 mr-1" />
										Team
									</Badge>
								</div>
								<h3 className="font-semibold text-lg truncate">
									{result.name} [{result.tag}]
								</h3>
								<div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
									<div className="flex items-center">
										<MapPin className="h-3 w-3 mr-1" />
										{result.region.toUpperCase()}
									</div>
									<div className="flex items-center">
										<Calendar className="h-3 w-3 mr-1" />
										Created{" "}
										{formatDistanceToNow(result.createdAt, { addSuffix: true })}
									</div>
								</div>
							</div>
						</div>
					</Link>
				</CardContent>
			</Card>
		);
	}

	if (result.type === "scrim") {
		const statusColors = {
			OPEN: "bg-green-100 text-green-800",
			REQUESTED: "bg-yellow-100 text-yellow-800",
			ACCEPTED: "bg-blue-100 text-blue-800",
			CONFIRMED: "bg-purple-100 text-purple-800",
			CANCELLED: "bg-red-100 text-red-800",
			COMPLETED: "bg-gray-100 text-gray-800",
		};

		return (
			<Card className="hover:shadow-md transition-shadow">
				<CardContent className="p-4">
					<Link href={`/scrims/${result.id}`} className="block">
						<div className="flex items-center space-x-4">
							<div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center">
								<Gamepad2 className="h-6 w-6 text-primary" />
							</div>
							<div className="flex-1 min-w-0">
								<div className="flex items-center gap-2 mb-1">
									<Badge variant="secondary" className="text-xs">
										<Gamepad2 className="h-3 w-3 mr-1" />
										Scrim
									</Badge>
									<Badge
										className={`text-xs ${statusColors[result.status]}`}
										variant="outline"
									>
										{result.status}
									</Badge>
								</div>
								<h3 className="font-semibold text-lg truncate">
									{result.title || "Untitled Scrim"}
								</h3>
								<div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
									<div className="flex items-center">
										<Clock className="h-3 w-3 mr-1" />
										{formatDistanceToNow(result.startTime, { addSuffix: true })}
									</div>
								</div>
								{result.notes && (
									<p className="text-sm text-muted-foreground mt-2 line-clamp-2">
										{result.notes}
									</p>
								)}
							</div>
						</div>
					</Link>
				</CardContent>
			</Card>
		);
	}

	return null;
}
