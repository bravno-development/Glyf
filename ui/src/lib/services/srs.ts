import type { Review } from './db';
import { getNow } from '$lib/stores/adminTime';

export interface GradeResult {
	easeFactor: number;
	interval: number;
	repetitions: number;
	nextReview: string;
	lastReview: string;
}

/**
 * SM-2 Algorithm for spaced repetition
 * @param card Current review state
 * @param grade User's grade (0-5): 0=total fail, 3=pass, 5=perfect
 */
export function calculateNextReview(
	card: Partial<Review>,
	grade: number
): GradeResult {
	let easeFactor = card.easeFactor ?? 2.5;
	let interval = card.interval ?? 0;
	let repetitions = card.repetitions ?? 0;

	if (grade < 3) {
		repetitions = 0;
		interval = 1;
	} else {
		if (repetitions === 0) {
			interval = 1;
		} else if (repetitions === 1) {
			interval = 6;
		} else {
			interval = Math.round(interval * easeFactor);
		}
		repetitions += 1;

		easeFactor = easeFactor + (0.1 - (5 - grade) * (0.08 + (5 - grade) * 0.02));
		easeFactor = Math.max(1.3, easeFactor);
	}

	const now = getNow();
	const nextReview = new Date(now);
	nextReview.setDate(nextReview.getDate() + interval);

	return {
		easeFactor,
		interval,
		repetitions,
		nextReview: nextReview.toISOString(),
		lastReview: now.toISOString()
	};
}

/**
 * Get cards due for review
 */
export async function getDueCharacters(script: string, database: GlyfDB): Promise<Review[]> {
	const now = getNow().toISOString();
	return await database.reviews
		.where('script')
		.equals(script)
		.and((r: Review) => r.nextReview < now)
		.toArray();
}

// Re-export types used by the functions above
import type { GlyfDB, Character } from './db';
