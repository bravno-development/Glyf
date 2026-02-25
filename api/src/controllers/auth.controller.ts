import type { Request, Response } from "../../imports.ts";
import { create } from "../../imports.ts";
import { query } from "../config/database.ts";
import { sendMagicLinkEmail } from "../services/email.ts";
import type { AuthResponse } from "../models/types.ts";

const JWT_SECRET = Deno.env.get("JWT_SECRET") || "change_me_in_production";
const MAGIC_LINK_EXPIRY_MINUTES = 15;
const REFRESH_TOKEN_TTL_DAYS = 14;

async function generateAccessToken(userId: string): Promise<string> {
	const key = await crypto.subtle.importKey(
		"raw",
		new TextEncoder().encode(JWT_SECRET),
		{ name: "HMAC", hash: "SHA-256" },
		false,
		["sign"]
	);

	return await create(
		{ alg: "HS256", typ: "JWT" },
		{ sub: userId, exp: Math.floor(Date.now() / 1000) + 60 * 60 },
		key
	);
}

function generateRandomToken(): string {
	const bytes = new Uint8Array(32);
	crypto.getRandomValues(bytes);
	return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

function generateCode(): string {
	const bytes = new Uint8Array(4);
	crypto.getRandomValues(bytes);
	const num = (bytes[0] << 16 | bytes[1] << 8 | bytes[2]) % 1_000_000;
	return num.toString().padStart(6, "0");
}

async function issueTokenPair(
	userId: string,
	rememberMe: boolean,
	res: Response
): Promise<string> {
	const accessToken = await generateAccessToken(userId);
	const refreshToken = generateRandomToken();
	const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000);

	await query(
		`INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)`,
		[userId, refreshToken, expiresAt.toISOString()]
	);

	const cookieOptions: string[] = [
		`refreshToken=${refreshToken}`,
		"HttpOnly",
		"SameSite=Strict",
		"Path=/api/auth"
	];

	if (rememberMe) {
		cookieOptions.push(`Max-Age=${REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60}`);
	}

	res.setHeader("Set-Cookie", cookieOptions.join("; "));
	return accessToken;
}

export async function requestMagicLink(req: Request, res: Response) {
	try {
		const { email } = req.body;

		if (!email || typeof email !== "string") {
			return res.status(400).json({ error: "Email is required" });
		}

		const normalised = email.trim().toLowerCase();

		const existing = await query(
			"SELECT id FROM users WHERE email = $1",
			[normalised]
		);
		const userId = existing.rows.length > 0
			? (existing.rows[0] as Record<string, unknown>).id as string
			: null;

		const token = generateRandomToken();
		const code = generateCode();
		const expiresAt = new Date(
			Date.now() + MAGIC_LINK_EXPIRY_MINUTES * 60 * 1000
		);

		await query(
			`INSERT INTO magic_links (user_id, email, token, code, expires_at)
			 VALUES ($1, $2, $3, $4, $5)`,
			[userId, normalised, token, code, expiresAt.toISOString()]
		);

		await sendMagicLinkEmail(normalised, token, code);

		res.json({ message: "Check your email" });
	} catch (error) {
		console.error("Request magic link error:", error);
		res.status(500).json({ error: "Failed to send magic link" });
	}
}

export async function verifyMagicLink(req: Request, res: Response) {
	try {
		const { token, email, code, rememberMe } = req.body;

		if (!token && !(email && code)) {
			return res.status(400).json({
				error: "Provide a token, or an email & code",
			});
		}

		let result;

		if (token) {
			result = await query(
				`SELECT id, email, user_id FROM magic_links
				 WHERE token = $1 AND used_at IS NULL AND expires_at > NOW()`,
				[token]
			);
		} else {
			const normalised = (email as string).trim().toLowerCase();
			result = await query(
				`SELECT id, email, user_id FROM magic_links
				 WHERE email = $1 AND code = $2 AND used_at IS NULL AND expires_at > NOW()
				 ORDER BY created_at DESC LIMIT 1`,
				[normalised, code]
			);
		}

		if (result.rows.length === 0) {
			return res.status(401).json({ error: "Invalid or expired code" });
		}

		const link = result.rows[0] as Record<string, unknown>;

		await query(
			"UPDATE magic_links SET used_at = NOW() WHERE id = $1",
			[link.id]
		);

		let userId = link.user_id as string | null;

		if (!userId) {
			const userResult = await query(
				`INSERT INTO users (email) VALUES ($1)
				 ON CONFLICT (email) DO UPDATE SET email = EXCLUDED.email
				 RETURNING id, email, created_at`,
				[link.email]
			);
			const user = userResult.rows[0] as Record<string, unknown>;
			userId = user.id as string;
		}

		const userResult = await query(
			"SELECT id, email, created_at FROM users WHERE id = $1",
			[userId]
		);
		const user = userResult.rows[0] as Record<string, unknown>;

		const accessToken = await issueTokenPair(userId!, !!rememberMe, res);

		res.json({
			token: accessToken,
			user: { id: user.id, email: user.email, createdAt: user.created_at },
		} as AuthResponse);
	} catch (error) {
		console.error("Verify magic link error:", error);
		res.status(500).json({ error: "Verification failed" });
	}
}

export async function refreshTokens(req: Request, res: Response) {
	try {
		const cookieHeader = req.headers.cookie ?? "";
		const match = cookieHeader.match(/(?:^|;\s*)refreshToken=([^;]+)/);
		const refreshToken = match?.[1];

		if (!refreshToken) {
			return res.status(401).json({ error: "No refresh token" });
		}

		const result = await query(
			`SELECT id, user_id FROM refresh_tokens
			 WHERE token = $1 AND expires_at > NOW()`,
			[refreshToken]
		);

		if (result.rows.length === 0) {
			clearRefreshCookie(res);
			return res.status(401).json({ error: "Invalid or expired refresh token" });
		}

		const row = result.rows[0] as Record<string, unknown>;

		// Rotate: delete old token
		await query("DELETE FROM refresh_tokens WHERE id = $1", [row.id]);

		// Check if previous cookie had Max-Age (rememberMe) by looking at token age
		// We re-issue with rememberMe=true to maintain persistent session if token existed in DB
		const userId = row.user_id as string;
		const accessToken = await issueTokenPair(userId, true, res);

		res.json({ token: accessToken });
	} catch (error) {
		console.error("Refresh token error:", error);
		res.status(500).json({ error: "Token refresh failed" });
	}
}

export function logout(req: Request, res: Response) {
	const cookieHeader = req.headers.cookie ?? "";
	const match = cookieHeader.match(/(?:^|;\s*)refreshToken=([^;]+)/);
	const refreshToken = match?.[1];

	if (refreshToken) {
		query("DELETE FROM refresh_tokens WHERE token = $1", [refreshToken]).catch(
			(err) => console.error("Logout DB cleanup error:", err)
		);
	}

	clearRefreshCookie(res);
	res.json({ ok: true });
}

function clearRefreshCookie(res: Response) {
	res.setHeader(
		"Set-Cookie",
		"refreshToken=; HttpOnly; SameSite=Strict; Path=/api/auth; Max-Age=0"
	);
}
