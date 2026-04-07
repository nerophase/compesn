import "dotenv/config";
import { getDb, schema } from "./index";

const db = getDb();

async function clearSeedData() {
	console.log("🧹 Clearing seed data from database...");

	try {
		// Delete in order to respect foreign key constraints
		console.log("Deleting scrim participants...");
		await db.delete(schema.scrimParticipants);

		console.log("Deleting scrim drafts...");
		await db.delete(schema.scrimDrafts);

		console.log("Deleting scrims...");
		await db.delete(schema.scrims);

		console.log("Deleting team invites...");
		await db.delete(schema.teamInvites);

		console.log("Deleting team members...");
		await db.delete(schema.teamMembers);

		console.log("Deleting teams...");
		await db.delete(schema.teams);

		console.log("Deleting users...");
		await db.delete(schema.users);

		console.log("\n✅ All seed data cleared successfully!");
		console.log("\nYou can now run: pnpm db:seed");
	} catch (error) {
		console.error("❌ Error clearing seed data:", error);
		throw error;
	} finally {
		process.exit(0);
	}
}

// Run the clear function
clearSeedData();
