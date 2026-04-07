const normalizeIdentifier = (value: string | null | undefined) => value?.trim() || "";

export const isAuthBypassEnabled = (nodeEnv: string, enabledFlag: boolean) =>
	nodeEnv !== "production" && enabledFlag;

export const resolveAuthBypassIdentifier = (
	submittedUsername: string,
	defaultIdentifier?: string,
) => normalizeIdentifier(submittedUsername) || normalizeIdentifier(defaultIdentifier);
