import Navbar from "@/components/navbar/nav-bar";
import { Breadcrumb } from "@/components/breadcrumb";
import { Toaster } from "sonner";
import { FloatingChatButton } from "@/components/floating-chat-button";

export default function NavbarLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<div className="w-screen h-screen flex pt-16 bg-gradient-to-b from-[#070B14] via-[#0E1420] to-[#151F2E]">
			{/* HUD Borders */}
			<div className="absolute top-0 left-0 w-32 h-32 border-l-2 border-t-2  z-50 pointer-events-none" />
			<div className="absolute top-0 right-0 w-32 h-32 border-r-2 border-t-2  z-50 pointer-events-none" />
			<div className="absolute bottom-0 left-0 w-32 h-32 border-l-2 border-b-2  z-50 pointer-events-none" />
			<div className="absolute bottom-0 right-0 w-32 h-32 border-r-2 border-b-2  z-50 pointer-events-none" />
			<Navbar />
			<div className="w-full h-full overflow-y-auto overflow-x-hidden flex-1">
				{/* <div className="container mx-auto px-6 pt-6">
					<Breadcrumb />
				</div> */}
				{children}
			</div>
			{/* Floating Chat Button */}
			<FloatingChatButton />
		</div>
	);
}
