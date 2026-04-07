"use client";

import { useAuthModal } from "@/components/auth/auth-modal-provider";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/environment";
import { generateNotificationText, getNotificationLabel } from "@/lib/notification-text";
import { useTRPC } from "@/trpc/client";
import {
	BellIcon,
	LogOutIcon,
	LucideIcon,
	SettingsIcon,
	UserCogIcon,
	UsersIcon,
	LinkIcon,
} from "lucide-react";
import { useSession } from "next-auth/react";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useQuery } from "@tanstack/react-query";
import { MouseEventHandler, useState } from "react";
import { signOut } from "next-auth/react";
import LoaderSpin from "../loader-spin";
import { useRouter } from "next/navigation";

function MenuItem({
	Icon,
	onClick,
	label,
	variant,
}: {
	Icon: LucideIcon;
	onClick: MouseEventHandler<HTMLDivElement>;
	label: string;
	variant?: "default" | "destructive" | undefined;
}) {
	return (
		<DropdownMenuItem
			className="flex items-center justify-start gap-2"
			onClick={onClick}
			variant={variant}
		>
			<Icon color={variant === "destructive" ? "var(--destructive)" : "var(--foreground)"} />
			<span>{label}</span>
		</DropdownMenuItem>
	);
}

export default function UserNav() {
	const session = useSession();
	const router = useRouter();
	const { openAuthModal } = useAuthModal();
	const trpc = useTRPC();
	const [notificationsOpen, setNotificationsOpen] = useState(false);
	const [visibleNotificationCount, setVisibleNotificationCount] = useState(10);

	const notificationsQuery = useQuery({
		...trpc.notifications.list.queryOptions({
			skip: 0,
			limit: visibleNotificationCount,
		}),
		enabled: session.status === "authenticated" && notificationsOpen,
	});

	if (session.status === "loading") {
		return <LoaderSpin />;
	}

	if (session.status === "authenticated") {
		return (
			<>
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<span className="hover:cursor-pointer">{session.data.user.name}</span>
					</DropdownMenuTrigger>
					<DropdownMenuContent>
						<DropdownMenuLabel>My Account</DropdownMenuLabel>
						<DropdownMenuSeparator />
						{/* <MenuItem
							Icon={HistoryIcon}
							label="Draft History"
							onClick={() => {}}
						/> */}
						<MenuItem
							Icon={UserCogIcon}
							label="Accounts"
							onClick={() => {
								router.push("/accounts");
							}}
						/>
						<MenuItem
							Icon={LinkIcon}
							label="Link Riot Account"
							onClick={() => {
								router.push(ROUTES.client.accountLink);
							}}
						/>
						<MenuItem
							Icon={UsersIcon}
							label="Teams"
							onClick={() => {
								router.push("/teams");
							}}
						/>
						<MenuItem
							Icon={SettingsIcon}
							label="Settings"
							onClick={() => {
								router.push("/settings");
							}}
						/>
						<MenuItem
							Icon={LogOutIcon}
							label="Sign Out"
							onClick={() => {
								signOut({ redirect: true, redirectTo: "/" });
							}}
							variant="destructive"
						/>
					</DropdownMenuContent>
				</DropdownMenu>
				{/* Notification indicator */}
				<DropdownMenu
					onOpenChange={(open) => {
						setNotificationsOpen(open);
						if (open) {
							setVisibleNotificationCount(10);
						}
					}}
				>
					<DropdownMenuTrigger asChild>
						<button
							type="button"
							className="hidden sm:flex relative mr-1 w-8 h-8 rounded-md bg-cyan-900/20 items-center justify-center border border-cyan-500/30 cursor-pointer hover:bg-cyan-900/40 transition-colors"
							aria-label="Open notifications"
						>
							<BellIcon className="w-7/12" />
						</button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end" className="w-80 p-0">
						<div className="px-3 py-2 border-b border-cyan-500/20">
							<p className="text-sm font-medium">Notifications</p>
						</div>
						<div className="max-h-96 overflow-y-auto">
							{notificationsQuery.isLoading ? (
								<p className="px-3 py-4 text-sm text-muted-foreground">
									Loading notifications...
								</p>
							) : notificationsQuery.data &&
							  notificationsQuery.data.notificationsList.length > 0 ? (
								<div className="divide-y divide-cyan-500/10">
									{notificationsQuery.data.notificationsList.map((notification) => (
										<div key={notification.id} className="px-3 py-2.5">
											<p className="text-xs text-muted-foreground">
												{getNotificationLabel(notification.type)}
											</p>
											<p className="mt-1 text-sm">
												{generateNotificationText(
													notification,
													notificationsQuery.data.teamsById,
												)}
											</p>
											<p className="mt-1 text-xs text-muted-foreground">
												{new Date(notification.createdAt).toLocaleString()}
											</p>
										</div>
									))}
								</div>
							) : (
								<p className="px-3 py-4 text-sm text-muted-foreground">
									No notifications yet.
								</p>
							)}
						</div>
						{notificationsQuery.data?.hasMore && (
							<div className="border-t border-cyan-500/20 p-2">
								<Button
									type="button"
									variant="ghost"
									className="w-full"
									onClick={() => {
										setVisibleNotificationCount((previous) => previous + 10);
									}}
									disabled={notificationsQuery.isFetching}
								>
									{notificationsQuery.isFetching ? "Loading..." : "Show more.."}
								</Button>
							</div>
						)}
					</DropdownMenuContent>
				</DropdownMenu>
			</>
		);
	}

	return (
		<div className="flex items-center gap-2">
			<button
				type="button"
				className="flex items-center gap-2 px-3 py-1.5 bg-black/30 border border-cyan-500/30 hover:border-cyan-400/60 text-gray-300 hover:text-white text-sm rounded-sm transition-all duration-300 hover:shadow-[0_0_10px_rgba(96,204,247,0.2)]"
				onClick={() => openAuthModal()}
			>
				<span className="text-xs">LOGIN</span>
			</button>
			{/* <Link
				className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-cyan-600/80 to-blue-700/80 hover:from-cyan-500/80 hover:to-blue-600/80 text-white text-sm rounded-sm transition-all duration-300 hover:shadow-[0_0_15px_rgba(96,204,247,0.3)]"
				href={environment.client.authSignUp}
			>
				<span className="relative overflow-hidden">
					<span className="relative z-10 text-xs">SIGN UP</span>
					<motion.span
						className="absolute inset-0 bg-white/20"
						animate={{ x: [-100, 100] }}
						transition={{
							repeat: Infinity,
							duration: 1.5,
							ease: "linear",
						}}
					/>
				</span>
			</Link> */}
		</div>
	);
}
