import ScrimDetailPage from "./page-client";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
	const { id } = await params;

	return <ScrimDetailPage scrimId={id} />;
}
