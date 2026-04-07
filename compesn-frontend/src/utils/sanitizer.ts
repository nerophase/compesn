import { Filter } from "bad-words";
import badWords from "@/constants/bad-words.json";

const filter = new Filter();
filter.addWords(...badWords);

export function cleanString(string: string) {
	return filter.clean(string);
}

export function isProfane(string: string) {
	return filter.isProfane(string);
}
