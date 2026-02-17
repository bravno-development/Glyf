import { query } from "../config/database.ts";
import type { Response } from "../../imports.ts";
import type { AuthRequest } from "../middleware/auth.ts";
import type { SubmitAttemptsPayload, DueItem } from "../models/types.ts";
import { nextSm2State } from "../lib/srs.ts";

function addDays(date: Date, days: number): Date {
	const d = new Date(date);
	d.setDate(d.getDate() + days);
	return d;
}

export async function submitAttempts(req: AuthRequest, res: Response) {
	try {
		const userId = req.userId!;
		const body = req.body as SubmitAttemptsPayload;

		if (!body || typeof body.sessionId !== "string" || !Array.isArray(body.attempts)) {
			return res.status(400).json({ error: "sessionId and attempts array required" });
		}

		const { sessionId, attempts } = body;
		if (!sessionId.trim()) {
			return res.status(400).json({ error: "sessionId is required" });
		}

		// Character-only: we accept all itemIds (server does not have character list); optionally validate later
		let accepted = 0;
		const now = new Date();
		const today = now.toISOString().split("T")[0];

		for (const a of attempts) {
			if (
				!a.itemId ||
				!a.script ||
				!a.stepType ||
				typeof a.correct !== "boolean" ||
				typeof a.responseTimeMs !== "number" ||
				!a.uuidLocal
			) {
				continue; // skip invalid; don't fail whole batch
			}

			// Insert attempt_record (ignore duplicate uuid_local)
			try {
				await query(
					`INSERT INTO attempt_records (
            user_id, script, item_id, step_type, correct, response_time_ms,
            attempted_at, user_response, correct_answer, session_id, uuid_local
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
          ON CONFLICT (user_id, uuid_local) DO NOTHING`,
					[
						userId,
						a.script,
						a.itemId,
						a.stepType,
						a.correct,
						a.responseTimeMs ?? 0,
						now.toISOString(),
						a.userResponse ?? null,
						a.correctAnswer ?? null,
						sessionId,
						a.uuidLocal
					]
				);
			} catch {
				continue; // duplicate or error, skip
			}

			// Get current item_progress (if any)
			const existing = await query(
				`SELECT ease_factor, interval, repetitions, total_attempts, correct_attempts, consecutive_correct
         FROM item_progress WHERE user_id = $1 AND script = $2 AND item_id = $3`,
				[userId, a.script, a.itemId]
			);
			const row = existing.rows[0] as Record<string, unknown> | undefined;
			const easeFactor = row ? (row.ease_factor as number) : 2.5;
			const interval = row ? (row.interval as number) : 0;
			const repetitions = row ? (row.repetitions as number) : 0;
			const totalAttempts = row ? (row.total_attempts as number) + 1 : 1;
			const correctAttempts = row ? (row.correct_attempts as number) + (a.correct ? 1 : 0) : (a.correct ? 1 : 0);
			const consecutiveCorrect = a.correct
				? (row ? (row.consecutive_correct as number) + 1 : 1)
				: 0;

			const next = nextSm2State(easeFactor, interval, repetitions, a.correct);
			const nextReviewAt = addDays(now, next.interval);

			await query(
				`INSERT INTO item_progress (
          user_id, script, item_id, ease_factor, interval, repetitions,
          next_review_at, last_review_at, total_attempts, correct_attempts, consecutive_correct, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $8)
        ON CONFLICT (user_id, script, item_id) DO UPDATE SET
          ease_factor = $4, interval = $5, repetitions = $6,
          next_review_at = $7, last_review_at = $8, total_attempts = $9,
          correct_attempts = $10, consecutive_correct = $11, updated_at = $8`,
				[
					userId,
					a.script,
					a.itemId,
					next.easeFactor,
					next.interval,
					next.repetitions,
					nextReviewAt.toISOString(),
					now.toISOString(),
					totalAttempts,
					correctAttempts,
					consecutiveCorrect
				]
			);

			// Ensure user_progress row exists; increment words_studied_today (reset if new day)
			await query(
				`INSERT INTO user_progress (user_id, script, words_studied_today, last_review_date, updated_at)
         VALUES ($1, $2, 1, $3::date, NOW())
         ON CONFLICT (user_id, script) DO UPDATE SET
           words_studied_today = CASE WHEN user_progress.last_review_date IS DISTINCT FROM $3::date THEN 1 ELSE user_progress.words_studied_today + 1 END,
           last_review_date = $3::date,
           updated_at = NOW()`,
				[userId, a.script, today]
			);

			accepted += 1;
		}

		res.json({ success: true, accepted });
	} catch (error) {
		console.error("Submit attempts error:", error);
		res.status(500).json({ error: "Failed to submit attempts" });
	}
}

export async function getDue(req: AuthRequest, res: Response) {
	try {
		const userId = req.userId!;
		const script = req.query.script as string | undefined;
		const limit = Math.min(parseInt(req.query.limit as string, 10) || 50, 100);

		if (!script || !script.trim()) {
			return res.status(400).json({ error: "script query is required" });
		}

		const result = await query(
			`SELECT item_id, next_review_at
       FROM item_progress
       WHERE user_id = $1 AND script = $2 AND next_review_at <= NOW()
       ORDER BY next_review_at ASC
       LIMIT $3`,
			[userId, script, limit]
		);

		const items: DueItem[] = (result.rows as Record<string, unknown>[]).map((row) => ({
			itemId: row.item_id as string,
			nextReviewAt: (row.next_review_at as Date)?.toISOString?.() ?? String(row.next_review_at)
		}));

		res.json(items);
	} catch (error) {
		console.error("Get due error:", error);
		res.status(500).json({ error: "Failed to get due items" });
	}
}
