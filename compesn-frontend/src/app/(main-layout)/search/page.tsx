"use client";

import { Suspense } from "react";
import { SearchResults } from "./search-results";
import { GlobalSearchBar } from "@/components/global-search-bar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SearchPage() {
	return (
		<div className="container mx-auto px-4 py-8 max-w-4xl">
			<div className="space-y-6">
				{/* Search Header */}
				<div className="text-center space-y-4">
					<h1 className="text-3xl font-bold tracking-tight">Search</h1>
					<p className="text-muted-foreground">
						Find players, teams, and scrims across the platform
					</p>
				</div>

				{/* Search Bar */}
				<Card>
					<CardContent className="pt-6">
						<GlobalSearchBar
							className="max-w-2xl mx-auto"
							autoFocus
							placeholder="Search for players, teams, or scrims..."
						/>
					</CardContent>
				</Card>

				{/* Search Results */}
				<Suspense fallback={<SearchResultsSkeleton />}>
					<SearchResults />
				</Suspense>
			</div>
		</div>
	);
}

function SearchResultsSkeleton() {
	return (
		<div className="space-y-6">
			<div className="animate-pulse">
				<div className="h-4 bg-muted rounded w-48 mb-4"></div>
				<div className="space-y-3">
					{Array.from({ length: 5 }).map((_, i) => (
						<div key={i} className="border rounded-lg p-4">
							<div className="flex items-center space-x-3">
								<div className="h-10 w-10 bg-muted rounded-full"></div>
								<div className="space-y-2 flex-1">
									<div className="h-4 bg-muted rounded w-3/4"></div>
									<div className="h-3 bg-muted rounded w-1/2"></div>
								</div>
							</div>
						</div>
					))}
				</div>
			</div>
		</div>
	);
}
