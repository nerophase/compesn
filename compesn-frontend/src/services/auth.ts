// Legacy auth service - kept for compatibility but should be migrated to tRPC
export async function login(username: string, password: string) {
	// This would typically call your backend auth endpoint
	// For now, this is a placeholder that returns the expected structure
	throw new Error("Login should be handled through NextAuth credentials provider");
}
