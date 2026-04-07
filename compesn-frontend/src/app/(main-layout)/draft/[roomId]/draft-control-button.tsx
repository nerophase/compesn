import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";
import { ReactElement } from "react";

export default function DraftControlButton({
	Icon,
	onClick,
}: {
	Icon: LucideIcon;
	onClick: () => void;
}) {
	return (
		<motion.button
			whileHover={{ scale: 1.05 }}
			whileTap={{ scale: 0.95 }}
			onClick={() => onClick()}
			className="bg-gray-700/50 hover:bg-gray-600/50 backdrop-blur-md border border-gray-600/30 text-white rounded-lg transition-all duration-200 w-8 h-8 flex items-center justify-center"
		>
			<Icon size={14} />
		</motion.button>
	);
}
