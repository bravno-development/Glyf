import type { Response } from "../../imports.ts";
import type { AuthRequest } from "../middleware/auth.ts";
import { query } from "../config/database.ts";

export async function listNotifications(req: AuthRequest, res: Response) {
	try {
		const userId = req.userId!;

		const result = await query(
			`SELECT id, type, created_at, read_at FROM notifications
       WHERE user_id = $1
       ORDER BY read_at NULLS FIRST, created_at DESC
       LIMIT 50`,
			[userId]
		);

		const rows = result.rows as Record<string, unknown>[];
		const list = rows.map((r) => ({
			id: r.id,
			type: r.type,
			createdAt: new Date(r.created_at as string).toISOString(),
			readAt: r.read_at != null ? new Date(r.read_at as string).toISOString() : null,
		}));
		res.json(list);
	} catch (error) {
		console.error("List notifications error:", error);
		res.status(500).json({ error: "Failed to fetch notifications" });
	}
}

export async function markRead(req: AuthRequest, res: Response) {
	try {
		const userId = req.userId!;
		const { id } = req.params as { id: string };

		if (!id) {
			return res.status(400).json({ error: "Notification id required" });
		}

		const result = await query(
			"UPDATE notifications SET read_at = NOW() WHERE id = $1 AND user_id = $2 RETURNING id",
			[id, userId]
		);

		if (result.rows.length === 0) {
			return res.status(404).json({ error: "Notification not found" });
		}
		res.json({ ok: true });
	} catch (error) {
		console.error("Mark read error:", error);
		res.status(500).json({ error: "Failed to mark notification read" });
	}
}

export async function markAllRead(req: AuthRequest, res: Response) {
	try {
		const userId = req.userId!;

		await query(
			"UPDATE notifications SET read_at = NOW() WHERE user_id = $1 AND read_at IS NULL",
			[userId]
		);
		res.json({ ok: true });
	} catch (error) {
		console.error("Mark all read error:", error);
		res.status(500).json({ error: "Failed to mark notifications read" });
	}
}
