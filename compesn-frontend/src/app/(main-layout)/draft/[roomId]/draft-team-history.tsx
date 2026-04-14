import { cn } from "@/lib/utils";
import { TTeamColor } from "@compesn/shared/common/types/team-color";
import { HistoryIcon } from "lucide-react";
import Image from "next/image";
import { getChampionImage } from "@/utils/champions";
import { TDraft } from "@compesn/shared/common/types/draft";

export default function DraftTeamHistory({
	teamColor,
	teamId,
	drafts,
}: {
	teamColor: TTeamColor;
	teamId: string;
	drafts: TDraft[];
}) {
	const team = teamColor === "blue" ? "Blue" : "Red";

	return (
		<div className="col-span-2 h-full flex flex-col overflow-y-auto">
			<div
				className={cn(
					"bg-black/20 backdrop-blur-xl border rounded-2xl shadow-2xl overflow-y-auto h-full flex flex-col",
					teamColor === "blue" ? "border-blue-500/20" : "border-red-500/20",
				)}
			>
				<div
					className={cn(
						"bg-linear-to-r backdrop-blur-md p-2 border-b ",
						teamColor === "blue"
							? "from-blue-600/30 to-blue-500/30 border-blue-400/20"
							: "from-red-600/30 to-red-500/30 border-red-400/20",
					)}
				>
					<div className="flex items-center gap-2">
						<HistoryIcon
							className={cn(teamColor === "blue" ? "text-blue-400" : "text-red-400")}
							size={14}
						/>
						<span className="font-bold text-xs">{team} History</span>
					</div>
				</div>
				<div className="p-2 space-y-2 flex-1 overflow-y-auto flex flex-col h-full">
					{drafts.map((draft, draftIndex) => (
						<div key={draftIndex} className="space-y-1">
							<div
								className={cn(
									"text-xs font-medium",
									teamColor === "blue" ? "text-blue-400" : "text-red-400",
								)}
							>
								Draft {draftIndex + 1}
							</div>
							<div className="grid grid-cols-1 gap-1">
								{[0, 1, 2, 3, 4].map((index) => {
									const team: TTeamColor =
										draft.blue.id === teamId ? "blue" : "red";

									const champion = draft[team].pick[index];

									return (
										<div
											key={index}
											className="bg-gray-800/30 backdrop-blur-md border border-gray-700/30 rounded-md p-1 flex items-center gap-2"
										>
											<div className="w-5 h-5 rounded overflow-hidden shrink-0 bg-background">
												{champion && champion.fileName && (
													<Image
														src={getChampionImage(
															champion?.fileName || "",
														)}
														alt={champion?.name || ""}
														width={380}
														height={380}
														className="w-full h-full object-cover"
													/>
												)}
											</div>
											<div className="text-xs text-white truncate">
												{champion?.name ? (
													<span>{champion.name}</span>
												) : (
													<span className="text-gray-500">{`Pick ${
														index + 1
													}`}</span>
												)}
											</div>
										</div>
									);
								})}
							</div>
						</div>
					))}
				</div>
			</div>
		</div>
	);
}
