"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import AccountManager from "@/components/account-manager";
import DashboardHeader from "@/components/dashboard-top";
import { TUser } from "@compesn/shared/common/types/user";
import { TAccount } from "@compesn/shared/common/types/account";
import { env, ROUTES } from "@/environment";

export default function AccountsPageClient({
	userInfo,
	error,
}: {
	userInfo: TUser;
	error?: string;
}) {
	const [riotAccounts, setRiotAccounts] = useState<TAccount[]>(
		userInfo.accounts?.filter((a) => a.providerId === "riot") || [],
	);
	const [discordAccounts, setDiscordAccounts] = useState<TAccount[]>(
		userInfo.accounts?.filter((a) => a.providerId === "discord") || [],
	);
	const [defaultAccountId, setDefaultRiotAccount] = useState<string | null>(
		userInfo.defaultAccountId,
	);

	useEffect(() => {
		// const parsedHash = new URLSearchParams(window.location.search);
		// const error = parsedHash.get("error");
		let timerId: NodeJS.Timeout;

		if (error) {
			timerId = setTimeout(() =>
				toast.error("Error while adding account.", {
					description:
						error === "EXISTING_USER_WITH_ACCOUNT"
							? "There is an user with that account."
							: "",
				}),
			);
		}

		return () => {
			clearTimeout(timerId);
		};
	}, [error]);

	return (
		<div>
			<DashboardHeader
				title="Third-party accounts"
				description="Link your accounts to get aditional features."
			/>
			<div className="w-full h-full flex flex-col overflow-y-auto gap-10">
				{/* RIOT */}
				<AccountManager
					name="Riot"
					logo="/imgs/riot-logo.jpg"
					accounts={riotAccounts}
					defaultAccountId={defaultAccountId}
					setAccounts={setRiotAccounts}
					canAddAccount={true}
					canRemoveAccount={false}
					onAddAccount={() => {
						window.location.href = `${ROUTES.riot.authorize}?client_id=${
							env.NEXT_PUBLIC_AUTH_RIOT_ID
						}&response_type=code&scope=openid+cpid+offline_access&redirect_uri=${encodeURIComponent(
							`${env.NEXT_PUBLIC_BASE_URL}${ROUTES.client.accounts}/riot`,
						)}`;
					}}
				/>
				{/* DISCORD */}
				<AccountManager
					name="Discord"
					logo="/imgs/discord-logo.jpg"
					accounts={discordAccounts}
					defaultAccountId={defaultAccountId}
					setAccounts={setDiscordAccounts}
					canAddAccount={true}
					canRemoveAccount={true}
					// canSetDefault={true}
					onAddAccount={() => {
						window.location.href = `${ROUTES.discord.authorize}?client_id=${
							env.NEXT_PUBLIC_AUTH_DISCORD_ID
						}&response_type=code&scope=identify+email&redirect_uri=${encodeURIComponent(
							`${env.NEXT_PUBLIC_BASE_URL}${ROUTES.client.accounts}/discord`,
						)}`;
					}}
				/>
			</div>
		</div>
	);
}
