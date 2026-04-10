import Credentials from "next-auth/providers/credentials";
import NextAuth from "next-auth";
import Discord from "next-auth/providers/discord";
import { db } from "./database/db";
import { eq } from "drizzle-orm";
import { accounts, users } from "@compesn/shared/common/schemas";
import { checkPassword } from "@/utils/password";
import { getTokens } from "@/utils/auth";
import axios from "axios";
import { regionToPlatform } from "@/constants/regions";
import { env, ROUTES } from "@/environment/index";

const login = async (username: string, password: string) => {
	const user = await db.query.users.findFirst({
		where: eq(users.name, "ProCoach"),
	});
	if (!user) throw new Error("wrong username");
	// if (!(await checkPassword(password, user.password))) throw new Error("wrong password");
	const { accessToken, refreshToken } = getTokens(user.id, user.role);

	return {
		id: user.id,
		name: user.name,
		role: user.role,
		accessToken,
		refreshToken,
	};
};

const loginDiscord = async (
	accessToken: string | undefined,
	refreshToken: string | undefined,
	expiresAt: number | undefined,
	scope: string | undefined,
) => {
	const data = (
		await axios.get("https://discord.com/api/v10/users/@me", {
			headers: { Authorization: `Bearer ${accessToken}` },
		})
	).data;
	const account = await db.query.accounts.findFirst({
		where: eq(accounts.accountId, data.id),
		with: { user: true },
	});
	let user;
	if (account) user = account.user;
	else {
		user = (
			await db
				.insert(users)
				.values({
					name: data.username,
					email: data.email,
					emailVerified: true,
					image: `https://cdn.discordapp.com/avatars/${data.id}/${data.avatar}.png`,
				})
				.onConflictDoUpdate({
					target: users.email,
					set: { email: data.email, name: data.username },
				})
				.returning()
		)[0];
		await db
			.insert(accounts)
			.values({
				providerId: "discord",
				accountId: data.id,
				username: data.username,
				userId: user.id,
				accessToken: accessToken,
				refreshToken: refreshToken,
				accessTokenExpiresAt: new Date(expiresAt ?? 0 * 1000),
				scope,
			})
			.onConflictDoUpdate({
				target: accounts.accountId,
				set: {
					username: data.username,
					accessToken: accessToken,
					refreshToken: refreshToken,
					accessTokenExpiresAt: new Date(expiresAt ?? 0 * 1000),
					scope,
				},
			})
			.returning();
	}
	const { accessToken: token, refreshToken: refresh } = getTokens(user.id, user.role);

	return {
		id: user?.id,
		name: user.name,
		role: user.role,
		token,
		refresh,
	};
};

const loginRiot = async (
	accessToken: string | undefined,
	refreshToken: string | undefined,
	idToken: string | undefined,
	expiresAt: number | undefined,
	scope: string | undefined,
) => {
	const data = (
		await axios.get(
			`https://${regionToPlatform["NA1"]}.api.riotgames.com/riot/account/v1/accounts/me`,
			{
				headers: {
					Authorization: `Bearer ${accessToken}`,
				},
			},
		)
	).data;

	const userName = `${data.gameName}#${data.tagLine}`;

	const account = await db.query.accounts.findFirst({
		where: eq(accounts.accountId, data.puuid),
		with: { user: true },
	});

	let user;

	if (account) {
		user = account.user;
	} else {
		user = (
			await db
				.insert(users)
				.values({
					name: userName,
				})
				.onConflictDoUpdate({
					target: users.name,
					set: { name: userName },
				})
				.returning()
		)[0];

		await db
			.insert(accounts)
			.values({
				providerId: "riot",
				accountId: data.puuid,
				username: userName,
				userId: user.id,
				accessToken: accessToken,
				refreshToken: refreshToken,
				accessTokenExpiresAt: new Date(expiresAt ?? 0 * 1000),
				idToken: idToken,
				scope,
			})
			.onConflictDoUpdate({
				target: accounts.accountId,
				set: {
					username: userName,
					accessToken: accessToken,
					refreshToken: refreshToken,
					idToken: idToken,
					accessTokenExpiresAt: new Date(expiresAt ?? 0 * 1000),
					scope,
				},
			})
			.returning();
	}

	const { accessToken: token, refreshToken: refresh } = getTokens(user.id, user.role);

	return {
		id: user?.id,
		name: user.name,
		role: user.role,
		token,
		refresh,
	};
};

export const { handlers, signIn, signOut, auth } = NextAuth({
	providers: [
		Credentials({
			credentials: {
				username: { label: "Username", type: "text" },
				password: { label: "Password", type: "password" },
			},
			async authorize(credentials) {
				const response = await login(
					credentials.username as string,
					credentials.password as string,
				);

				const { id } = response;

				if (id) {
					return response;
				} else {
					return null;
				}
			},
		}),
		Discord({
			clientId: env.NEXT_PUBLIC_AUTH_DISCORD_ID,
			clientSecret: env.AUTH_DISCORD_SECRET,
		}),
		{
			id: "riot",
			name: "Riot",
			type: "oidc",
			issuer: ROUTES.riot.issuer,
			clientId: env.NEXT_PUBLIC_AUTH_RIOT_ID,
			clientSecret: env.AUTH_RIOT_SECRET,
			authorization: {
				params: {
					response_type: "code",
					scope: "openid cpid offline_access",
				},
			},
		},
	],
	callbacks: {
		async signIn({ account, profile }) {
			try {
				let resp;

				if (account?.provider === "discord") {
					resp = await loginDiscord(
						account?.access_token,
						account?.refresh_token,
						account?.expires_at,
						account?.scope,
					);
				} else if (account?.provider === "riot") {
					resp = await loginRiot(
						account?.access_token,
						account?.refresh_token,
						account?.id_token,
						account?.expires_at,
						account?.scope,
					);
				}

				if (profile) profile.token = resp;
			} catch (e) {
				console.error(e);
				return `${ROUTES.client.authLogin}?error=${
					account?.provider === "discord"
						? "DISCORD_ERROR"
						: account?.provider === "riot"
							? "RIOT_ERROR"
							: ""
				}`;
			}

			return true;
		},
		async session({ session, token }) {
			const sanitizedToken = Object.keys(token).reduce((p, c) => {
				// strip unnecessary properties
				if (c !== "iat" && c !== "exp" && c !== "jti" && c !== "apiToken") {
					return { ...p, [c]: token[c] };
				} else {
					return p;
				}
			}, {});
			return {
				...session,
				user: sanitizedToken,
				apiToken: token.apiToken,
			};
		},
		async jwt({ token, user, trigger, account, profile, session }) {
			if (account?.provider === "discord" || account?.provider === "riot") {
				try {
					return (profile?.token as any) || { id: "" };
				} catch {
					return {
						id: "",
					};
				}
			}

			if (trigger === "update") {
				return { ...token, name: session.user.name };
			}

			if (typeof user !== "undefined") {
				return user;
			}

			return token;
		},
	},
	pages: {
		signIn: ROUTES.client.authLogin,
		// error: environment.client.authError,
	},
});

declare module "next-auth" {
	interface Session {
		user: {
			id: string;
			name: string;
			role: string;
			accessToken: string;
			refreshToken: string;
		};
	}
}
