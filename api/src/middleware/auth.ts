import type { Request, Response, NextFunction } from "../../imports.ts";
import { verify } from "../../imports.ts";
import { JWT_SECRET } from "../config/env.ts";

export interface AuthRequest extends Request {
	userId?: string;
}

export async function authMiddleware(
	req: AuthRequest,
	res: Response,
	next: NextFunction
) {
	try {
		const authHeader = req.headers.authorization;

		if (!authHeader || !authHeader.startsWith("Bearer ")) {
			return res.status(401).json({ error: "No token provided" });
		}

		const token = authHeader.substring(7);
		const key = await crypto.subtle.importKey(
			"raw",
			new TextEncoder().encode(JWT_SECRET),
			{ name: "HMAC", hash: "SHA-256" },
			false,
			["verify"]
		);

		const payload = await verify(token, key);
		req.userId = payload.sub as string;

		next();
	} catch (error) {
		console.error("Auth error:", error);
		res.status(401).json({ error: "Invalid token" });
	}
}
