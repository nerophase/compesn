import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "@compesn/shared/schemas";
import postgres from "postgres";
import { env } from "@/environment";

const client = postgres(env.DATABASE_URL);
export const db = drizzle(client, { schema });
