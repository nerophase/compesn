import { useContext } from "react";
import { DraftContext } from "@/context/draft-context";

export default function useDraft() {
	const consumer = useContext(DraftContext);

	if (!consumer) {
		throw new Error("useDraft must be used within a DraftContext");
	}

	return consumer;
}
