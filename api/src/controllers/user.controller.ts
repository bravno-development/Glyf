import type { Response } from "../../imports.ts";
import type { AuthRequest } from "../middleware/auth.ts";
import { query } from "../config/database.ts";

export async function getProfile(req: AuthRequest, res: Response) {
	try {
		const userId = req.userId!;

		const result = await query(
			"SELECT id, email, created_at, reminder_enabled, reminder_time_local, timezone, next_reminder_at FROM users WHERE id = $1",
			[userId]
		);

		if (result.rows.length === 0) {
			return res.status(404).json({ error: "User not found" });
		}

		const user = result.rows[0] as Record<string, unknown>;
		const reminderTimeLocal = user.reminder_time_local as string | null;
		const nextReminderAt = user.next_reminder_at as string | null;
		res.json({
			id: user.id,
			email: user.email,
			createdAt: user.created_at,
			reminderEnabled: user.reminder_enabled ?? false,
			reminderTimeLocal: reminderTimeLocal != null ? String(reminderTimeLocal).slice(0, 5) : undefined,
			timezone: (user.timezone as string) ?? undefined,
			nextReminderAt: nextReminderAt != null ? new Date(nextReminderAt).toISOString() : undefined,
		});
	} catch (error) {
		console.error("Profile error:", error);
		res.status(500).json({ error: "Failed to fetch profile" });
	}
}

const HH_MM_REGEX = /^([01]?\d|2[0-3]):([0-5]\d)$/;

export async function updateReminder(req: AuthRequest, res: Response) {
	try {
		const userId = req.userId!;
		const { reminderEnabled, reminderTimeLocal, timezone } = req.body as {
			reminderEnabled?: boolean;
			reminderTimeLocal?: string;
			timezone?: string;
		};

		if (typeof reminderEnabled !== "boolean") {
			return res.status(400).json({ error: "reminderEnabled must be a boolean" });
		}

		if (reminderEnabled) {
			if (typeof reminderTimeLocal !== "string" || !HH_MM_REGEX.test(reminderTimeLocal)) {
				return res.status(400).json({ error: "reminderTimeLocal must be HH:mm when reminders are enabled" });
			}
			if (typeof timezone !== "string" || !timezone.trim()) {
				return res.status(400).json({ error: "timezone is required when reminders are enabled" });
			}
			// Validate IANA timezone by trying to use it
			try {
				new Intl.DateTimeFormat("en", { timeZone: timezone.trim() });
			} catch {
				return res.status(400).json({ error: "Invalid timezone" });
			}
		}

		if (reminderEnabled) {
			const tz = timezone!.trim();
			const timeStr = reminderTimeLocal!.trim();
			await query(
				`UPDATE users SET
          reminder_enabled = true,
          reminder_time_local = $1::time,
          timezone = $2,
          next_reminder_at = CASE
            WHEN (current_date + $1::time) AT TIME ZONE $2 <= NOW()
            THEN ((current_date + interval '1 day') + $1::time) AT TIME ZONE $2
            ELSE (current_date + $1::time) AT TIME ZONE $2
          END
        WHERE id = $3`,
				[timeStr, tz, userId]
			);
		} else {
			await query(
				"UPDATE users SET reminder_enabled = false, next_reminder_at = NULL WHERE id = $1",
				[userId]
			);
		}

		const result = await query(
			"SELECT reminder_enabled, reminder_time_local, timezone, next_reminder_at FROM users WHERE id = $1",
			[userId]
		);
		const row = result.rows[0] as Record<string, unknown>;
		const nextReminderAt = row.next_reminder_at as string | null;
		const reminderTimeLocalVal = row.reminder_time_local as string | null;
		res.json({
			reminderEnabled: row.reminder_enabled ?? false,
			reminderTimeLocal: reminderTimeLocalVal != null ? String(reminderTimeLocalVal).slice(0, 5) : undefined,
			timezone: (row.timezone as string) ?? undefined,
			nextReminderAt: nextReminderAt != null ? new Date(nextReminderAt).toISOString() : undefined,
		});
	} catch (error) {
		console.error("Update reminder error:", error);
		res.status(500).json({ error: "Failed to update reminder" });
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
