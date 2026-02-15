import type { Response } from "../../imports.ts";
import type { AuthRequest } from "../middleware/auth.ts";
import { query } from "../config/database.ts";

const LOCALHOST_ORIGINS = [
	"http://localhost:5173",
	"http://127.0.0.1:5173",
	"http://localhost:4173",
	"http://127.0.0.1:4173",
];

function isLocalhostOrigin(req: AuthRequest): boolean {
	const origin = req.headers.origin ?? req.headers.referer;
	if (!origin || typeof origin !== "string") return false;
	const base = origin.split("?")[0].replace(/\/$/, "");
	return LOCALHOST_ORIGINS.some((allowed) => base === allowed || base.startsWith(allowed + "/"));
}

export async function resetAccount(req: AuthRequest, res: Response) {
	if (!isLocalhostOrigin(req)) {
		return res.status(403).json({ error: "Admin reset is only allowed from localhost" });
	}

	const userId = req.userId!;

	try {
		await query("DELETE FROM pending_reminder_deliveries WHERE user_id = $1", [userId]);
		await query("DELETE FROM notifications WHERE user_id = $1", [userId]);
		await query("DELETE FROM attempt_records WHERE user_id = $1", [userId]);
		await query("DELETE FROM item_progress WHERE user_id = $1", [userId]);
		await query("DELETE FROM user_sync_state WHERE user_id = $1", [userId]);
		await query("DELETE FROM user_progress WHERE user_id = $1", [userId]);

		res.json({ success: true });
	} catch (error) {
		console.error("Admin reset error:", error);
		res.status(500).json({ error: "Reset failed" });
	}
}
