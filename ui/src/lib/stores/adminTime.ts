import { writable } from 'svelte/store';

const STORAGE_KEY = 'glyf_admin_time_offset';

const MS_PER_DAY = 86400 * 1000;
const MS_PER_WEEK = 7 * MS_PER_DAY;

function readStoredOffset(): number | null {
	if (typeof localStorage === 'undefined') return null;
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (raw === null) return null;
		const n = parseInt(raw, 10);
		return Number.isFinite(n) ? n : null;
	} catch {
		return null;
	}
}

function writeOffset(offsetMs: number | null): void {
	if (typeof localStorage === 'undefined') return;
	if (offsetMs === null) {
		localStorage.removeItem(STORAGE_KEY);
	} else {
		localStorage.setItem(STORAGE_KEY, String(offsetMs));
	}
}

function createAdminTimeStore() {
	const { subscribe, set, update } = writable<number | null>(readStoredOffset());

	return {
		subscribe,
		setOffset(offsetMs: number | null) {
			writeOffset(offsetMs);
			set(offsetMs);
		},
		addDay() {
			update((prev) => {
				const next = (prev ?? 0) + MS_PER_DAY;
				writeOffset(next);
				return next;
			});
		},
		addWeek() {
			update((prev) => {
				const next = (prev ?? 0) + MS_PER_WEEK;
				writeOffset(next);
				return next;
			});
		},
		reset() {
			writeOffset(null);
			set(null);
		}
	};
}

export const adminTimeStore = createAdminTimeStore();

/**
 * Current time for SRS and dashboard logic. When admin time offset is set (localhost),
 * returns simulated "now"; otherwise returns real now.
 */
export function getNow(): Date {
	const offset = readStoredOffset();
	if (offset === null) return new Date();
	return new Date(Date.now() + offset);
}

export const ONE_DAY_MS = MS_PER_DAY;
export const ONE_WEEK_MS = MS_PER_WEEK;
