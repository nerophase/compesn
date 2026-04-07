import { defineConfig } from "drizzle-kit";
import "dotenv/config";

export default defineConfig({
	schema: "src/common/schemas",
	out: "migrations",
	dialect: "postgresql",
	dbCredentials: {
		url: process.env.DATABASE_URL!,
	},
	verbose: true,
});
