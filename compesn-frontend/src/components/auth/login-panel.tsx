"use client";

import Image from "next/image";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";

interface LoginPanelProps {
	callbackUrl?: string;
	error?: string | null;
}

export default function LoginPanel({ callbackUrl = "/", error }: LoginPanelProps) {
	const errorMessage =
		error === "RIOT_ERROR"
			? "There was an error while logging in with your Riot account."
			: error === "DISCORD_ERROR"
				? "There was an error while logging in with your Discord account."
				: "Choose a sign-in method to continue into Compesn.";

	return (
		<div className="relative overflow-hidden rounded-2xl border border-white/10 bg-slate-950 p-0 text-slate-50 shadow-2xl">
			<div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.26),_transparent_42%),linear-gradient(135deg,rgba(15,23,42,0.94),rgba(2,6,23,0.98))]" />
			<div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/70 to-transparent" />
			<div className="relative space-y-6 p-6">
				<div className="space-y-3 text-left">
					<div className="space-y-1">
						<h1 className="text-2xl font-semibold tracking-tight text-white">
							Log In / Sign Up
						</h1>
						<p className={error ? "text-sm text-rose-300" : "text-sm text-slate-300"}>
							{errorMessage}
						</p>
					</div>
				</div>

				<div className="flex flex-col gap-3">
					<Button
						type="button"
						className="h-12 w-full justify-start rounded-xl border border-white/10 bg-white/5 px-4 font-semibold text-white hover:bg-white/10"
						variant="outline"
						onClick={async () => await signIn("discord", { callbackUrl })}
					>
						<Image
							alt=""
							src="/imgs/discord-icon.png"
							width={24}
							height={24}
							className="mr-2 rounded-md"
						/>
						<span>Continue with Discord</span>
					</Button>
					<Button
						type="button"
						className="h-12 w-full justify-start rounded-xl border border-white/10 bg-white/5 px-4 font-semibold text-white hover:bg-white/10"
						variant="outline"
						onClick={async () => await signIn("riot", { callbackUrl })}
					>
						<Image
							alt=""
							src="/imgs/riot-icon.png"
							width={24}
							height={24}
							className="mr-2 rounded-md"
						/>
						<span>Continue with Riot</span>
					</Button>
					<Button
						type="button"
						className="h-12 w-full rounded-xl bg-cyan-400 font-semibold text-slate-950 hover:bg-cyan-300"
						onClick={async () =>
							await signIn("credentials", {
								username: "",
								password: "",
								redirectTo: callbackUrl,
							})
						}
					>
						<span>Credentials Test</span>
					</Button>
				</div>

				<div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
					By continuing, you agree to the{" "}
					<Link href="/" className="font-medium text-cyan-300 hover:text-cyan-200">
						Terms and Conditions
					</Link>
					.
				</div>
			</div>
		</div>
	);
}
