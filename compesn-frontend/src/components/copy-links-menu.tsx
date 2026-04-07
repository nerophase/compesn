import React, { useCallback } from "react";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Link } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

export function CopyLinksMenu({
	guestLink,
	tournamentCode,
}: {
	guestLink: string;
	tournamentCode: string;
}) {
	const handleCopy = useCallback((link: string, toastText: string) => {
		if (navigator.clipboard) {
			navigator.clipboard.writeText(link);
			toast.success(toastText);
		}
	}, []);

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<motion.button
					whileHover={{ scale: 1.05 }}
					whileTap={{ scale: 0.95 }}
					className="bg-gray-700/50 hover:bg-gray-600/50 backdrop-blur-md border border-gray-600/30 text-white rounded-lg transition-all duration-200 w-8 h-8 flex items-center justify-center"
				>
					<Link size={14} />
				</motion.button>
			</DropdownMenuTrigger>
			<DropdownMenuContent className=" p-2 mr-2 mt-2">
				<DropdownMenuItem
					onClick={() => handleCopy(guestLink, "Draft Link copied to clipboard")}
				>
					Draft Link
				</DropdownMenuItem>
				<div className="w-full px-2 py-1">
					<div className="w-full border border-b-[#444]"></div>
				</div>
				<DropdownMenuItem
					onClick={() =>
						handleCopy(tournamentCode, "Tournament Code copied to clipboard")
					}
				>
					Tournament Code
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
