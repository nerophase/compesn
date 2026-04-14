import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "./lib/auth";
import { db } from "./lib/database/db";
import { eq } from "drizzle-orm";
import { users } from "@compesn/shared/schemas/users";

// Protected routes that require Riot account linking
const PROTECTED_ROUTES = [
	"/scrims/create",
	"/dashboard",
	"/teams",
	"/profile",
	"/settings",
	"/admin",
	"/accounts",
	"/draft",
	"/history",
];

// Routes that should be excluded from protection
const EXCLUDED_ROUTES = ["/", "/auth", "/account/link", "/api", "/_next", "/favicon.ico"];

function isProtectedRoute(pathname: string): boolean {
	return PROTECTED_ROUTES.some((route) => pathname.startsWith(route));
}

function isExcludedRoute(pathname: string): boolean {
	return EXCLUDED_ROUTES.some((route) => pathname.startsWith(route));
}

export default async function proxy(request: NextRequest) {
	const { pathname } = request.nextUrl;

	// Skip proxy for excluded routes
	if (isExcludedRoute(pathname)) {
		return NextResponse.next();
	}

	// Get session using NextAuth
	const session = await auth();

	// If no session and trying to access protected route, redirect to login
	if (!session?.user && isProtectedRoute(pathname)) {
		const loginUrl = new URL("/auth/login", request.url);
		loginUrl.searchParams.set("callbackUrl", pathname);
		return NextResponse.redirect(loginUrl);
	}

	// If user is authenticated and trying to access protected route
	if (session?.user && isProtectedRoute(pathname)) {
		try {
			// Check if user has linked Riot account and set primary region
			const user = await db.query.users.findFirst({
				where: eq(users.id, session.user.id),
			});

			if (!user) {
				const loginUrl = new URL("/auth/login", request.url);
				return NextResponse.redirect(loginUrl);
			}

			// Check if user has linked Riot account (puuid) and set primary region
			const needsRiotLink = !user.puuid;
			const needsRegion = !user.primaryRegion;

			if (needsRiotLink || needsRegion) {
				const linkUrl = new URL("/account/link", request.url);
				return NextResponse.redirect(linkUrl);
			}
		} catch (error) {
			console.error("Proxy error:", error);
			// On error, allow the request to continue to avoid breaking the app
			return NextResponse.next();
		}
	}

	return NextResponse.next();
}

export const config = {
	matcher: [
		/*
		 * Match all request paths except for the ones starting with:
		 * - api (API routes)
		 * - _next (Next.js internals, including dev HMR)
		 * - favicon.ico (favicon file)
		 */
		"/((?!api|_next|favicon.ico).*)",
	],
};
