"use client";

import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { useRouter } from "next/navigation";
import * as z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "../../../components/ui/form";
import { Input } from "../../../components/ui/input";
import { signIn } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";
import { toast } from "sonner";
import { useState } from "react";
import LoaderSpin from "@/components/loader-spin";

const formSchema = z
	.object({
		username: z.string(),
		password: z.string(),
	})
	.superRefine(({ username, password }, ctx) => {
		if (!username) {
			ctx.addIssue({
				path: ["username"],
				code: "custom",
				message: "Fill username field",
			});
		}
		if (!password) {
			ctx.addIssue({
				path: ["password"],
				code: "custom",
				message: "Fill password field",
			});
		}
	});

export default function LoginPageClient() {
	const router = useRouter();
	const [loadingResponse, setLoadingResponse] = useState<boolean>(false);
	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			username: "",
			password: "",
		},
	});

	async function signInWithCredentials(values: z.infer<typeof formSchema>) {
		setLoadingResponse(true);
		const signInResponse = await signIn("credentials", {
			username: values.username,
			password: values.password,
			redirect: false,
		});

		if (!signInResponse.error) {
			router.push("/");
		} else {
			toast.error("Uh oh! Something went wrong.", {
				description: "Incorrect username or password.",
			});
			setLoadingResponse(false);
		}
	}

	async function signInWithProvider(provider: string) {
		await signIn(provider, {
			callbackUrl: "/",
		});
	}

	return (
		<Card className="w-full max-w-sm my-6">
			<CardHeader>
				<CardTitle>Log In</CardTitle>
				<CardDescription>
					<span>
						You don&apos;t have an account?{" "}
						<Link href={"/auth/signup"} className="text-primary">
							Sign Up
						</Link>
					</span>
				</CardDescription>
			</CardHeader>
			<CardContent className="flex flex-col gap-2 w-full justify-center items-center">
				<Form {...form}>
					<form
						onSubmit={form.handleSubmit(signInWithCredentials)}
						className="space-y-4 w-full mt-0"
					>
						<FormField
							control={form.control}
							name="username"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Username</FormLabel>
									<FormControl>
										<Input placeholder="username" {...field} />
									</FormControl>
									<FormMessage className="text-red-500" />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="password"
							render={({ field }) => (
								<FormItem>
									<FormLabel className="flex justify-between">
										<span>Password</span>
									</FormLabel>
									<FormControl>
										<Input placeholder="password" {...field} type="password" />
									</FormControl>

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
								"Login with Credentials"
							) : (
								<div className="flex items-center justify-center gap-2">
									<LoaderSpin />
									<span className="font-semibold">Loading</span>
								</div>
							)}
						</Button>
						<div className="flex items-center justify-center">
							<span className="border w-full"></span>
							<span className="min-w-fit px-2 select-none text-sm">
								OR CONTINUE WITH
							</span>
							<span className="border w-full"></span>
						</div>
						<Button
							type="button"
							className="w-full font-bold"
							variant={"outline"}
							onClick={() => signInWithProvider("discord")}
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
							onClick={() => signInWithProvider("riot")}
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
						<Link
							href={"/auth/forgot-password"}
							className="text-gray-500 flex justify-center items-center"
						>
							Forgot password?
						</Link>
					</form>
				</Form>
			</CardContent>
			{/* <CardFooter></CardFooter> */}
		</Card>
	);
}
