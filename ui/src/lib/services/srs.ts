import type { Review } from './db';

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

	const nextReview = new Date();
	nextReview.setDate(nextReview.getDate() + interval);

	return {
		easeFactor,
		interval,
		repetitions,
		nextReview: nextReview.toISOString(),
		lastReview: new Date().toISOString()
	};
}

/**
 * Get cards due for review
 */
export async function getDueCards(script: string, database: GlyfDB): Promise<Review[]> {
	const now = new Date().toISOString();
	return await database.reviews
		.where('[script+nextReview]')
		.below([script, now])
		.toArray();
}

/**
 * Get new cards that haven't been reviewed yet
 */
export async function getNewCards(
	script: string,
	limit: number,
	database: GlyfDB
): Promise<Character[]> {
	const characters = await database.characters
		.where('script')
		.equals(script)
		.toArray();

	const reviewedIds = new Set(
		(await database.reviews.where('script').equals(script).toArray()).map(
			(r: Review) => r.itemId
		)
	);

	return characters
		.filter((char) => !reviewedIds.has(char.id))
		.slice(0, limit);
}

// Re-export types used by the functions above
import type { GlyfDB, Character } from './db';
