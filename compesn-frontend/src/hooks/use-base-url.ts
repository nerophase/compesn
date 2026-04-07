"use client";

import { usePathname } from "next/navigation";

export const useBaseUrl = () => {
	const pathname = usePathname();

	if (typeof window === "undefined") return "";

	const baseUrl = window.location.origin;
	const staticPath = pathname.split("?")[0];

	return `${baseUrl}${staticPath}`;
};
