"use client";

import Image from "next/image";
import { useTRPC } from "@/trpc/client";
import { toast } from "sonner";
import { Button } from "./ui/button";
import { PlusIcon } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { TAccount } from "@compesn/shared/types/account";
import { TRPCClientError } from "@trpc/client";

type Params = {
	name: "Riot" | "Discord";
	logo: string;
	accounts: TAccount[];
	defaultAccountId: string | null;
	setAccounts: React.Dispatch<React.SetStateAction<TAccount[]>>;
	canAddAccount: boolean;
	canRemoveAccount: boolean;
	// canSetDefault: boolean;
	onAddAccount: () => void;
	// onSetDefaultAccount?: (account: string) => void;
};

export default function AccountManager({
	name,
	logo,
	accounts,
	defaultAccountId,
	setAccounts,
	canAddAccount,
	canRemoveAccount,
	// canSetDefault,
	onAddAccount,
}: // onSetDefaultAccount,
Params) {
	const trpc = useTRPC();
	const { mutateAsync: removeAccount } = useMutation(trpc.users.removeAccount.mutationOptions());

	async function onRemoveAccount(account: TAccount) {
		try {
			await removeAccount({ accountId: account.id });
			setAccounts(accounts.filter((acc) => acc.id !== account.id));
			toast.success("Account removed successfully");
		} catch (e: unknown) {
			toast.error("Error while removing account", {
				description:
					e instanceof TRPCClientError && e.message === "CANNOT_DELETE_DEFAULT_ACCOUNT"
						? "You can't delete the account you used to register."
						: "An unexpected error occurred.",
			});
		}
	}

	return (
		<div className="flex flex-col">
			<div className="flex justify-between mb-2 items-center">
				<div className="flex gap-2 items-center">
					<Image alt="" src={logo} height={48} width={48} className="rounded-md" />
					<span className="font-bold">{name}</span>
				</div>
				{canAddAccount && (
					<Button
						// className={`text-primary hover:cursor-pointer`}
						onClick={onAddAccount}
					>
						<PlusIcon />
						Add Account
					</Button>
				)}
			</div>
			<div className="border mb-5"></div>

			{accounts.length === 0 ? (
				<span className="w-full text-center py-4">
					{name === "Riot"
						? `You don't have a ${name} account.`
						: `You don't have ${name} accounts.`}
				</span>
			) : (
				<div className="flex flex-col gap-4">
					{accounts.map((account) => {
						return (
							<div className="flex items-center justify-between" key={account.id}>
								<div className="flex gap-2 items-center w-full">
									<div className="w-10 h-10 relative">
										<Image
											alt=""
											fill
											src={"/imgs/pfp.png"}
											className="rounded-full"
										></Image>
									</div>
									<div className="flex flex-col">
										<span>{account.username}</span>
										{/* {account.id === defaultAccountId && (
											<span>[Default Account]</span>
										)} */}
									</div>
								</div>
								<div className="flex items-center gap-4 min-w-fit">
									{/* {canSetDefault &&
										account.id !== defaultAccountId && (
											<span
												className="text-primary select-none hover:cursor-pointer"
												onClick={() => {
													if (onSetDefaultAccount) {
														onSetDefaultAccount(
															account.username
														);
													}
												}}
											>
												Set Default
											</span>
										)} */}
									{canRemoveAccount && (
										<span
											className="text-red-500 select-none hover:cursor-pointer"
											onClick={() => onRemoveAccount(account)}
										>
											Remove
										</span>
									)}
								</div>
							</div>
						);
					})}
				</div>
			)}
		</div>
	);
}
