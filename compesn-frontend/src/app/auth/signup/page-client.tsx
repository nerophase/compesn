"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { REGIONS } from "@/constants/regions";
import { validatePassword } from "@/lib/password";
import * as z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Image from "next/image";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { FormCombobox } from "@/components/ui/form-combobox";
import PasswordInput from "@/components/forms/password-input";
import LoaderSpin from "@/components/loader-spin";
import { useState } from "react";
import { useTRPC } from "@/trpc/client";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { env, ROUTES } from "@/environment";

const formSchema = z
	.object({
		username: z.string().max(15),
		email: z.string().email({ message: "Invalid email address" }),
		password: z.string(),
		confirmPassword: z.string(),
		region: z.string({
			required_error: "Please select a region.",
		}),
		acceptTerms: z.boolean(),
	})
	.superRefine(({ username, password, confirmPassword, region, acceptTerms }, ctx) => {
		const passwordError = validatePassword(password);

		if (username === "") {
			ctx.addIssue({
				path: ["username"],
				code: "custom",
				message: "Invalid username",
			});
		}
		if (passwordError) {
			ctx.addIssue({
				path: ["password"],
				code: "custom",
				message: passwordError,
			});
		}
		if (confirmPassword !== password) {
			ctx.addIssue({
				path: ["confirmPassword"],
				code: "custom",
				message: "The passwords did not match",
			});
		}
		if (region === "") {
			ctx.addIssue({
				path: ["region"],
				code: "custom",
				message: "Please select a region",
			});
		}
		if (!acceptTerms) {
			ctx.addIssue({
				path: ["acceptTerms"],
				code: "custom",
				message: "Please read and accept the terms and conditions",
			});
		}
	});

export default function SignUpPageClient({
	data,
	signUpWithProvider,
	accountProvider,
}: {
	data: { username?: string; email?: string };
	signUpWithProvider: boolean;
	accountProvider: string;
}) {
	const trpc = useTRPC();
	const router = useRouter();
	const [loadingResponse, setLoadingResponse] = useState<boolean>(false);

	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			username: data.username ?? "",
			email: data.email ?? "",
			password: "",
			confirmPassword: "",
			region: "",
			acceptTerms: false,
		},
	});

	const { mutateAsync: register } = useMutation(
		trpc.auth.register.mutationOptions({
			onMutate: (values) => {
				setLoadingResponse(true);
			},
			onError: (error) => {
				toast.error(error.message);
				setLoadingResponse(false);
			},
			onSuccess: (data) => {
				setLoadingResponse(false);
				router.push("/");
			},
		}),
	);

	// TODO: FIX FUNCTION
	async function onSubmit(values: z.infer<typeof formSchema>) {
		try {
			let registerResponse;
			// setLoadingResponse(true);

			if (!signUpWithProvider) {
				// registerResponse = await register(
				// 	values.username,
				// 	values.email,
				// 	values.password,
				// 	values.region
				// );
			} else {
				// registerResponse = await axiosClient.post(
				// 	`${environment.serverApi.registerWithAccount}/${accountProvider}`,
				// 	{
				// 		username: values.username,
				// 		email: values.email,
				// 		password: values.password,
				// 		region: values.region,
				// 	}
				// );
			}

			// if (registerResponse.status === 200) {
			// 	const signInResponse = await signIn("credentials", {
			// 		username: values.username,
			// 		password: values.password,
			// 		redirect: false,
			// 	});

			// 	if (signInResponse?.error === null) {
			// 		router.push("/");
			// 	}
			// }
		} catch (e: any) {
			// const error: string = e.response?.data?.error;
			// if (error) {
			// 	if (error.includes("duplicate key error")) {
			// 		if (error.includes("username")) {
			// 			form.setError("username", {
			// 				type: "custom",
			// 				message: "There is a user with that username.",
			// 			});
			// 		}
			// 		if (error.includes("email")) {
			// 			form.setError("email", {
			// 				type: "custom",
			// 				message: "There is a user with that email.",
			// 			});
			// 		}
			// 	}
			// }
		}
		// setLoadingResponse(false);
	}

	return (
		<div className="w-full h-screen flex justify-safe align-safe overflow-y-auto">
			<Card className="w-full max-w-sm my-6">
				<CardHeader>
					<CardTitle>Create an account</CardTitle>
					<CardDescription>
						Do you already have an account?{" "}
						<Link href={"/auth/login"} className="text-blue-500">
							Login
						</Link>
					</CardDescription>
				</CardHeader>
				<CardContent className="flex flex-col gap-2 w-full ">
					<Form {...form}>
						<form
							onSubmit={form.handleSubmit(onSubmit)}
							className="space-y-4 w-full mt-0"
						>
							<FormField
								control={form.control}
								name="username"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Username</FormLabel>
										<FormControl>
											<Input
												placeholder="username"
												{...field}
												disabled={!!data.username}
											/>
										</FormControl>
										<FormMessage className="text-red-500" />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="email"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Email</FormLabel>
										<FormControl>
											<Input
												placeholder="email"
												{...field}
												disabled={!!data.email}
											/>
										</FormControl>
										<FormMessage className="text-red-500" />
									</FormItem>
								)}
							/>
							<PasswordInput
								formData={form}
								name="password"
								label="Password"
								placeholder="password"
							/>
							<PasswordInput
								formData={form}
								name="confirmPassword"
								label="Confirm Password"
								placeholder="confirm password"
							/>
							<FormCombobox
								form={form}
								options={REGIONS.map((x) => ({
									label: x.label,
									value: x.value,
								}))}
								name={"region"}
								label={"Region"}
								orientation="vertical"
								canSearch={true}
							/>
							<FormField
								control={form.control}
								name="acceptTerms"
								render={({ field }) => (
									<FormItem className="flex flex-col items-start space-x-3">
										<div className="flex items-center gap-2">
											<FormControl>
												<Checkbox
													checked={field.value}
													onCheckedChange={field.onChange}
													className="hover:cursor-pointer"
												/>
											</FormControl>
											<FormLabel className="flex gap-0 hover:cursor-pointer">
												Accept the
												<Link href={"/"} className="text-blue-500 pl-1">
													Terms and Conditions
												</Link>
												.
											</FormLabel>
										</div>
										<FormMessage className="text-red-500" />
									</FormItem>
								)}
							/>
							<Button
								type="submit"
								className="w-full cursor-pointer select-none"
								disabled={loadingResponse}
							>
								{!loadingResponse ? (
									"Sign Up"
								) : (
									<div className="flex items-center justify-center gap-2">
										<LoaderSpin />
										<span className="font-semibold">Loading</span>
									</div>
								)}
							</Button>
							{!signUpWithProvider && (
								<>
									<div className="flex items-center justify-center">
										<span className="border w-full"></span>
										<span className="min-w-fit px-2 select-none text-sm">
											OR SIGN UP WITH
										</span>
										<span className="border w-full" />
									</div>
									<div className="w-full flex flex-col gap-2">
										<Button
											type="button"
											className="w-full font-bold"
											variant={"outline"}
											onClick={() => {
												window.location.href = `${
													ROUTES.discord.authorize
												}?client_id=${
													env.NEXT_PUBLIC_AUTH_DISCORD_ID
												}&response_type=token&scope=identify+email&redirect_uri=${encodeURIComponent(
													`${env.NEXT_PUBLIC_BASE_URL}${ROUTES.client.accounts}/discord?action=register`,
												)}`;
											}}
										>
											<Image
												alt=""
												src={"/imgs/discord-icon.png"}
												width={24}
												height={24}
												className="rounded-md mr-2"
											/>
											<span>Discord</span>
										</Button>
										<Button
											type="button"
											className="w-full font-bold"
											variant={"outline"}
											onClick={() => {
												window.location.href = `${
													ROUTES.riot.authorize
												}?client_id=${
													env.NEXT_PUBLIC_AUTH_RIOT_ID
												}&response_type=code&scope=openid+cpid+offline_access&redirect_uri=${encodeURIComponent(
													`${env.NEXT_PUBLIC_BASE_URL}${ROUTES.client.accounts}/riot?action=register`,
												)}`;
											}}
										>
											<Image
												alt=""
												src={"/imgs/riot-icon.png"}
												width={24}
												height={24}
												className="rounded-md mr-2"
											/>
											<span className="">Riot</span>
										</Button>
									</div>
								</>
							)}
						</form>
					</Form>
				</CardContent>
				{/* <CardFooter></CardFooter> */}
			</Card>
		</div>
	);
}
