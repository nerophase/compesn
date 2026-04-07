"use client";

import {
	Settings,
	ShieldUserIcon,
	UsersIcon,
	UserCogIcon,
	UserIcon,
	SettingsIcon,
	SwordsIcon,
	MessageSquareIcon,
} from "lucide-react";

import {
	Sidebar,
	SidebarContent,
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarHeader,
	SidebarFooter,
} from "@/components/ui/sidebar";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import { ROUTES } from "@/environment";

// Navigation items
const userItems = [
	{
		title: "Accounts",
		url: ROUTES.client.accounts,
		icon: UserCogIcon,
	},
	{
		title: "Teams",
		url: ROUTES.client.teams,
		icon: UsersIcon,
	},
	{
		title: "Scrims",
		url: ROUTES.client.scrims,
		icon: SwordsIcon,
	},
	{
		title: "Messages",
		url: ROUTES.client.messages,
		icon: MessageSquareIcon,
	},
	{
		title: "Settings",
		url: ROUTES.client.settings,
		icon: SettingsIcon,
	},
];

const adminItems = [
	{
		title: "Champions",
		url: ROUTES.client.adminChampions,
		icon: ShieldUserIcon,
	},
];

export function AppSidebar() {
	const pathname = usePathname();
	const session = useSession();

	return (
		<Sidebar variant="floating">
			{/* <SidebarHeader>
				<div className="flex items-center gap-2 px-4 py-2">
					<div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
						<Shield className="h-4 w-4" />
					</div>
					<div className="flex flex-col">
						<span className="font-semibold">Dashboard</span>
						<span className="text-xs text-muted-foreground">
							v1.0.0
						</span>
					</div>
				</div>
			</SidebarHeader> */}
			<SidebarContent className="m-1">
				<SidebarGroup>
					<SidebarGroupLabel>Personal</SidebarGroupLabel>
					<SidebarGroupContent>
						<SidebarMenu>
							{userItems.map((item) => (
								<SidebarMenuItem key={item.title}>
									<SidebarMenuButton asChild isActive={pathname === item.url}>
										<Link href={item.url}>
											<item.icon className="h-4 w-4" />
											<span>{item.title}</span>
										</Link>
									</SidebarMenuButton>
								</SidebarMenuItem>
							))}
						</SidebarMenu>
					</SidebarGroupContent>
				</SidebarGroup>

				{session.data?.user.role === "admin" && (
					<SidebarGroup>
						<SidebarGroupLabel>Administration</SidebarGroupLabel>
						<SidebarGroupContent>
							<SidebarMenu>
								{adminItems.map((item) => (
									<SidebarMenuItem key={item.title}>
										<SidebarMenuButton asChild isActive={pathname === item.url}>
											<Link href={item.url}>
												<item.icon className="h-4 w-4" />
												<span>{item.title}</span>
											</Link>
										</SidebarMenuButton>
									</SidebarMenuItem>
								))}
							</SidebarMenu>
						</SidebarGroupContent>
					</SidebarGroup>
				)}
			</SidebarContent>

			{/* <SidebarFooter>
				<SidebarMenu>
					<SidebarMenuItem>
						<SidebarMenuButton
							asChild
							isActive={pathname === "/settings"}
						>
							<Link href="/settings">
								<Settings className="h-4 w-4" />
								<span>Settings</span>
							</Link>
						</SidebarMenuButton>
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarFooter> */}
		</Sidebar>
	);
}
