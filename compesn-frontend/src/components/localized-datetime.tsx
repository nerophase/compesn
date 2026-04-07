"use client";

import { useEffect, useState } from "react";

interface LocalizedDateTimeProps {
	date: Date | string;
	options?: Intl.DateTimeFormatOptions;
	className?: string;
	fallback?: string;
}

/**
 * A component that displays dates and times in the user's local timezone
 * Accepts UTC dates and formats them using the browser's Intl.DateTimeFormat API
 */
export function LocalizedDateTime({
	date,
	options = {
		dateStyle: "medium",
		timeStyle: "short",
	},
	className,
	fallback = "Invalid date",
}: LocalizedDateTimeProps) {
	const [formattedDate, setFormattedDate] = useState<string>("");
	const [isClient, setIsClient] = useState(false);

	useEffect(() => {
		setIsClient(true);

		try {
			const dateObj = typeof date === "string" ? new Date(date) : date;

			if (isNaN(dateObj.getTime())) {
				setFormattedDate(fallback);
				return;
			}

			const formatted = new Intl.DateTimeFormat(undefined, options).format(dateObj);
			setFormattedDate(formatted);
		} catch (error) {
			console.error("Error formatting date:", error);
			setFormattedDate(fallback);
		}
	}, [date, options, fallback]);

	// Show loading state on server-side render to prevent hydration mismatch
	if (!isClient) {
		return <span className={className}>Loading...</span>;
	}

	return <span className={className}>{formattedDate}</span>;
}

/**
 * Utility function to format dates in the user's local timezone
 * Can be used in non-component contexts
 */
export function formatLocalDateTime(
	date: Date | string,
	options: Intl.DateTimeFormatOptions = {
		dateStyle: "medium",
		timeStyle: "short",
	},
): string {
	try {
		const dateObj = typeof date === "string" ? new Date(date) : date;

		if (isNaN(dateObj.getTime())) {
			return "Invalid date";
		}

		return new Intl.DateTimeFormat(undefined, options).format(dateObj);
	} catch (error) {
		console.error("Error formatting date:", error);
		return "Invalid date";
	}
}

/**
 * Utility function to format dates with timezone abbreviation
 * Always includes timezone abbreviation for clarity
 */
export function formatLocalDateTimeWithTimezone(
	date: Date | string,
	options: Intl.DateTimeFormatOptions = {
		dateStyle: "medium",
		timeStyle: "short",
	},
): string {
	try {
		const dateObj = typeof date === "string" ? new Date(date) : date;

		if (isNaN(dateObj.getTime())) {
			return "Invalid date";
		}

		// Ensure timezone is included
		const optionsWithTimezone = {
			...options,
			timeZoneName: "short" as const,
		};

		return new Intl.DateTimeFormat(undefined, optionsWithTimezone).format(dateObj);
	} catch (error) {
		console.error("Error formatting date with timezone:", error);
		return "Invalid date";
	}
}

/**
 * Get the user's current timezone abbreviation
 */
export function getUserTimezone(): string {
	try {
		const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
		const now = new Date();
		const formatter = new Intl.DateTimeFormat(undefined, {
			timeZoneName: "short",
			timeZone: timezone,
		});

		const parts = formatter.formatToParts(now);
		const timeZonePart = parts.find((part) => part.type === "timeZoneName");

		return timeZonePart?.value || timezone;
	} catch (error) {
		console.error("Error getting timezone:", error);
		return "UTC";
	}
}

/**
 * Utility function to get relative time (e.g., "2 hours ago", "in 3 days")
 */
export function formatRelativeTime(date: Date | string): string {
	try {
		const dateObj = typeof date === "string" ? new Date(date) : date;

		if (isNaN(dateObj.getTime())) {
			return "Invalid date";
		}

		const now = new Date();
		const diffInSeconds = Math.floor((dateObj.getTime() - now.getTime()) / 1000);

		// Use Intl.RelativeTimeFormat for better localization
		const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });

		const absDiff = Math.abs(diffInSeconds);

		if (absDiff < 60) {
			return rtf.format(diffInSeconds, "second");
		} else if (absDiff < 3600) {
			return rtf.format(Math.floor(diffInSeconds / 60), "minute");
		} else if (absDiff < 86400) {
			return rtf.format(Math.floor(diffInSeconds / 3600), "hour");
		} else if (absDiff < 2592000) {
			return rtf.format(Math.floor(diffInSeconds / 86400), "day");
		} else if (absDiff < 31536000) {
			return rtf.format(Math.floor(diffInSeconds / 2592000), "month");
		} else {
			return rtf.format(Math.floor(diffInSeconds / 31536000), "year");
		}
	} catch (error) {
		console.error("Error formatting relative time:", error);
		return "Invalid date";
	}
}

/**
 * Component for displaying relative time with automatic updates
 */
export function RelativeTime({
	date,
	className,
	updateInterval = 60000, // Update every minute by default
}: {
	date: Date | string;
	className?: string;
	updateInterval?: number;
}) {
	const [relativeTime, setRelativeTime] = useState<string>("");
	const [isClient, setIsClient] = useState(false);

	useEffect(() => {
		setIsClient(true);

		const updateTime = () => {
			setRelativeTime(formatRelativeTime(date));
		};

		updateTime();

		const interval = setInterval(updateTime, updateInterval);

		return () => clearInterval(interval);
	}, [date, updateInterval]);

	if (!isClient) {
		return <span className={className}>Loading...</span>;
	}

	return <span className={className}>{relativeTime}</span>;
}
