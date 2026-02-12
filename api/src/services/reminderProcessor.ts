/**
 * Processes pending_reminder_deliveries enqueued by pg_cron.
 * Runs on API startup and every 1 min. Try Web Push if subscription exists;
 * if not possible or push fails, send email. (Web Push: add later if feasible.)
 */
import { query } from "../config/database.ts";
import { sendStudyReminderEmail } from "./email.ts";

const APP_URL = Deno.env.get("APP_URL") || "http://localhost:5173";

export async function processPendingReminders(): Promise<void> {
	const result = await query(
		`SELECT p.id AS pending_id, p.user_id, u.email, u.push_subscription
     FROM pending_reminder_deliveries p
     JOIN users u ON u.id = p.user_id
     WHERE p.processed_at IS NULL`
	);

	const rows = result.rows as Record<string, unknown>[];
	for (const row of rows) {
		const pendingId = row.pending_id as string;
		const userId = row.user_id as string;
		const email = row.email as string;
		const pushSubscription = row.push_subscription as unknown;

		let sent = false;
		if (pushSubscription && typeof pushSubscription === "object") {
			// TODO: Web Push — add when VAPID + web-push (or Deno-compatible) is available.
			// try { await sendWebPush(userId, pushSubscription); sent = true; } catch { }
		}
		if (!sent) {
			await sendStudyReminderEmail(email, APP_URL);
		}

		await query(
			"INSERT INTO notifications (user_id, type) VALUES ($1, $2)",
			[userId, "study_reminder"]
		);
		await query(
			"UPDATE pending_reminder_deliveries SET processed_at = NOW() WHERE id = $1",
			[pendingId]
		);
	}
}

const INTERVAL_MS = 60_000;

let intervalId: ReturnType<typeof setInterval> | null = null;

export function startReminderProcessor(): void {
	processPendingReminders().catch((err) => console.error("Reminder processor run error:", err));
	intervalId = setInterval(() => {
		processPendingReminders().catch((err) => console.error("Reminder processor run error:", err));
	}, INTERVAL_MS);
}

export function stopReminderProcessor(): void {
	if (intervalId != null) {
		clearInterval(intervalId);
		intervalId = null;
	}
}
