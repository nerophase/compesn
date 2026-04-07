"use client";

import { TChampion } from "@compesn/shared/common/types/champion";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, UseFormReturn } from "react-hook-form";
import { TeamNameInput } from "@/components/team-name-input";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { z } from "zod";
import {
	DRAFT_MODE_OPTIONS,
	NUMBER_OF_DRAFTS_OPTIONS,
	PICK_TYPE_OPTIONS,
} from "@/constants/room-settings-form";
import { TIME_OPTIONS } from "@/constants/room-settings-form";
import { Checkbox } from "@/components/ui/checkbox";
import { useMemo, useState } from "react";
import { TURNS_SORTED_BY_CONFIG_ORDER } from "@/constants/turns";
import { ORDINAL_NUMBERS } from "@/constants/ordinalNumbers";
import { TTeamColor } from "@compesn/shared/common/types/team-color";
import { useSession } from "next-auth/react";
import { Users, Shield, Gamepad2, Sparkles, Plus, XIcon } from "lucide-react";
import ChampionsModal from "@/components/champions-modal";
import Image from "next/image";
import { getChampionSmallImgURL } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { ROOM_DEFAULT_SETTINGS } from "@/constants/room";
import { useRouter } from "next/navigation";
import { TDraftMode } from "@compesn/shared/common/types/draft-mode";
import { isProfane } from "@/utils/sanitizer";
import { toast } from "sonner";
import { TRoom } from "@compesn/shared/common/types/room";
import { TUserTeam } from "@compesn/shared/common/types/user-team";
import { TTurn } from "@compesn/shared/common/types/turn";
import { RoomSettingsSchema } from "@/trpc/routers/rooms/rooms.schema";
import { useTRPC } from "@/trpc/client";
import { useMutation, useQuery } from "@tanstack/react-query";
import { TTeam } from "@compesn/shared/common/schemas";

export default function RoomSettingsPage({}: { room: TRoom | undefined }) {
	const trpc = useTRPC();
	const session = useSession();
	const router = useRouter();

	const blocked = false;

	const [loadingCreateRoom, setLoadingCreateRoom] = useState<boolean>(false);
	const [numberOfDraftsOptions, setNumberOfDraftsOptions] = useState<
		{
			label: string;
			value: number;
		}[]
	>(NUMBER_OF_DRAFTS_OPTIONS);

	const { data: userTeams = [] } = useQuery(trpc.teams.userTeamsFlat.queryOptions());

	const { data: champions = [] } = useQuery(trpc.champions.getAll.queryOptions());

	const form = useForm<z.infer<typeof RoomSettingsSchema>>({
		resolver: zodResolver(RoomSettingsSchema),
		defaultValues: !blocked
			? {
					...ROOM_DEFAULT_SETTINGS,
					creatorId: session.status === "authenticated" ? session?.data?.user?.id : "",
				}
			: {},
	});

	const { mutateAsync: createRoom } = useMutation(
		trpc.rooms.create.mutationOptions({
			onMutate: (values) => {
				setLoadingCreateRoom(true);
			},
			onError: (error) => {
				toast.error("Something went wrong while creating the room");
				setLoadingCreateRoom(false);
			},
			onSuccess: (data) => {
				router.push(`/draft/${data?.id}`);
			},
		}),
	);

	async function onSubmit(values: z.infer<typeof RoomSettingsSchema>) {
		if (!values.blueTeamName) {
			values.blueTeamName = "Team 1";
		}
		if (!values.redTeamName) {
			values.redTeamName = "Team 2";
		}

		if (isProfane(values.blueTeamName) || isProfane(values.redTeamName)) {
			toast.error("Team names can't contain profanities");
			setLoadingCreateRoom(false);
			return;
		}

		await createRoom(values);
	}

	return (
		<div className="min-h-screen w-full flex items-center justify-center p-4">
			{/* Main Container */}
			<div className="w-full max-w-7xl mx-auto">
				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
						{/* Header */}
						<div className="text-center space-y-4 mb-12 animate-fade-in">
							<div className="flex items-center justify-center gap-3 mb-6">
								<h1 className="text-5xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent neon-text">
									Room Configuration
								</h1>
							</div>
							<div className="h-1 w-32 mx-auto bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full opacity-60" />
						</div>

						{/* Game Settings Card */}
						<div className="relative group animate-slide-in-up">
							<div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-xl blur opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200" />
							<div className="relative bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-xl p-8 hover:shadow-2xl hover:shadow-cyan-500/10 transition-all duration-500">
								<div className="flex items-center gap-3 mb-6">
									<Sparkles className="w-6 h-6 text-cyan-400" />
									<h2 className="text-2xl font-semibold text-white">
										Game Settings
									</h2>
								</div>

								<div className="flex justify-between items-start flex-wrap gap-8 w-full">
									<GameSettingButtons
										form={form}
										label="Draft Mode"
										name="draftMode"
										options={DRAFT_MODE_OPTIONS}
										blocked={blocked}
										onChange={(value: TDraftMode) => {
											if (value === "fearless") {
												setNumberOfDraftsOptions(
													NUMBER_OF_DRAFTS_OPTIONS.slice(1),
												);
												form.setValue("numberOfDrafts", 2);
											} else {
												setNumberOfDraftsOptions(NUMBER_OF_DRAFTS_OPTIONS);
											}
										}}
									/>
									<GameSettingButtons
										form={form}
										label="Number of Drafts"
										name="numberOfDrafts"
										options={numberOfDraftsOptions}
										blocked={blocked}
									/>
									<GameSettingButtons
										form={form}
										label="Game Type"
										name="pickType"
										options={PICK_TYPE_OPTIONS}
										blocked={blocked}
									/>
									<GameSettingButtons
										form={form}
										label="Pick Time"
										name="timePerPick"
										options={TIME_OPTIONS}
										blocked={blocked}
									/>
									<GameSettingButtons
										form={form}
										label="Ban Time"
										name="timePerBan"
										options={TIME_OPTIONS}
										blocked={blocked}
									/>
								</div>
							</div>
						</div>

						{/* Teams Configuration */}
						<div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
							<TeamConfig
								form={form}
								turns={TURNS_SORTED_BY_CONFIG_ORDER.filter((x) => x.type === "ban")}
								teamFormName="blueTeamName"
								otherTeamFormName="redTeamName"
								team="blue"
								teams={userTeams}
								userTeams={userTeams}
								blocked={blocked}
							/>
							<TeamConfig
								form={form}
								turns={TURNS_SORTED_BY_CONFIG_ORDER.filter((x) => x.type === "ban")}
								teamFormName="redTeamName"
								otherTeamFormName="blueTeamName"
								team="red"
								teams={userTeams}
								userTeams={userTeams}
								blocked={blocked}
							/>
						</div>

						{/* Champion Restrictions */}
						<div
							className="relative group animate-slide-in-up"
							style={{ animationDelay: "0.2s" }}
						>
							<div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl blur opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200" />
							<div className="relative bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-xl p-8 hover:shadow-2xl hover:shadow-purple-500/10 transition-all duration-500">
								<DisabledChampionSelector
									form={form}
									champions={champions}
									blocked={blocked}
								/>
							</div>
						</div>

						{/* Submit Button */}
						{!blocked && (
							<div
								className="flex justify-center pt-8 animate-slide-in-up"
								style={{ animationDelay: "0.4s" }}
							>
								<div className="relative group">
									<div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 rounded-xl blur opacity-60 group-hover:opacity-80 transition duration-300" />
									<Button
										type="submit"
										className="relative bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold  rounded-xl shadow-lg transform transition duration-300 ease-in-out hover:scale-105 hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
										size="lg"
										disabled={loadingCreateRoom}
									>
										{loadingCreateRoom ? (
											<>
												<div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
												Creating Room...
											</>
										) : (
											<>
												<Gamepad2 className="w-5 h-5" />
												Create Room
											</>
										)}
									</Button>
								</div>
							</div>
						)}
					</form>
				</Form>
			</div>
		</div>
	);
}

function DisabledChampionSelector({
	form,
	champions,
	blocked,
}: {
	form: UseFormReturn<z.infer<typeof RoomSettingsSchema>>;
	champions: TChampion[];
	blocked?: boolean;
}) {
	const disabledChampions = form.watch("disabledChampions");

	const handleChampionSelect = (champion: TChampion) => {
		const currentDisabledChampions = form.getValues("disabledChampions");
		if (currentDisabledChampions.find((champ) => champ.name === champion.name)) {
			form.setValue(
				"disabledChampions",
				currentDisabledChampions.filter((element) => champion.name !== element.name),
			);
		} else {
			form.setValue("disabledChampions", [...currentDisabledChampions, champion]);
		}
	};

	return (
		<FormField
			control={form.control}
			name="disabledChampions"
			render={() => (
				<FormItem>
					<div className="flex items-center mb-6 justify-between">
						<div className="flex items-center gap-3">
							<Shield className="w-6 h-6 text-purple-400" />
							<h2 className="text-2xl font-semibold text-white">
								Champion Restrictions
							</h2>
						</div>

						{!blocked && (
							<ChampionsModal
								champions={champions}
								disabledChampions={disabledChampions}
								onChampionSelect={handleChampionSelect}
								blocked={blocked}
							>
								<Button
									size="lg"
									variant="outline"
									className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 border-purple-500/30 hover:border-purple-400/50 text-purple-200 hover:text-purple-100 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/25"
									type="button"
								>
									<Plus className="w-5 h-5 mr-2" />
									Manage Champions
								</Button>
							</ChampionsModal>
						)}
					</div>

					{/* Champion Images Display */}
					<div className="relative min-h-[120px] p-3">
						{disabledChampions.length === 0 ? (
							<div className="flex items-center justify-center h-[100px] text-gray-400">
								<div className="text-center">
									<Shield className="w-8 h-8 mx-auto mb-2 opacity-50" />
									<p className="text-sm">No champions disabled</p>
									{!blocked && (
										<p className="text-xs mt-1">
											Click &quot;Manage Champions&quot; to ban champions
										</p>
									)}
								</div>
							</div>
						) : (
							<div className="flex flex-wrap gap-2">
								{disabledChampions.map((champion, index) => (
									<div
										key={champion.name + index}
										className="relative group"
										title={champion.name}
									>
										<div className="relative w-16 h-16 rounded-lg overflow-hidden border border-white/20 bg-slate-800/50">
											<Image
												src={getChampionSmallImgURL(champion)}
												alt={champion.name}
												className="w-full h-full object-cover grayscale"
												width={64}
												height={64}
											/>
											<div className="absolute inset-0 bg-red-500/20 mix-blend-multiply" />
											<div className="absolute inset-0 border border-red-500/30 rounded-lg" />
										</div>
										{!blocked && (
											<button
												type="button"
												className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-red-600 hover:cursor-pointer"
												title={`Remove ${champion.name}`}
												onClick={() => handleChampionSelect(champion)}
											>
												<XIcon size={12} />
											</button>
										)}
									</div>
								))}
							</div>
						)}
						<div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-pink-500/5 rounded-lg pointer-events-none" />
					</div>
				</FormItem>
			)}
		/>
	);
}

function TeamConfig({
	form,
	turns,
	teamFormName,
	otherTeamFormName,
	team,
	teams,
	userTeams,
	blocked = false,
}: {
	form: UseFormReturn<z.infer<typeof RoomSettingsSchema>>;
	turns: TTurn[];
	teamFormName: any;
	otherTeamFormName: any;
	team: TTeamColor;
	teams: TTeam[];
	userTeams: TTeam[];
	blocked?: boolean;
}) {
	const teamLabel = team === "blue" ? "Blue Team" : "Red Team";
	const gradientClass =
		team === "blue" ? "from-blue-500 to-cyan-500" : "from-red-500 to-pink-500";
	const glowClass = team === "blue" ? "shadow-blue-500/25" : "shadow-red-500/25";
	const borderClass = team === "blue" ? "border-blue-500/30" : "border-red-500/30";

	return (
		<div
			className={cn(
				"relative group",
				team === "blue" ? "animate-slide-in-left" : "animate-slide-in-right",
			)}
		>
			<div
				className={cn(
					"absolute -inset-0.5 bg-gradient-to-r rounded-xl blur opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200",
					gradientClass,
				)}
			/>
			<div
				className={cn(
					"relative bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-xl p-6 hover:shadow-2xl transition-all duration-500",
					`hover:${glowClass}`,
				)}
			>
				{/* Team Header */}
				<div className="flex items-center mb-6">
					<div className="flex items-center gap-3">
						<div
							className={cn(
								"p-2 rounded-full bg-gradient-to-r backdrop-blur-sm",
								`${gradientClass
									.replace("from-", "from-")
									.replace("to-", "to-")}/20`,
								borderClass,
							)}
						>
							<Users
								className={cn(
									"w-5 h-5",
									team === "blue" ? "text-blue-400" : "text-red-400",
								)}
							/>
						</div>
						<h3
							className={cn(
								"text-xl font-semibold",
								team === "blue" ? "text-blue-200" : "text-red-200",
							)}
						>
							{teamLabel}
						</h3>
					</div>
				</div>

				{/* Team Name Input */}
				<div className="mb-6">
					<label
						className={cn(
							"block text-sm font-medium mb-2",
							team === "blue" ? "text-blue-300" : "text-red-300",
						)}
					>
						Team Name
					</label>
					<TeamNameInput
						form={form}
						name={teamFormName}
						teams={teams}
						userTeams={userTeams}
						blocked={blocked}
						placeholder="Enter or select team name..."
						className={cn(
							"bg-slate-800/50 backdrop-blur-sm border-white/20 text-white placeholder-gray-400 transition-all duration-300 focus:border-opacity-50",
							team === "blue" ? "focus:border-blue-500" : "focus:border-red-500",
						)}
						callback={() => {
							const teamName: string = form.getValues(teamFormName);
							const otherTeamName: string = form.getValues(otherTeamFormName);
							if (teamName === otherTeamName) {
								form.setValue(otherTeamFormName, "");
							}
						}}
					/>
				</div>

				{/* Turn Configuration */}
				<div className="space-y-3">
					<h4
						className={cn(
							"text-sm font-medium",
							team === "blue" ? "text-blue-300" : "text-red-300",
						)}
					>
						Draft Phases
					</h4>
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
						{turns.map((turn) => {
							if (turn.team === team)
								return (
									<div
										key={turn.number}
										className={cn(
											"p-3 bg-slate-800/30 backdrop-blur-sm rounded-lg border border-white/10 transition-all duration-300 hover:border-opacity-30",
											team === "blue"
												? "hover:border-blue-500"
												: "hover:border-red-500",
										)}
									>
										<FormField
											control={form.control}
											name="disabledTurns"
											render={({ field }) => (
												<FormItem className="flex items-center space-y-0 gap-3">
													<FormControl>
														<Checkbox
															checked={
																!field.value.includes(turn.number)
															}
															disabled={blocked}
															onCheckedChange={() => {
																const disabledTurns =
																	form.getValues("disabledTurns");
																form.setValue(
																	"disabledTurns",
																	disabledTurns.includes(
																		turn.number,
																	)
																		? disabledTurns.filter(
																				(e) =>
																					e !==
																					turn.number,
																			)
																		: [
																				...disabledTurns,
																				turn.number,
																			],
																);
															}}
															className={cn(
																"w-4 h-4 border-2 transition-all duration-300",
																team === "blue"
																	? "border-blue-500/50 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-500/50"
																	: "border-red-500/50 data-[state=checked]:bg-red-600 data-[state=checked]:border-red-500/50",
															)}
														/>
													</FormControl>
													<FormLabel className="text-sm text-gray-300 cursor-pointer flex-1">
														{ORDINAL_NUMBERS[turn.typeNumber - 1]}{" "}
														{turn.type.charAt(0).toUpperCase() +
															turn.type.slice(1)}
													</FormLabel>
												</FormItem>
											)}
										/>
									</div>
								);
						})}
					</div>
				</div>
			</div>
		</div>
	);
}

// Custom Gaming Button Component
function GameSettingButtons({
	form,
	label,
	name,
	options,
	blocked = false,
	onChange,
}: {
	form: UseFormReturn<z.infer<typeof RoomSettingsSchema>>;
	label: string;
	name: keyof z.infer<typeof RoomSettingsSchema>;
	options: { label: string; value: any }[];
	blocked?: boolean;
	onChange?: (value: any) => void;
}) {
	const currentValue = form.watch(name);

	const handleButtonClick = (value: any) => {
		if (blocked) return;
		form.setValue(name, value);
		if (onChange) {
			onChange(value);
		}
	};

	// Determine grid columns based on number of options
	const getGridCols = () => {
		const count = options.length;
		if (count === 2) return "grid-cols-2";
		if (count === 3) return "grid-cols-3";
		if (count === 4) return "grid-cols-2";
		if (count === 5) return "grid-cols-3";
		// For any other count, use a sensible default
		return count > 4 ? "grid-cols-3" : `grid-cols-${count}`;
	};

	return (
		<FormField
			control={form.control}
			name={name}
			render={() => (
				<FormItem className="flex flex-col items-start w-fit">
					<FormLabel className="text-sm font-medium text-cyan-300 block">
						{label}
					</FormLabel>

					<div className="space-y-3">
						{/* Button Grid */}
						<div className={cn("grid gap-2", getGridCols())}>
							{options.map((option, index) => {
								const isSelected = option.value === currentValue;
								return (
									<button
										key={index}
										type="button"
										className={cn(
											"relative group px-4 py-2 rounded-lg font-medium text-sm transition-all duration-300 border hover:cursor-pointer",
											isSelected
												? "bg-gradient-to-r from-cyan-600/80 to-blue-600/80 border-cyan-500/50 text-white shadow-lg shadow-cyan-500/25"
												: "bg-slate-800/50 border-white/10 text-slate-300 hover:bg-slate-700/50 hover:border-cyan-500/30 hover:text-cyan-200",
											blocked && "opacity-50 cursor-not-allowed",
											!blocked &&
												!isSelected &&
												"hover:shadow-lg hover:shadow-cyan-500/10 hover:scale-[1.02]",
											!blocked &&
												isSelected &&
												"hover:shadow-xl hover:shadow-cyan-500/30",
										)}
										onClick={() => handleButtonClick(option.value)}
										disabled={blocked}
									>
										<span className="relative z-10">{option.label}</span>

										{isSelected && (
											<div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-lg blur opacity-20 -z-10" />
										)}
									</button>
								);
							})}
						</div>
					</div>
				</FormItem>
			)}
		/>
	);
}
