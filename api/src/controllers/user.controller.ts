import type { Response } from "../../imports.ts";
import type { AuthRequest } from "../middleware/auth.ts";
import { query } from "../config/database.ts";

export async function getProfile(req: AuthRequest, res: Response) {
	try {
		const userId = req.userId!;

		const result = await query(
			"SELECT id, email, created_at FROM users WHERE id = $1",
			[userId]
		);

		if (result.rows.length === 0) {
			return res.status(404).json({ error: "User not found" });
		}

		const user = result.rows[0] as Record<string, unknown>;
		res.json({ id: user.id, email: user.email, createdAt: user.created_at });
	} catch (error) {
		console.error("Profile error:", error);
		res.status(500).json({ error: "Failed to fetch profile" });
	}
}

export async function getUserScripts(req: AuthRequest, res: Response) {
	try {
		const userId = req.userId!;

		const result = await query(
			"SELECT script FROM user_progress WHERE user_id = $1",
			[userId]
		);

		if (result.rows.length === 0) {
			return res.status(404).json({ error: "User scripts not found" });
		}

		const userProgress = result.rows as Record<string, unknown>[];
		res.json(userProgress.map((p) => p.script));
	} catch (error) {
		console.error("User scripts error:", error);
		res.status(500).json({ error: "Failed to fetch user's scripts" });
	}
}
