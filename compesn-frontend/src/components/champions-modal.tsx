"use client";

import { useState } from "react";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import ChampionSelector from "@/components/champion-selector";
import { Shield, X } from "lucide-react";
import { TChampion } from "@compesn/shared/common/types/champion";

interface ChampionsModalProps {
	children: React.ReactNode;
	champions: TChampion[];
	disabledChampions: TChampion[];
	onChampionSelect: (champion: TChampion) => void;
	blocked?: boolean;
}

export default function ChampionsModal({
	children,
	champions,
	disabledChampions,
	onChampionSelect,
	blocked = false,
}: ChampionsModalProps) {
	const [open, setOpen] = useState(false);

	if (blocked) {
		return <>{children}</>;
	}

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>{children}</DialogTrigger>
			<DialogContent
				className="max-h-[80vh] bg-slate-900/95 backdrop-blur-xl border border-white/10"
				style={{ maxWidth: "56rem" }}
			>
				<DialogHeader className="space-y-4 pb-4">
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-3">
							<div className="p-2 rounded-full bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-purple-500/30">
								<Shield className="w-5 h-5 text-purple-400" />
							</div>
							<DialogTitle className="text-xl font-semibold text-white">
								Select Champions to Disable
							</DialogTitle>
						</div>
					</div>
				</DialogHeader>

				<div className="flex-1 overflow-hidden">
					<div className="h-[500px] bg-slate-800/30 backdrop-blur-sm border border-white/10 rounded-lg p-4">
						<ChampionSelector
							className="h-full"
							canSelect={true}
							mode="DISABLE_CHAMPIONS"
							champions={champions}
							cursorOnDisabledChampions={true}
							disabledChampions={disabledChampions}
							onChampionSelect={(champion: TChampion) => {
								onChampionSelect(champion);
							}}
						/>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
