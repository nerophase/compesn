import useDraft from "@/hooks/use-draft";

export default function DraftTab() {
	const { room } = useDraft();
	const draftIteratorList = Array.from(Array(room.draftsCount).keys());

	return (
		<div className="flex-1 p-3 text-xs overflow-y-auto">
			<div className="space-y-3">
				<div className="text-gray-300 font-medium">Recent Drafts</div>
				<div className="space-y-2">
					{draftIteratorList.map((draftIdx) => {
						const disabled = draftIdx > room.currentDraft;

						return (
							<div className="p-2 bg-gray-800/30 rounded-md" key={draftIdx}>
								<div className="flex justify-between items-center mb-1">
									<span className="text-white font-medium">
										Draft #{draftIdx + 1}
									</span>
									{/* <span className="text-gray-400">
										2 hours ago
									</span> */}
								</div>
								{!disabled && (
									<>
										<div className="text-gray-400">
											Blue:{" "}
											{room.drafts[draftIdx].blue.pick
												.map((pick) => pick?.name)
												.join(", ")}
										</div>
										<div className="text-gray-400">
											Red:{" "}
											{room.drafts[draftIdx].red.pick
												.map((pick) => pick?.name)
												.join(", ")}
										</div>
									</>
								)}
							</div>
						);
					})}
				</div>
			</div>
		</div>
	);
}
