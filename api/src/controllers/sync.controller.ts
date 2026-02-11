import type { Response } from "../../imports.ts";
import type { AuthRequest } from "../middleware/auth.ts";
import { query } from "../config/database.ts";
import type { SyncPayload } from "../models/types.ts";

export async function syncUp(req: AuthRequest, res: Response) {
	try {
		const userId = req.userId!;
		const { script, reviews } = req.body as SyncPayload;

		if (!script || !reviews) {
			return res.status(400).json({ error: "Script & reviews required" });
		}

		await query(
			`INSERT INTO user_sync_state (user_id, script, review_data, last_sync)
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT (user_id, script)
       DO UPDATE SET
         review_data = $3,
         last_sync = NOW()`,
			[userId, script, JSON.stringify(reviews)]
		);

		await query(
			`INSERT INTO user_progress (user_id, script, total_reviews)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, script)
       DO UPDATE SET
         total_reviews = user_progress.total_reviews + $3,
         updated_at = NOW()`,
			[userId, script, reviews.length]
		);

		res.json({ success: true, synced: reviews.length });
	} catch (error) {
		console.error("Sync up error:", error);
		res.status(500).json({ error: "Sync failed" });
	}
}

export async function syncDown(req: AuthRequest, res: Response) {
	try {
		const userId = req.userId!;

		const result = await query(
			`SELECT script, review_data, last_sync
       FROM user_sync_state
       WHERE user_id = $1`,
			[userId]
		);

		const syncData = result.rows.map((row: Record<string, unknown>) => ({
			script: row.script,
			reviews: JSON.parse(row.review_data as string),
			lastSync: row.last_sync
		}));

		res.json(syncData);
	} catch (error) {
		console.error("Sync down error:", error);
		res.status(500).json({ error: "Sync failed" });
	}
}
