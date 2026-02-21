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

		// Backfill item_progress from blob (characters only)
		const characterReviews = Array.isArray(reviews)
			? reviews.filter((r: { itemType?: string }) => r.itemType === "character")
			: [];
		for (const r of characterReviews as Array<{
			itemId: string;
			script: string;
			easeFactor: number;
			interval: number;
			repetitions: number;
			nextReview: string;
			lastReview: string;
		}>) {
			await query(
				`INSERT INTO item_progress (
          user_id, script, item_id, ease_factor, interval, repetitions,
          next_review_at, last_review_at, total_attempts, correct_attempts, consecutive_correct, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7::timestamptz, $8::timestamptz, 0, 0, 0, $8::timestamptz)
        ON CONFLICT (user_id, script, item_id) DO UPDATE SET
          ease_factor = $4, interval = $5, repetitions = $6,
          next_review_at = $7::timestamptz, last_review_at = $8::timestamptz, updated_at = $8::timestamptz`,
				[
					userId,
					script,
					r.itemId,
					r.easeFactor ?? 2.5,
					r.interval ?? 0,
					r.repetitions ?? 0,
					r.nextReview,
					r.lastReview
				]
			);
		}

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

		const syncData = (result.rows as Record<string, unknown>[]).map((row) => ({
			script: row.script,
			reviews:
				typeof row.review_data === "string"
					? JSON.parse(row.review_data)
					: row.review_data,
			lastSync: row.last_sync
		}));

		res.json(syncData);
	} catch (error) {
		console.error("Sync down error:", error);
		res.status(500).json({ error: "Sync failed" });
	}
}
