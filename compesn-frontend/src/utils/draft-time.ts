/**
 * Client-side draft time utilities
 * These functions can be safely used in client components
 */

/**
 * Get the remaining time in milliseconds for a draft
 */
export const getDraftTimeRemaining = (expiresAt: Date): number => {
	const now = new Date();
	const remaining = expiresAt.getTime() - now.getTime();
	return Math.max(0, remaining);
};

/**
 * Check if a draft has expired
 */
export const isDraftExpired = (expiresAt: Date): boolean => {
	return new Date() > expiresAt;
};

/**
 * Get formatted time remaining string (e.g., "5:30", "0:45")
 */
export const formatTimeRemaining = (milliseconds: number): string => {
	const totalSeconds = Math.floor(milliseconds / 1000);
	const minutes = Math.floor(totalSeconds / 60);
	const seconds = totalSeconds % 60;

	return `${minutes}:${seconds.toString().padStart(2, "0")}`;
};
