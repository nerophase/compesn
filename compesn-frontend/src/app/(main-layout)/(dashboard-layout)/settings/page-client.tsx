"use client";

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
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import DashboardHeader from "@/components/dashboard-top";
import { regions } from "@/constants/regions";
import { useSession } from "next-auth/react";
import { useTRPC } from "@/trpc/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTRPCMutationForm } from "@/utils/reactTRPCHookForm";
import { UserUpdateInfoSchema } from "@/trpc/routers/users/users.schema";

export default function SettingsPageClient() {
	const trpc = useTRPC();
	const queryClient = useQueryClient();

	const { data: userData } = useQuery(trpc.users.getUser.queryOptions());

	const updateUserInfo = useMutation(
		trpc.users.updateInfo.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries(trpc.users.getUser.queryOptions());
			},
		}),
	);

	const {
		onSubmit: onUpdateUserInfo,
		form: updateUserInfoForm,
		isPending: updateUserInfoPending,
	} = useTRPCMutationForm(updateUserInfo, {
		schema: UserUpdateInfoSchema,
		mode: "onBlur",
		reValidateMode: "onBlur",
		defaultValues: {
			name: userData?.name ?? "",
			email: userData?.email ?? "",
			// region: userData?.region ?? "",
		},
	});

	return (
		<Form {...updateUserInfoForm}>
			<DashboardHeader title="Settings" description="Manage your personal information." />
			<form onSubmit={onUpdateUserInfo} className="space-y-4 max-w-sm pt-0">
				<FormField
					control={updateUserInfoForm.control}
					name="name"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Name</FormLabel>
							<FormControl>
								<Input placeholder="name" {...field} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
				<FormField
					control={updateUserInfoForm.control}
					name="email"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Email Address</FormLabel>
							<FormControl>
								<Input placeholder="email@gmail.com" {...field} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
				<FormField
					control={updateUserInfoForm.control}
					name="region"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Region</FormLabel>
							<Select
								onValueChange={field.onChange}
								value={field.value}
								defaultValue={field.value}
							>
								<FormControl>
									<SelectTrigger>
										<SelectValue placeholder="Select your region" />
									</SelectTrigger>
								</FormControl>
								<SelectContent>
									{regions.map((region) => (
										<SelectItem value={region.code} key={region.code}>
											{region.code} - {region.name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
							<FormMessage />
						</FormItem>
					)}
				/>
				<div className="flex gap-2 pt-4">
					<Button type="submit" disabled={updateUserInfoForm.formState.isSubmitting}>
						{!updateUserInfoForm.formState.isSubmitting
							? "Save Changes"
							: "Submitting Changes..."}
					</Button>
					<Button
						type="button"
						variant="outline"
						onClick={() => updateUserInfoForm.reset()}
						disabled={updateUserInfoForm.formState.isSubmitting}
					>
						Cancel
					</Button>
				</div>
			</form>
		</Form>
	);
}
