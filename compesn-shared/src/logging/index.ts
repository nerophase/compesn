type ErrorContext = Record<string, unknown> | undefined;

export const logError = (scope: string, error: unknown, context?: ErrorContext) => {
	console.error(`[${scope}]`, error, context ?? {});
};
