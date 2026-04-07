"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, ExternalLink, CheckCircle } from "lucide-react";
import { REGIONS } from "@/constants/regions";
import { toast } from "sonner";
import { useTRPC } from "@/trpc/client";
import { useMutation, useQuery } from "@tanstack/react-query";

export default function AccountLinkPage() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const [selectedRegion, setSelectedRegion] = useState<string>("");
	const [isProcessingCallback, setIsProcessingCallback] = useState(false);
	const trpc = useTRPC();

	// Get current user data
	const { data: user, refetch: refetchUser } = useQuery(
		trpc.auth.authenticatedUser.queryOptions(),
	);

	// tRPC mutations
	const startRiotAuth = useMutation(
		trpc.auth.startRiotAuth.mutationOptions({
			onSuccess: (data) => {
				window.location.href = data.authUrl;
			},
			onError: (error) => {
				toast.error("Failed to start Riot authentication: " + error.message);
			},
		}),
	);

	const handleRiotCallback = useMutation(
		trpc.auth.handleRiotAuthCallback.mutationOptions({
			onSuccess: (data) => {
				toast.success(`Successfully linked Riot account: ${data.riotId}`);
				refetchUser();
				setIsProcessingCallback(false);
			},
			onError: (error) => {
				toast.error("Failed to link Riot account: " + error.message);
				setIsProcessingCallback(false);
			},
		}),
	);

	const updatePrimaryRegion = useMutation(
		trpc.users.updatePrimaryRegion.mutationOptions({
			onSuccess: () => {
				toast.success("Primary region updated successfully!");
				router.push("/");
			},
			onError: (error) => {
				toast.error("Failed to update region: " + error.message);
			},
		}),
	);

	// Handle OAuth callback
	useEffect(() => {
		const code = searchParams.get("code");
		if (code && !isProcessingCallback) {
			setIsProcessingCallback(true);
			handleRiotCallback.mutate({ code });
		}
	}, [searchParams, handleRiotCallback, isProcessingCallback]);

	const handleLinkRiotAccount = () => {
		startRiotAuth.mutate();
	};

	const handleSaveRegion = () => {
		if (!selectedRegion) {
			toast.error("Please select a region");
			return;
		}
		updatePrimaryRegion.mutate({ region: selectedRegion });
	};

	const isLinked = user?.puuid && user?.riotGameName && user?.riotTagLine;
	const hasRegion = user?.primaryRegion;
	const isFullyConfigured = isLinked && hasRegion;

	if (isProcessingCallback) {
		return (
			<div className="container mx-auto max-w-2xl py-8">
				<Card>
					<CardContent className="flex items-center justify-center py-8">
						<div className="text-center">
							<Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
							<p>Processing Riot account linking...</p>
						</div>
					</CardContent>
				</Card>
			</div>
		);
	}

	return (
		<div className="container mx-auto max-w-2xl py-8">
			<Card>
				<CardHeader>
					<CardTitle>Link Your Riot Account</CardTitle>
					<CardDescription>
						Connect your Riot Games account to access all platform features
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-6">
					{/* Riot Account Linking Section */}
					<div className="space-y-4">
						<div className="flex items-center justify-between">
							<div>
								<h3 className="text-lg font-medium">Riot Games Account</h3>
								<p className="text-sm text-muted-foreground">
									Link your Riot account to verify your identity
								</p>
							</div>
							{isLinked && (
								<Badge variant="secondary" className="flex items-center gap-1">
									<CheckCircle className="h-3 w-3" />
									Linked
								</Badge>
							)}
						</div>

						{!isLinked ? (
							<Button
								onClick={handleLinkRiotAccount}
								disabled={startRiotAuth.isPending}
								className="w-full"
							>
								{startRiotAuth.isPending ? (
									<>
										<Loader2 className="mr-2 h-4 w-4 animate-spin" />
										Redirecting...
									</>
								) : (
									<>
										<ExternalLink className="mr-2 h-4 w-4" />
										Link Riot Account
									</>
								)}
							</Button>
						) : (
							<div className="p-4 bg-muted rounded-lg">
								<div className="flex items-center justify-between">
									<div>
										<p className="font-medium">
											{user.riotGameName}#{user.riotTagLine}
										</p>
										<p className="text-sm text-muted-foreground">
											PUUID: {user.puuid?.slice(0, 8)}...
										</p>
									</div>
									<CheckCircle className="h-5 w-5 text-green-600" />
								</div>
							</div>
						)}
					</div>

					{/* Region Selection Section */}
					{isLinked && (
						<div className="space-y-4">
							<div className="flex items-center justify-between">
								<div>
									<h3 className="text-lg font-medium">Primary Region</h3>
									<p className="text-sm text-muted-foreground">
										Select your main gameplay region
									</p>
								</div>
								{hasRegion && (
									<Badge variant="secondary" className="flex items-center gap-1">
										<CheckCircle className="h-3 w-3" />
										Set
									</Badge>
								)}
							</div>

							<div className="space-y-4">
								<Select
									value={selectedRegion || user.primaryRegion || ""}
									onValueChange={setSelectedRegion}
								>
									<SelectTrigger>
										<SelectValue placeholder="Select your primary region" />
									</SelectTrigger>
									<SelectContent>
										{REGIONS.map((region) => (
											<SelectItem key={region.code} value={region.code}>
												{region.label}
											</SelectItem>
										))}
									</SelectContent>
								</Select>

								{hasRegion && (
									<div className="p-3 bg-muted rounded-lg">
										<p className="text-sm">
											Current region:{" "}
											<span className="font-medium">
												{REGIONS.find((r) => r.code === user.primaryRegion)
													?.label || user.primaryRegion}
											</span>
										</p>
									</div>
								)}

								<Button
									onClick={handleSaveRegion}
									disabled={updatePrimaryRegion.isPending || !selectedRegion}
									className="w-full"
								>
									{updatePrimaryRegion.isPending ? (
										<>
											<Loader2 className="mr-2 h-4 w-4 animate-spin" />
											Saving...
										</>
									) : (
										"Save Region"
									)}
								</Button>
							</div>
						</div>
					)}

					{/* Status Summary */}
					{isFullyConfigured && (
						<div className="p-4 bg-green-50 border border-green-200 rounded-lg">
							<div className="flex items-center gap-2">
								<CheckCircle className="h-5 w-5 text-green-600" />
								<div>
									<p className="font-medium text-green-800">
										Account Setup Complete
									</p>
									<p className="text-sm text-green-700">
										You can now access all platform features
									</p>
								</div>
							</div>
							<Button
								onClick={() => router.push("/")}
								variant="outline"
								className="mt-3 w-full"
							>
								Continue to Dashboard
							</Button>
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
