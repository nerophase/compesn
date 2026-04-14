// packages/db/src/index.ts
import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres, { type Sql } from "postgres";
import * as schema from "@compesn/shared/schemas";
import { env } from "@/environment";

export { schema };

export type DB = PostgresJsDatabase<typeof schema>;

let client: Sql | null = null;
let db: DB | null = null;

export function getDb(url = env.DATABASE_URL!) {
	if (!client) {
		client = postgres(url, {
			max: 5,
		});
	}
	if (!db) {
		db = drizzle(client, { schema });
	}
	return db;
}
