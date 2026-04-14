import type { AppRouter } from "@/trpc/routers/_app";

export type QueueDraft = Awaited<ReturnType<AppRouter["drafts"]["getById"]>>;
export type QueueDraftTeam = QueueDraft["blueTeam"];
export type QueueDraftMember = QueueDraftTeam["members"][number];
export type QueueDraftSide = "BLUE" | "RED";
export type QueueDraftActionType = "PICK" | "BAN";

export interface QueueDraftUpdatePayload {
	action?: {
		team: QueueDraftSide;
		type: QueueDraftActionType;
	};
}

export interface QueueDraftCompletedPayload {
	draftId?: string;
}
