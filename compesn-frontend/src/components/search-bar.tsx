import Image from "next/image";
import { Dispatch, SetStateAction } from "react";
import { cn } from "@/lib/utils";

export default function SearchBar({
	search,
	setSearch,
	draftMode = true,
}: {
	search: string;
	setSearch: Dispatch<SetStateAction<string>>;
	draftMode?: boolean;
}) {
	return (
		// max-w-96
		<div
			className={cn(
				"border border-text_primary w-full h-12 p-2 flex rounded-md mr-2",
				draftMode && "ml-1",
			)}
		>
			<Image
				src="/imgs/search_icon.svg"
				alt="search icon"
				width={20}
				height={20}
				className="h-full w-auto mr-2"
			/>
			<input
				type="text"
				name=""
				id=""
				className="w-full bg-transparent outline-none text-text_primary"
				placeholder="Search"
				onChange={(e) => setSearch(e.target.value)}
				value={search}
			/>
		</div>
	);
}
