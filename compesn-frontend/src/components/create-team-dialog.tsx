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
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { PlusIcon, EditIcon } from "lucide-react";
import { REGIONS } from "@/constants/regions";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { TCurrentRank, TRegion } from "@/trpc/routers/teams/teams.schema";
import { ActivityLevel, RANK_TIERS } from "@/app/(main-layout)/teams/types";
import { AppRouter } from "@/trpc/routers/_app";

interface IQueryError {
	code: string;
	minimum: number;
	type: string;
	inclusive: boolean;
	exact: boolean;
	message: string;
	path: string[];
}

// Create Team Dialog Component
export function CreateTeamDialog({
	open,
	team,
	onOpenChange,
}: {
	open: boolean;
	team?: Awaited<ReturnType<AppRouter["teams"]["getById"]>>;
	onOpenChange: (open: boolean) => void;
}) {
	const trpc = useTRPC();
	const [teamName, setTeamName] = useState(team?.name || "");
	const [teamTag, setTeamTag] = useState(team?.tag || "");
	const [region, setRegion] = useState<TRegion | undefined>(team?.region || undefined);
	const [activityLevel, setActivityLevel] = useState<ActivityLevel>(
		team?.activityLevel || "REGULAR",
	);
	const [currentRank, setCurrentRank] = useState<TCurrentRank | undefined>(
		team?.currentRank || undefined,
	);
	const queryClient = useQueryClient();

	const createTeamMutation = useMutation(
		trpc.teams.create.mutationOptions({
			onSuccess: async () => {
				toast.success("Team created successfully!");
				onOpenChange(false);
				await queryClient.invalidateQueries({
					queryKey: trpc.teams.list.queryKey(),
				});
			},
			onError: (error) => {
				const errors = JSON.parse(error.message) as IQueryError[];
				toast.error(
					<div className="flex flex-col">
						{errors.map((e) => <span key={e.message}>{e.message}.</span>) ||
							"Failed to create team"}
					</div>,
				);
			},
		}),
	);

	const editTeamMutation = useMutation(
		trpc.teams.update.mutationOptions({
			onSuccess: async () => {
				toast.success("Team edited successfully!");
				onOpenChange(false);
				await queryClient.invalidateQueries({
					queryKey: trpc.teams.getById.queryKey({ teamId: team?.id }),
				});
			},
			onError: (error) => {
				const errors = JSON.parse(error.message) as IQueryError[];
				toast.error(
					<div className="flex flex-col">
						{errors.map((e) => <span key={e.message}>{e.message}.</span>) ||
							"Failed to edit team"}
					</div>,
				);
			},
		}),
	);

	const handleCreateTeam = () => {
		if (!teamName.trim()) {
			toast.error("Team name is required");
			return;
		}
		if (!teamTag.trim()) {
			toast.error("Team tag is required");
			return;
		}

		const values = {
			name: teamName.trim(),
			tag: teamTag.trim().toUpperCase(),
			region,
			currentRank,
			activityLevel,
		};

		if (!!team) {
			editTeamMutation.mutate({
				teamId: team.id,
				...values,
			});
		} else {
			createTeamMutation.mutate(values);
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogTrigger asChild>
				{!team ? (
					<Button className="bg-cyan-600 hover:bg-cyan-700">
						<PlusIcon className="h-4 w-4 mr-2" />
						Create Team
					</Button>
				) : (
					<Button
						variant="outline"
						// onClick={refetch}
						className="border-cyan-500/50 bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 backdrop-blur-sm"
					>
						<EditIcon className="h-4 w-4 mr-2" />
						Edit Team
					</Button>
				)}
			</DialogTrigger>
			<DialogContent className="bg-gray-900 border-cyan-500/30">
				<DialogHeader>
					<DialogTitle className="text-cyan-400">
						{team ? "Edit Your Team" : "Create Your Team"}
					</DialogTitle>
					<DialogDescription className="text-gray-400">
						Set up your team to start competing and managing scrims
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-4 py-4">
					<div className="space-y-2">
						<Label htmlFor="teamName" className="text-gray-300">
							Team Name
						</Label>
						<Input
							id="teamName"
							placeholder="Enter team name"
							value={teamName}
							onChange={(e) => setTeamName(e.target.value)}
							className="bg-gray-800 border-gray-600"
						/>
					</div>

					<div className="space-y-2">
						<Label htmlFor="teamTag" className="text-gray-300">
							Team Tag
						</Label>
						<Input
							id="teamTag"
							placeholder="e.g., TSM"
							value={teamTag}
							onChange={(e) => setTeamTag(e.target.value.toUpperCase())}
							maxLength={5}
							className="bg-gray-800 border-gray-600"
						/>
						<p className="text-xs text-gray-500">Max 5 characters</p>
					</div>

					<div className="space-y-2">
						<Label htmlFor="region" className="text-gray-300">
							Region (Optional)
						</Label>
						<Select
							value={region}
							onValueChange={(value: string) => {
								setRegion(value as TRegion);
							}}
						>
							<SelectTrigger className="bg-gray-800 border-gray-600">
								<SelectValue placeholder="Select region" />
							</SelectTrigger>
							<SelectContent>
								{REGIONS.map((r) => (
									<SelectItem key={r.value} value={r.value}>
										{r.label}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					<div className="space-y-2">
						<Label htmlFor="activityLevel" className="text-gray-300">
							Activity Level
						</Label>
						<Select
							value={activityLevel}
							onValueChange={(val) => setActivityLevel(val as ActivityLevel)}
						>
							<SelectTrigger className="bg-gray-800 border-gray-600">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="CASUAL">Casual</SelectItem>
								<SelectItem value="REGULAR">Regular</SelectItem>
								<SelectItem value="COMPETITIVE">Competitive</SelectItem>
								<SelectItem value="HARDCORE">Hardcore</SelectItem>
							</SelectContent>
						</Select>
					</div>

					<div className="space-y-2">
						<Label htmlFor="rank" className="text-gray-300">
							Current Rank (Optional)
						</Label>
						<Select
							value={currentRank}
							onValueChange={(value: string) => {
								setCurrentRank(value as TCurrentRank);
							}}
						>
							<SelectTrigger className="bg-gray-800 border-gray-600">
								<SelectValue placeholder="Select rank" />
							</SelectTrigger>
							<SelectContent>
								{RANK_TIERS.map((rank) => (
									<SelectItem key={rank} value={rank}>
										{rank}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
				</div>

				<DialogFooter>
					<Button
						variant="outline"
						onClick={() => onOpenChange(false)}
						className="border-gray-600 text-gray-300"
					>
						Cancel
					</Button>
					<Button
						onClick={handleCreateTeam}
						disabled={createTeamMutation.isPending}
						className="bg-cyan-600 hover:bg-cyan-700"
					>
						{!!team
							? editTeamMutation.isPending
								? "Editing..."
								: "Edit Team"
							: createTeamMutation.isPending
								? "Creating..."
								: "Create Team"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
