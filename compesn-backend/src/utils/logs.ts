import { env } from "@/environment";
import fs from "fs";

export const compesnLog = (text: string) => {
	try {
		const log = `[${new Date().toLocaleString([], {
			day: "2-digit",
			month: "2-digit",
			year: "2-digit",
			hour: "2-digit",
			minute: "2-digit",
			second: "2-digit",
		})}] ${text}\n`;
		fs.appendFileSync(env.LOGS_FILE_PATH, log);
	} catch (error) {
		console.error(error);
	}
};
