import { AppSidebar } from "@/components/app-sidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function Layout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	const session = await auth();

	if (!session?.user) {
		redirect("/auth/login");
	}

	return (
		<SidebarProvider>
			<AppSidebar />
			<main className="w-full h-full relative flex justify-center">
				<SidebarTrigger className="absolute top-0 left-0 hover:bg-transparent z-50" />
				<div className="w-full h-full relative overflow-y-auto px-16 pt-4 flex justify-center">
					<div className="max-w-6xl w-full">{children}</div>
				</div>
			</main>
		</SidebarProvider>
	);
}
