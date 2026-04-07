import "server-only";
import { getDb } from "./index";
import { env } from "@/environment";

const globalForDb = globalThis as unknown as {
	__db?: ReturnType<typeof getDb>;
};

export const db = globalForDb.__db ?? getDb();

if (env.NODE_ENV !== "production") {
	globalForDb.__db = db; // prevent new connections on dev HMR
}
