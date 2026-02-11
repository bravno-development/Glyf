import type { Request, Response } from "../../imports.ts";
import { create } from "../../imports.ts";
import { query } from "../config/database.ts";
import { sendMagicLinkEmail } from "../services/email.ts";
import type { AuthResponse } from "../models/types.ts";

const JWT_SECRET = Deno.env.get("JWT_SECRET") || "change_me_in_production";
const MAGIC_LINK_EXPIRY_MINUTES = 15;

async function generateToken(userId: string): Promise<string> {
	const key = await crypto.subtle.importKey(
		"raw",
		new TextEncoder().encode(JWT_SECRET),
		{ name: "HMAC", hash: "SHA-256" },
		false,
		["sign"]
	);

	return await create(
		{ alg: "HS256", typ: "JWT" },
		{ sub: userId, exp: Date.now() / 1000 + 7 * 24 * 60 * 60 },
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

export async function requestMagicLink(req: Request, res: Response) {
	try {
		const { email } = req.body;

		if (!email || typeof email !== "string") {
			return res.status(400).json({ error: "Email is required" });
		}

		const normalised = email.trim().toLowerCase();

		// Look up existing user (may be null for new users)
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
		const { token, email, code } = req.body;

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

		// Mark as used
		await query(
			"UPDATE magic_links SET used_at = NOW() WHERE id = $1",
			[link.id]
		);

		// Upsert user
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

		// Fetch full user for response
		const userResult = await query(
			"SELECT id, email, created_at FROM users WHERE id = $1",
			[userId]
		);
		const user = userResult.rows[0] as Record<string, unknown>;

		const jwt = await generateToken(userId!);

		res.json({
			token: jwt,
			user: { id: user.id, email: user.email, createdAt: user.created_at },
		} as AuthResponse);
	} catch (error) {
		console.error("Verify magic link error:", error);
		res.status(500).json({ error: "Verification failed" });
	}
}
