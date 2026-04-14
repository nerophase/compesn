import type { NextRequest } from "next/server";
import { redirect } from "next/navigation";
import axios from "axios";
import { db } from "@/lib/database/db";
import { accounts } from "@compesn/shared/schemas";
import { eq, and } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { env, ROUTES } from "@/environment/index";

export async function GET(request: NextRequest) {
	try {
		const { searchParams } = new URL(request.url);
		const code = searchParams.get("code");
		const session = await auth();

		if (!code) {
			return redirect(`${ROUTES.client.accounts}?error=NO_CODE`);
		}

		if (!session?.user?.id) {
			return redirect(`${ROUTES.client.authLogin}?error=NOT_AUTHENTICATED`);
		}

		// Exchange code for access token with Riot Games
		const tokenResponse = await axios.post(
			ROUTES.riot.token,
			{
				grant_type: "authorization_code",
				code,
				redirect_uri: `${env.NEXT_PUBLIC_BASE_URL}/api/socials/riot`,
			},
			{
				headers: {
					"Content-Type": "application/x-www-form-urlencoded",
					"Authorization": `Basic ${Buffer.from(
						`${env.NEXT_PUBLIC_AUTH_RIOT_ID}:${env.AUTH_RIOT_SECRET}`,
					).toString("base64")}`,
				},
			},
		);

		const { access_token, refresh_token, id_token, expires_in, scope } = tokenResponse.data;

		// Get Riot user info using the access token
		const riotUserResponse = await axios.get(ROUTES.riot.userInfo, {
			headers: {
				Authorization: `Bearer ${access_token}`,
			},
		});

		const riotUser = riotUserResponse.data;
		const riotUsername = `${riotUser.gameName}#${riotUser.tagLine}`;

		// Check if this Riot account is already linked to any user
		const existingAccount = await db.query.accounts.findFirst({
			where: eq(accounts.accountId, riotUser.puuid),
			with: { user: true },
		});

		if (existingAccount) {
			if (existingAccount.userId === session.user.id) {
				// Update existing account with new tokens
				const expiresAt = new Date();
				expiresAt.setSeconds(expiresAt.getSeconds() + expires_in);

				await db
					.update(accounts)
					.set({
						username: riotUsername,
						accessToken: access_token,
						refreshToken: refresh_token,
						idToken: id_token,
						accessTokenExpiresAt: expiresAt,
						scope: scope,
					})
					.where(eq(accounts.id, existingAccount.id));
			} else {
				return redirect(`${ROUTES.client.accounts}?error=RIOT_ALREADY_LINKED`);
			}
		} else {
			// Check if current user already has a Riot account linked
			const userRiotAccount = await db.query.accounts.findFirst({
				where: and(eq(accounts.userId, session.user.id), eq(accounts.providerId, "riot")),
			});

			if (userRiotAccount) {
				return redirect(`${ROUTES.client.accounts}?error=USER_ALREADY_HAS_RIOT`);
			}

			// Create new account link
			const expiresAt = new Date();
			expiresAt.setSeconds(expiresAt.getSeconds() + expires_in);

			await db.insert(accounts).values({
				providerId: "riot",
				accountId: riotUser.puuid,
				username: riotUsername,
				userId: session.user.id,
				accessToken: access_token,
				refreshToken: refresh_token,
				idToken: id_token,
				accessTokenExpiresAt: expiresAt,
				scope: scope,
			});
		}

		return redirect(`${ROUTES.client.accounts}?success=RIOT_LINKED`);
	} catch (error) {
		console.error("Riot OAuth error:", error);

		if (axios.isAxiosError(error)) {
			if (error.response?.status === 400) {
				return redirect(`${ROUTES.client.accounts}?error=INVALID_CODE`);
			}
			if (error.response?.status === 401) {
				return redirect(`${ROUTES.client.accounts}?error=RIOT_AUTH_FAILED`);
			}
			if (error.response?.status === 403) {
				return redirect(`${ROUTES.client.accounts}?error=RIOT_FORBIDDEN`);
			}
		}

		return redirect(`${ROUTES.client.accounts}?error=RIOT_ERROR`);
	}
}
