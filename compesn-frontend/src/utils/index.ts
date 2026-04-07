import { TDraft } from "@compesn/shared/common/types/draft";
import { TTeamColor } from "@compesn/shared/common/types/team-color";

export function getTeam(teamId: string | undefined, draft: TDraft): TTeamColor | undefined {
	return teamId === draft.blue.id ? "blue" : teamId === draft.red.id ? "red" : undefined;
}

export function getCurrentDate() {
	const today = new Date();
	const yyyy = today.getFullYear();
	let mm: string | number = today.getMonth() + 1; // Months start at 0!
	let dd: string | number = today.getDate();

	if (dd < 10) dd = "0" + dd;
	if (mm < 10) mm = "0" + mm;

	return dd + "/" + mm + "/" + yyyy;
}
