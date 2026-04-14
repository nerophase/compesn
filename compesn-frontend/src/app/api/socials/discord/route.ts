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

		// Exchange code for access token
		const tokenResponse = await axios.post(
			"https://discord.com/api/v10/oauth2/token",
			{
				grant_type: "authorization_code",
				code,
				redirect_uri: `${env.NEXT_PUBLIC_BASE_URL}/api/socials/discord`,
			},
			{
				headers: {
					"Content-Type": "application/x-www-form-urlencoded",
				},
				auth: {
					username: env.NEXT_PUBLIC_AUTH_DISCORD_ID,
					password: env.AUTH_DISCORD_SECRET,
				},
			},
		);

		// Get Discord user info
		const discordUserResponse = await axios.get("https://discord.com/api/v10/users/@me", {
			headers: {
				Authorization: `Bearer ${tokenResponse.data.access_token}`,
			},
		});

		const discordUser = discordUserResponse.data;

		// Check if this Discord account is already linked to any user
		const existingAccount = await db.query.accounts.findFirst({
			where: eq(accounts.accountId, discordUser.id),
			with: { user: true },
		});

		if (existingAccount) {
			if (existingAccount.userId === session.user.id) {
				// Update existing account with new tokens
				const expiresAt = new Date();
				expiresAt.setSeconds(expiresAt.getSeconds() + tokenResponse.data.expires_in);

				await db
					.update(accounts)
					.set({
						username: discordUser.username,
						accessToken: tokenResponse.data.access_token,
						refreshToken: tokenResponse.data.refresh_token,
						accessTokenExpiresAt: expiresAt,
						scope: tokenResponse.data.scope,
					})
					.where(eq(accounts.id, existingAccount.id));
			} else {
				return redirect(`${ROUTES.client.accounts}?error=DISCORD_ALREADY_LINKED`);
			}
		} else {
			// Check if current user already has a Discord account linked
			const userDiscordAccount = await db.query.accounts.findFirst({
				where: and(
					eq(accounts.userId, session.user.id),
					eq(accounts.providerId, "discord"),
				),
			});

			if (userDiscordAccount) {
				return redirect(`${ROUTES.client.accounts}?error=USER_ALREADY_HAS_DISCORD`);
			}

			// Create new account link
			const expiresAt = new Date();
			expiresAt.setSeconds(expiresAt.getSeconds() + tokenResponse.data.expires_in);

			await db.insert(accounts).values({
				providerId: "discord",
				accountId: discordUser.id,
				username: discordUser.username,
				userId: session.user.id,
				accessToken: tokenResponse.data.access_token,
				refreshToken: tokenResponse.data.refresh_token,
				accessTokenExpiresAt: expiresAt,
				scope: tokenResponse.data.scope,
			});
		}

		return redirect(`${ROUTES.client.accounts}?success=DISCORD_LINKED`);
	} catch (error) {
		console.error("Discord OAuth error:", error);

		if (axios.isAxiosError(error)) {
			if (error.response?.status === 400) {
				return redirect(`${ROUTES.client.accounts}?error=INVALID_CODE`);
			}
			if (error.response?.status === 401) {
				return redirect(`${ROUTES.client.accounts}?error=DISCORD_AUTH_FAILED`);
			}
		}

		return redirect(`${ROUTES.client.accounts}?error=DISCORD_ERROR`);
	}
}
