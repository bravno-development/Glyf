import type { Response } from "../../imports.ts";
import type { AuthRequest } from "../middleware/auth.ts";
import { query } from "../config/database.ts";

export async function getStatus(req: AuthRequest, res: Response) {
	try {
		const userId = req.userId!;

		const result = await query(
			"SELECT COUNT(*)::int AS count FROM user_progress WHERE user_id = $1",
			[userId]
		);

		const count = (result.rows[0] as Record<string, number>).count;
		res.json({ onboarded: count > 0 });
	} catch (error) {
		console.error("Onboarding status error:", error);
		res.status(500).json({ error: "Failed to fetch onboarding status" });
	}
}

export async function complete(req: AuthRequest, res: Response) {
	try {
		const userId = req.userId!;
		const { script, dailyGoal } = req.body;

		if (!script || typeof script !== "string") {
			return res.status(400).json({ error: "script is required" });
		}

		const goal = Number(dailyGoal);
		if (!goal || ![5, 10, 15].includes(goal)) {
			return res.status(400).json({ error: "dailyGoal must be 5, 10 or 15" });
		}

		if (script === "japanese (hiragana & katakana)") {
			await query(
				`INSERT INTO user_progress (user_id, script, daily_goal)
				 VALUES ($1, $2, $3)
				 ON CONFLICT (user_id, script)
				 DO UPDATE SET daily_goal = $3, updated_at = NOW()`,
				[userId, "hiragana", goal]
			);
			await query(
				`INSERT INTO user_progress (user_id, script, daily_goal)
				 VALUES ($1, $2, $3)
				 ON CONFLICT (user_id, script)
				 DO UPDATE SET daily_goal = $3, updated_at = NOW()`,
				[userId, "katakana", goal]
			);
		} else {
			await query(
				`INSERT INTO user_progress (user_id, script, daily_goal)
				 VALUES ($1, $2, $3)
				 ON CONFLICT (user_id, script)
				 DO UPDATE SET daily_goal = $3, updated_at = NOW()`,
				[userId, script, goal]
			);
		}


		res.json({ success: true });
	} catch (error) {
		console.error("Onboarding complete error:", error);
		res.status(500).json({ error: "Failed to complete onboarding" });
	}
}
