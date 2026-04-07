import { z } from "zod";

export const AuthLoginSchema = z.object({
	username: z.string(),
	password: z.string(),
});

export const AuthLoginDiscordSchema = z.object({
	access_token: z.string(),
	refresh_token: z.string().optional(),
	expires_at: z.number(),
	scope: z.string().optional(),
});

export const AuthLoginRiotSchema = z.object({
	access_token: z.string(),
	refresh_token: z.string().optional(),
	id_token: z.string().optional(),
	expires_at: z.number(),
	scope: z.string().optional(),
});

export const AuthRefreshTokenSchema = z.object({
	username: z.string(),
	refreshToken: z.string(),
});

export const AuthForgotPasswordSchema = z.object({
	email: z.string().email(),
	resetUrl: z.string().url(),
});

export const AuthResetPasswordSchema = z.object({
	email: z.string().email(),
	code: z.string(),
	password: z.string().min(8),
});

export const AuthRegisterSchema = z.object({
	username: z.string().max(15),
	email: z.string().email(),
	password: z.string().min(8),
	region: z.string(),
});

export const AuthRiotCallbackSchema = z.object({
	code: z.string(),
});
