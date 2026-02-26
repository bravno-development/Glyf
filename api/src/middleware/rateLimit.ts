import type { Request, Response, NextFunction } from "../../imports.ts";

interface WindowEntry {
	timestamps: number[];
}

const windows = new Map<string, WindowEntry>();

function getIp(req: Request): string {
	const forwarded = req.headers["x-forwarded-for"];
	if (typeof forwarded === "string") {
		return forwarded.split(",")[0].trim();
	}
	return (req as unknown as { ip?: string }).ip ?? "unknown";
}

function slidingWindow(
	key: string,
	maxRequests: number,
	windowMs: number
): boolean {
	const now = Date.now();
	const cutoff = now - windowMs;

	let entry = windows.get(key);
	if (!entry) {
		entry = { timestamps: [] };
		windows.set(key, entry);
	}

	// Evict expired timestamps
	entry.timestamps = entry.timestamps.filter((t) => t > cutoff);

	if (entry.timestamps.length >= maxRequests) {
		return false;
	}

	entry.timestamps.push(now);
	return true;
}

export function rateLimit(maxRequests: number, windowMs: number) {
	return (req: Request, res: Response, next: NextFunction) => {
		const ip = getIp(req);
		const key = `${req.path}:${ip}`;

		if (!slidingWindow(key, maxRequests, windowMs)) {
			res.status(429).json({ error: "Too many requests, please try again later" });
			return;
		}

		next();
	};
}
