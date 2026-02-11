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
