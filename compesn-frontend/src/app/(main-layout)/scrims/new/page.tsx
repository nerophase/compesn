"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";
import { CalendarIcon, Trophy, MessageSquare, Link } from "lucide-react";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { useTRPC } from "@/trpc/client";
import { useMutation } from "@tanstack/react-query";
import {
	ScrimCreateSchema,
	RankTierSchema,
	RankDivisionSchema,
	TeamRoleSchema,
} from "@/trpc/routers/scrims/scrims.schema";
import {
	Field,
	FieldContent,
	FieldDescription,
	FieldError,
	FieldGroup,
	FieldLabel,
	FieldLegend,
	FieldSet,
} from "@/components/ui/field";

const RANK_TIERS = [
	{ value: "IRON", label: "Iron" },
	{ value: "BRONZE", label: "Bronze" },
	{ value: "SILVER", label: "Silver" },
	{ value: "GOLD", label: "Gold" },
	{ value: "PLATINUM", label: "Platinum" },
	{ value: "EMERALD", label: "Emerald" },
	{ value: "DIAMOND", label: "Diamond" },
	{ value: "MASTER", label: "Master" },
	{ value: "GRANDMASTER", label: "Grandmaster" },
	{ value: "CHALLENGER", label: "Challenger" },
];

const RANK_DIVISIONS = [
	{ value: "I", label: "I" },
	{ value: "II", label: "II" },
	{ value: "III", label: "III" },
	{ value: "IV", label: "IV" },
];

const ROLES = [
	{ value: "TOP", label: "Top" },
	{ value: "JUNGLE", label: "Jungle" },
	{ value: "MID", label: "Mid" },
	{ value: "BOT", label: "Bot" },
	{ value: "SUPPORT", label: "Support" },
];

const DURATION_OPTIONS = [
	{ value: 30, label: "30 minutes" },
	{ value: 45, label: "45 minutes" },
	{ value: 60, label: "1 hour" },
	{ value: 90, label: "1.5 hours" },
	{ value: 120, label: "2 hours" },
	{ value: 180, label: "3 hours" },
];

const BEST_OF_OPTIONS = [
	{ value: 1, label: "Best of 1" },
	{ value: 3, label: "Best of 3" },
	{ value: 5, label: "Best of 5" },
];

const formSchema = z.object({
	startDate: z.date().optional(),
	startTime: z.string(),
	durationMinutes: z.number(),
	bestOf: z.number(),
	minRankTier: RankTierSchema.optional(),
	minRankDivision: RankDivisionSchema.optional(),
	maxRankTier: RankTierSchema.optional(),
	maxRankDivision: RankDivisionSchema.optional(),
	notes: z.string().optional(),
	commsLink: z.string().optional(),
	rolesNeeded: z.array(TeamRoleSchema),
});

export default function CreateScrimPage() {
	const router = useRouter();
	const trpc = useTRPC();
	const [isSubmitting, setIsSubmitting] = useState(false);

	const form = useForm<z.infer<typeof formSchema>>({
		defaultValues: {
			startDate: undefined,
			startTime: "",
			durationMinutes: 60,
			bestOf: 1,
			rolesNeeded: [],
			notes: "",
			commsLink: "",
		},
	});

	const createScrimMutation = useMutation(
		trpc.scrims.create.mutationOptions({
			onSuccess: (data) => {
				toast.success("Scrim created successfully!");
				router.push(`/scrims/${data?.id}`);
			},
			onError: (error) => {
				toast.error(error.message || "Failed to create scrim");
			},
			onSettled: () => {
				setIsSubmitting(false);
			},
		}),
	);

	const onSubmit = async (data: z.infer<typeof formSchema>) => {
		setIsSubmitting(true);

		try {
			// Validate required fields
			if (!data.startDate) {
				toast.error("Please select a date for the scrim");
				setIsSubmitting(false);
				return;
			}

			if (!data.startTime) {
				toast.error("Please select a time for the scrim");
				setIsSubmitting(false);
				return;
			}

			// Combine date and time
			const [hours, minutes] = data.startTime.split(":").map(Number);
			const startDateTime = new Date(data.startDate);
			startDateTime.setHours(hours, minutes, 0, 0);

			// Transform form data to match backend schema
			const payload = {
				startTime: startDateTime,
				durationMinutes: data.durationMinutes,
				bestOf: data.bestOf,
				minRankTier: data.minRankTier,
				minRankDivision: data.minRankDivision,
				maxRankTier: data.maxRankTier,
				maxRankDivision: data.maxRankDivision,
				notes: data.notes && data.notes.trim() !== "" ? data.notes : undefined,
				commsLink:
					data.commsLink && data.commsLink.trim() !== "" ? data.commsLink : undefined,
				rolesNeeded:
					data.rolesNeeded && data.rolesNeeded.length > 0 ? data.rolesNeeded : undefined,
			};

			// Validate against the backend schema
			const validatedPayload = ScrimCreateSchema.parse(payload);

			createScrimMutation.mutate(validatedPayload);
		} catch (error) {
			if (error instanceof z.ZodError) {
				// Show validation errors
				error.errors.forEach((err) => {
					toast.error(err.message);
				});
			} else {
				toast.error("Failed to create scrim");
			}
			setIsSubmitting(false);
		}
	};

	return (
		<div className="container mx-auto py-8 px-4 max-w-4xl">
			<div className="mb-8">
				<h1 className="text-3xl font-bold text-white mb-2">Create New Scrim</h1>
				<p className="text-gray-400">Schedule a scrim match with another team</p>
			</div>

			<Card className="bg-gray-900/50 border-gray-700">
				<CardHeader>
					<CardTitle className="text-white flex items-center gap-2">
						<Trophy className="h-5 w-5" />
						Scrim Details
					</CardTitle>
					<CardDescription>
						Fill out the details for your scrim match. Other teams will be able to see
						and request to join.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<form
						id="form-scrim"
						onSubmit={form.handleSubmit(onSubmit)}
						className="space-y-6"
					>
						{/* Date and Time */}
						<FieldGroup className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<Controller
								name="startDate"
								control={form.control}
								render={({ field, fieldState }) => (
									<Field data-invalid={fieldState.invalid}>
										<FieldLabel htmlFor={field.name}>Date</FieldLabel>
										<Popover>
											<PopoverTrigger asChild>
												<Button
													variant="outline"
													id={field.name}
													className={cn(
														"w-full pl-3 text-left font-normal bg-gray-800 border-gray-600 text-white",
														!field.value && "text-gray-400",
													)}
												>
													{field.value ? (
														format(field.value, "PPP")
													) : (
														<span>Pick a date</span>
													)}
													<CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
												</Button>
											</PopoverTrigger>
											<PopoverContent
												className="w-auto p-0 bg-gray-800 border-gray-600"
												align="start"
											>
												<Calendar
													id={field.name}
													mode="single"
													selected={field.value}
													onSelect={field.onChange}
													aria-invalid={fieldState.invalid}
													disabled={(date) => date < new Date()}
												/>
											</PopoverContent>
										</Popover>
										{fieldState.invalid && (
											<FieldError errors={[fieldState.error]} />
										)}
									</Field>
								)}
							/>
							<Controller
								name="startTime"
								control={form.control}
								render={({ field, fieldState }) => (
									<Field data-invalid={fieldState.invalid}>
										<FieldLabel htmlFor={field.name}>Bug Title</FieldLabel>
										<Input
											{...field}
											id={field.name}
											aria-invalid={fieldState.invalid}
											autoComplete="off"
											type="time"
										/>
										{fieldState.invalid && (
											<FieldError errors={[fieldState.error]} />
										)}
									</Field>
								)}
							/>
						</FieldGroup>
						{/* Duration and Best Of */}
						<FieldGroup className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<Controller
								name="durationMinutes"
								control={form.control}
								render={({ field, fieldState }) => (
									<Field
										orientation="vertical"
										data-invalid={fieldState.invalid}
										className="w-fit"
									>
										<FieldContent>
											<FieldLabel className="text-white">Duration</FieldLabel>
											{fieldState.invalid && (
												<FieldError errors={[fieldState.error]} />
											)}
										</FieldContent>
										<Select
											name={field.name}
											value={field.value.toString()}
											onValueChange={(value) => field.onChange(Number(value))}
										>
											<SelectTrigger
												id={field.name}
												aria-invalid={fieldState.invalid}
												className="bg-gray-800 border-gray-600 text-white"
											>
												<SelectValue placeholder="Select duration" />
											</SelectTrigger>
											<SelectContent className="bg-gray-800 border-gray-600">
												{DURATION_OPTIONS.map((option) => (
													<SelectItem
														key={option.value}
														value={option.value.toString()}
														className="text-white"
													>
														{option.label}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									</Field>
								)}
							/>
							<Controller
								name="bestOf"
								control={form.control}
								render={({ field, fieldState }) => (
									<Field
										orientation="vertical"
										data-invalid={fieldState.invalid}
										className="w-fit"
									>
										<FieldContent>
											<FieldLabel className="text-white">
												Match Format
											</FieldLabel>
											{fieldState.invalid && (
												<FieldError errors={[fieldState.error]} />
											)}
										</FieldContent>
										<Select
											name={field.name}
											value={field.value.toString()}
											onValueChange={(value) => field.onChange(Number(value))}
										>
											<SelectTrigger
												id={field.name}
												aria-invalid={fieldState.invalid}
												className="bg-gray-800 border-gray-600 text-white"
											>
												<SelectValue placeholder="Select duration" />
											</SelectTrigger>
											<SelectContent className="bg-gray-800 border-gray-600">
												{BEST_OF_OPTIONS.map((option) => (
													<SelectItem
														key={option.value}
														value={option.value.toString()}
														className="text-white"
													>
														{option.label}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									</Field>
								)}
							/>
						</FieldGroup>
						{/* Rank Requirements */}
						<div className="space-y-2">
							<h3 className="text-lg font-semibold text-white">
								Rank Requirements (Optional)
							</h3>
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								<FieldGroup className="flex flex-row gap-4">
									<Controller
										name="minRankTier"
										control={form.control}
										render={({ field, fieldState }) => (
											<Field
												orientation="vertical"
												data-invalid={fieldState.invalid}
												className="w-fit"
											>
												<FieldContent>
													<FieldLabel className="text-white">
														Minimum Rank
													</FieldLabel>
													{fieldState.invalid && (
														<FieldError errors={[fieldState.error]} />
													)}
												</FieldContent>
												<Select
													name={field.name}
													value={field.value}
													onValueChange={field.onChange}
												>
													<SelectTrigger
														id={field.name}
														aria-invalid={fieldState.invalid}
														className="bg-gray-800 border-gray-600 text-white"
													>
														<SelectValue placeholder="Tier" />
													</SelectTrigger>
													<SelectContent className="bg-gray-800 border-gray-600">
														{RANK_TIERS.map((tier) => (
															<SelectItem
																key={tier.value}
																value={tier.value}
																className="text-white"
															>
																{tier.label}
															</SelectItem>
														))}
													</SelectContent>
												</Select>
											</Field>
										)}
									/>
									<Controller
										name="minRankDivision"
										control={form.control}
										render={({ field, fieldState }) => (
											<Field
												orientation="vertical"
												data-invalid={fieldState.invalid}
												className="w-fit"
											>
												<FieldContent>
													{fieldState.invalid && (
														<FieldError errors={[fieldState.error]} />
													)}
												</FieldContent>
												<Select
													name={field.name}
													value={field.value}
													onValueChange={field.onChange}
												>
													<SelectTrigger
														id={field.name}
														aria-invalid={fieldState.invalid}
														className="bg-gray-800 border-gray-600 text-white"
													>
														<SelectValue placeholder="Div" />
													</SelectTrigger>
													<SelectContent className="bg-gray-800 border-gray-600">
														{RANK_DIVISIONS.map((div) => (
															<SelectItem
																key={div.value}
																value={div.value}
																className="text-white"
															>
																{div.label}
															</SelectItem>
														))}
													</SelectContent>
												</Select>
											</Field>
										)}
									/>
								</FieldGroup>
								<FieldGroup className="flex flex-row gap-4">
									<Controller
										name="maxRankTier"
										control={form.control}
										render={({ field, fieldState }) => (
											<Field
												orientation="vertical"
												data-invalid={fieldState.invalid}
												className="w-fit"
											>
												<FieldContent>
													<FieldLabel className="text-white">
														Maximum Rank
													</FieldLabel>
													{fieldState.invalid && (
														<FieldError errors={[fieldState.error]} />
													)}
												</FieldContent>
												<Select
													name={field.name}
													value={field.value}
													onValueChange={field.onChange}
												>
													<SelectTrigger
														id={field.name}
														aria-invalid={fieldState.invalid}
														className="bg-gray-800 border-gray-600 text-white"
													>
														<SelectValue placeholder="Tier" />
													</SelectTrigger>
													<SelectContent className="bg-gray-800 border-gray-600">
														{RANK_TIERS.map((tier) => (
															<SelectItem
																key={tier.value}
																value={tier.value}
																className="text-white"
															>
																{tier.label}
															</SelectItem>
														))}
													</SelectContent>
												</Select>
											</Field>
										)}
									/>
									<Controller
										name="maxRankDivision"
										control={form.control}
										render={({ field, fieldState }) => (
											<Field
												orientation="vertical"
												data-invalid={fieldState.invalid}
												className="w-fit"
											>
												<FieldContent>
													{fieldState.invalid && (
														<FieldError errors={[fieldState.error]} />
													)}
												</FieldContent>
												<Select
													name={field.name}
													value={field.value}
													onValueChange={field.onChange}
												>
													<SelectTrigger
														id={field.name}
														aria-invalid={fieldState.invalid}
														className="bg-gray-800 border-gray-600 text-white"
													>
														<SelectValue placeholder="Div" />
													</SelectTrigger>
													<SelectContent className="bg-gray-800 border-gray-600">
														{RANK_DIVISIONS.map((div) => (
															<SelectItem
																key={div.value}
																value={div.value}
																className="text-white"
															>
																{div.label}
															</SelectItem>
														))}
													</SelectContent>
												</Select>
											</Field>
										)}
									/>
								</FieldGroup>
							</div>
						</div>
						<div></div>
						{/* Roles Needed */}
						<div>
							<Controller
								name="rolesNeeded"
								control={form.control}
								render={({ field, fieldState }) => (
									<FieldSet>
										<FieldLegend variant="label">
											Roles Needed (Optional)
										</FieldLegend>
										<FieldDescription>
											Select which roles your team is looking for opponents to
											have
										</FieldDescription>
										<FieldGroup
											data-slot="checkbox-group"
											className="flex flex-wrap flex-row"
										>
											{ROLES.map((role) => (
												<Field
													key={role.value}
													orientation="horizontal"
													className="w-fit"
													data-invalid={fieldState.invalid}
												>
													<Checkbox
														id={role.value}
														name={field.name}
														aria-invalid={fieldState.invalid}
														className="border-gray-600"
														checked={field.value?.includes(
															role.value as z.infer<
																typeof TeamRoleSchema
															>,
														)}
														onCheckedChange={(checked) => {
															const newValue = checked
																? [...field?.value, role.value]
																: field.value.filter(
																		(value: string) =>
																			value !== role.value,
																	);
															field.onChange(newValue);
														}}
													/>
													<FieldLabel
														htmlFor={role.value}
														className="font-normal"
													>
														{role.label}
													</FieldLabel>
												</Field>
											))}
										</FieldGroup>
										{fieldState.invalid && (
											<FieldError errors={[fieldState.error]} />
										)}
									</FieldSet>
								)}
							/>
						</div>
						<FieldGroup className="gap-4">
							<Controller
								name="commsLink"
								control={form.control}
								render={({ field, fieldState }) => (
									<Field data-invalid={fieldState.invalid}>
										<FieldLabel className="text-white flex items-center gap-2">
											<Link className="h-4 w-4" />
											Communication Link (Optional)
										</FieldLabel>
										<FieldDescription>
											Provide a link for voice communication during the scrim
										</FieldDescription>
										<Input
											{...field}
											id={field.name}
											aria-invalid={fieldState.invalid}
											placeholder="Discord server invite, TeamSpeak, etc."
										/>

										{fieldState.invalid && (
											<FieldError errors={[fieldState.error]} />
										)}
									</Field>
								)}
							/>
							<Controller
								name="notes"
								control={form.control}
								render={({ field, fieldState }) => (
									<Field data-invalid={fieldState.invalid}>
										<FieldLabel className="text-white flex items-center gap-2">
											<MessageSquare className="h-4 w-4" />
											Additional Notes (Optional)
										</FieldLabel>
										<Textarea
											{...field}
											id="form-rhf-textarea-about"
											aria-invalid={fieldState.invalid}
											placeholder="Any additional information about the scrim..."
											className="bg-gray-800 border-gray-600 text-white resize-none"
											rows={3}
										/>
										<FieldDescription>
											{field.value?.length || 0}/500 characters
										</FieldDescription>
										{fieldState.invalid && (
											<FieldError errors={[fieldState.error]} />
										)}
									</Field>
								)}
							/>
						</FieldGroup>
						{/* Submit Button */}
						<div className="flex justify-end gap-4">
							<Button
								type="button"
								variant="outline"
								onClick={() => router.back()}
								className="border-gray-600 text-white hover:bg-gray-800"
							>
								Cancel
							</Button>
							<Button type="submit" disabled={isSubmitting}>
								{isSubmitting ? "Creating..." : "Create Scrim"}
							</Button>
						</div>
					</form>
				</CardContent>
			</Card>
		</div>
	);
}
