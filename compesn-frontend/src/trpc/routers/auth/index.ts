import { createTRPCRouter, baseProcedure, authenticatedProcedure } from "../../init";
import {
	AuthLoginSchema,
	AuthLoginDiscordSchema,
	AuthLoginRiotSchema,
	AuthRefreshTokenSchema,
	AuthForgotPasswordSchema,
	AuthResetPasswordSchema,
	AuthRegisterSchema,
	AuthRiotCallbackSchema,
} from "./auth.schema";
import { checkPassword, encryptPassword } from "../../../utils/password";
import { getTokens, verifyRefresh } from "../../../utils/auth";
import { sendEmail } from "../../../lib/resend";
import axios from "axios";
import { db } from "../../../lib/database/db";
import { and, eq } from "drizzle-orm";
import { regionToPlatform } from "@/constants/regions";
import { v4 } from "uuid";
import { signIn } from "next-auth/react";
import { env } from "@/environment";
import { users } from "@compesn/shared/common/schemas/users";
import { accounts } from "@compesn/shared/common/schemas/accounts";
import { verifications } from "@compesn/shared/common/schemas/verifications";

function generateResetPasswordEmail(userName: string, resetLink: string) {
	return `
    <h2>Reset Your Password</h2>
    <p>Hello ${userName},</p>
    <p>You have requested to reset your password. Click the link below to reset your password:</p>
    <p><a href="${resetLink}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Reset Password</a></p>
    <p>If you did not request this password reset, please ignore this email.</p>
    <p>This link will expire in 7 days.</p>
    <p>Best regards,<br>COMPESN Team</p>
  `;
}

export const authRouter = createTRPCRouter({
	login: baseProcedure.input(AuthLoginSchema).mutation(async ({ input }) => {
		const user = await db.query.users.findFirst({
			where: eq(users.name, input.username),
		});
		if (!user) throw new Error("wrong username");
		if (!(await checkPassword(input.password, user.password)))
			throw new Error("wrong password");
		const { accessToken, refreshToken } = getTokens(user.id, user.role);
		return {
			id: user.id,
			username: input.username,
			role: user.role,
			accessToken,
			refreshToken,
		};
	}),

	loginDiscord: baseProcedure.input(AuthLoginDiscordSchema).mutation(async ({ input }) => {
		const data = (
			await axios.get("https://discord.com/api/v10/users/@me", {
				headers: { Authorization: `Bearer ${input.access_token}` },
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
					accessToken: input.access_token,
					refreshToken: input.refresh_token,
					accessTokenExpiresAt: new Date(input.expires_at * 1000),
					scope: input.scope,
				})
				.onConflictDoUpdate({
					target: accounts.accountId,
					set: {
						username: data.username,
						accessToken: input.access_token,
						refreshToken: input.refresh_token,
						accessTokenExpiresAt: new Date(input.expires_at * 1000),
						scope: input.scope,
					},
				})
				.returning();
		}
		const { accessToken, refreshToken } = getTokens(user.id, user.role);
		return {
			id: user?.id,
			name: user.name,
			role: user.role,
			accessToken,
			refreshToken,
		};
	}),

	loginRiot: baseProcedure.input(AuthLoginRiotSchema).mutation(async ({ input }) => {
		const data = (
			await axios.get(
				`https://${regionToPlatform["NA1"]}.api.riotgames.com/riot/account/v1/accounts/me`,
				{
					headers: {
						Authorization: `Bearer ${input.access_token}`,
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
		if (account) user = account.user;
		else {
			user = (
				await db
					.insert(users)
					.values({ name: userName })
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
					accessToken: input.access_token,
					refreshToken: input.refresh_token,
					accessTokenExpiresAt: new Date(input.expires_at * 1000),
					idToken: input.id_token,
					scope: input.scope,
				})
				.onConflictDoUpdate({
					target: accounts.accountId,
					set: {
						username: userName,
						accessToken: input.access_token,
						refreshToken: input.refresh_token,
						idToken: input.id_token,
						accessTokenExpiresAt: new Date(input.expires_at * 1000),
						scope: input.scope,
					},
				})
				.returning();
		}
		const { accessToken, refreshToken } = getTokens(user.id, user.role);
		return {
			id: user?.id,
			name: user.name,
			role: user.role,
			accessToken,
			refreshToken,
		};
	}),

	refreshToken: baseProcedure.input(AuthRefreshTokenSchema).mutation(async ({ input }) => {
		const isValid = verifyRefresh(input.username, input.refreshToken);
		if (!isValid) throw new Error("invalid refresh token");

		const user = await db.query.users.findFirst({
			where: eq(users.name, input.username),
		});
		if (!user) throw new Error("no user found");

		const { accessToken } = getTokens(user.id, user.role);
		return { accessToken };
	}),

	register: baseProcedure.input(AuthRegisterSchema).mutation(async ({ input }) => {
		try {
			const encryptedPassword = await encryptPassword(input.password);
			const user = (
				await db
					.insert(users)
					.values({
						name: input.username,
						email: input.email,
						password: encryptedPassword,
						region: input.region,
					})
					.returning()
			)[0];

			signIn("credentials", {
				username: user.name,
				password: input.password,
				redirect: false,
			});

			return {
				id: user.id,
				username: user.name,
				email: user.email,
				region: user.region,
			};
		} catch (error: any) {
			if (error.code === "23505") {
				// PostgreSQL unique violation
				const detail = error.detail || "";
				if (detail.includes("name")) {
					throw new Error("Username already exists");
				} else if (detail.includes("email")) {
					throw new Error("Email already exists");
				}
				throw new Error("User with these credentials already exists");
			}
			throw new Error(error.message);
		}
	}),

	forgotPassword: baseProcedure.input(AuthForgotPasswordSchema).mutation(async ({ input }) => {
		const user = await db.query.users.findFirst({
			where: eq(users.email, input.email),
		});
		if (!user) throw new Error("No user found with this email");
		const code = v4();

		const date = new Date();
		date.setDate(date.getDate() + 7);
		await db.insert(verifications).values({
			identifier: input.email,
			value: code,
			expiresAt: date,
		});

		const resetLink = `${input.resetUrl}?code=${code}&email=${input.email}`;
		const emailHtml = generateResetPasswordEmail(user.name, resetLink);
		const emailSent = await sendEmail(input.email, "Reset Password", emailHtml);
		return { emailSent };
	}),

	resetPassword: baseProcedure.input(AuthResetPasswordSchema).mutation(async ({ input }) => {
		const correct = (await db.query.verifications.findFirst({
			where: and(
				eq(verifications.identifier, input.email),
				eq(verifications.value, input.code),
			),
		}))
			? true
			: false;

		if (!correct) throw new Error("Wrong email or code");
		const user = await db.query.users.findFirst({
			where: eq(users.email, input.email),
		});
		if (!user) throw new Error("No user found with this email");
		const encryptedPassword = await encryptPassword(input.password);
		await db.update(users).set({ password: encryptedPassword }).where(eq(users.id, user.id));
		return { correct };
	}),

	authenticatedUser: authenticatedProcedure.query(async ({ ctx }) => {
		return await db.query.users.findFirst({
			where: eq(users.id, ctx.user.id),
			with: {
				accounts: true,
				usersToTeams: {
					with: {
						team: true,
					},
				},
			},
		});
	}),

	startRiotAuth: authenticatedProcedure.mutation(async () => {
		const clientId = env.NEXT_PUBLIC_AUTH_RIOT_ID;
		const redirectUri = `${env.NEXT_PUBLIC_BASE_URL}/account/link`;
		const scope = "openid cpid offline_access";
		const responseType = "code";

		const authUrl = new URL("https://auth.riotgames.com/authorize");
		authUrl.searchParams.set("client_id", clientId!);
		authUrl.searchParams.set("redirect_uri", redirectUri);
		authUrl.searchParams.set("response_type", responseType);
		authUrl.searchParams.set("scope", scope);

		return { authUrl: authUrl.toString() };
	}),

	handleRiotAuthCallback: authenticatedProcedure
		.input(AuthRiotCallbackSchema)
		.mutation(async ({ input, ctx }) => {
			const clientId = env.NEXT_PUBLIC_AUTH_RIOT_ID;
			const clientSecret = env.AUTH_RIOT_SECRET;
			const redirectUri = `${env.NEXT_PUBLIC_BASE_URL}/account/link`;

			// Exchange code for access token
			const tokenResponse = await axios.post(
				"https://auth.riotgames.com/token",
				{
					grant_type: "authorization_code",
					code: input.code,
					redirect_uri: redirectUri,
				},
				{
					headers: {
						"Content-Type": "application/x-www-form-urlencoded",
					},
					auth: {
						username: clientId!,
						password: clientSecret!,
					},
				},
			);

			// Get user account data from Riot
			const accountResponse = await axios.get(
				"https://americas.api.riotgames.com/riot/account/v1/accounts/me",
				{
					headers: {
						Authorization: `Bearer ${tokenResponse.data.access_token}`,
					},
				},
			);

			const { puuid, gameName, tagLine } = accountResponse.data;

			// Update user record with Riot account data
			const updatedUser = await db
				.update(users)
				.set({
					puuid,
					riotGameName: gameName,
					riotTagLine: tagLine,
				})
				.where(eq(users.id, ctx.user.id))
				.returning();

			return {
				success: true,
				user: updatedUser[0],
				riotId: `${gameName}#${tagLine}`,
			};
		}),
});
