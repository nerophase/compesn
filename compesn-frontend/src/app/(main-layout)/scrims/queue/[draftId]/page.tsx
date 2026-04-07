import { Suspense } from "react";
import { DraftPageClient } from "./draft-page-client";
import LoaderSpin from "@/components/loader-spin";

interface DraftPageProps {
	params: Promise<{ draftId: string }>;
}

export default async function DraftPage({ params }: DraftPageProps) {
	const { draftId } = await params;

	return (
		<div className="min-h-screen bg-background">
			<Suspense
				fallback={
					<div className="flex items-center justify-center min-h-screen">
						<LoaderSpin />
					</div>
				}
			>
				<DraftPageClient draftId={draftId} />
			</Suspense>
		</div>
	);
}
