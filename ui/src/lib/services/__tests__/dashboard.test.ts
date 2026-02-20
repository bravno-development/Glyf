import { vi, describe, it, expect, beforeEach } from 'vitest';

// ─── Module mocks ─────────────────────────────────────────────────────────────

// vi.mock is hoisted before imports, so we use vi.hoisted() to initialise
// the shared mock reference before the factory runs.
const mockDb = vi.hoisted(() => ({
	characters: { where: vi.fn() },
	reviews: { where: vi.fn() },
	sessions: { toArray: vi.fn() }
}));

// Prevent Dexie from instantiating — requires IndexedDB which isn't available in Node
vi.mock('../db', () => ({ db: mockDb, GlyfDB: class { } }));

// srs.ts (imported by dashboard.ts) calls getNow(); provide a fixed date
vi.mock('$lib/stores/adminTime', () => ({
	getNow: () => new Date('2026-02-17T00:00:00.000Z'),
	adminTimeStore: { subscribe: vi.fn() },
	ONE_DAY_MS: 86400000,
	ONE_WEEK_MS: 7 * 86400000
}));

// getDueCharacters is called by getDashboardStats; return empty list by default
vi.mock('../srs', () => ({
	getDueCharacters: vi.fn().mockResolvedValue([]),
	calculateNextReview: vi.fn(),
	getNewCards: vi.fn().mockResolvedValue([])
}));

import { getMasteryLevel, getDashboardStats, getMasteryBreakdown } from '../dashboard';
import type { Review, Character } from '../db';

// ─── Helper: build a mock DB chain that filters by the given field ─────────────

type Row = Record<string, unknown>;
function makeChain(rows: Row[]) {
	return {
		where: (field: string) => ({
			equals: (val: unknown) => ({
				toArray: () => Promise.resolve(rows.filter((r) => r[field] === val)),
				count: () => Promise.resolve(rows.filter((r) => r[field] === val).length)
			})
		})
	};
}

// ─── getMasteryLevel ─────────────────────────────────────────────────────────

describe('getMasteryLevel', () => {
	describe('Given no review record', () => {
		it('When called with undefined, Then returns "new"', () => {
			expect(getMasteryLevel(undefined)).toBe('new');
		});
	});

	describe('Given a review with repetitions=0 (card seen but not yet successfully reviewed)', () => {
		it('When repetitions=0, Then returns "new" regardless of interval', () => {
			const review = { repetitions: 0, interval: 0 } as Review;
			expect(getMasteryLevel(review)).toBe('new');
		});
	});

	describe('Given a review with repetitions > 0', () => {
		it('When interval=1, Then returns "learning" (just started)', () => {
			const review = { repetitions: 1, interval: 1 } as Review;
			expect(getMasteryLevel(review)).toBe('learning');
		});

		it('When interval=5, Then returns "learning" (still within the learning band)', () => {
			const review = { repetitions: 2, interval: 5 } as Review;
			expect(getMasteryLevel(review)).toBe('learning');
		});

		it('When interval=6, Then returns "good" (entry point to the good band)', () => {
			const review = { repetitions: 2, interval: 6 } as Review;
			expect(getMasteryLevel(review)).toBe('good');
		});

		it('When interval=20, Then returns "good" (upper bound of the good band)', () => {
			const review = { repetitions: 4, interval: 20 } as Review;
			expect(getMasteryLevel(review)).toBe('good');
		});

		it('When interval=21, Then returns "mastered" (threshold for mastery)', () => {
			const review = { repetitions: 5, interval: 21 } as Review;
			expect(getMasteryLevel(review)).toBe('mastered');
		});

		it('When interval=60, Then returns "mastered" (long-term retention)', () => {
			const review = { repetitions: 8, interval: 60 } as Review;
			expect(getMasteryLevel(review)).toBe('mastered');
		});
	});

	describe('Edge case: difficult band', () => {
		it('When interval=0 with repetitions=1, Then returns "difficult"', () => {
			// NOTE: this state is unreachable via normal SM-2 progression.
			// Failures always reset repetitions to 0 (mapping to "new"), so a card
			// with repetitions>0 and interval<1 cannot occur naturally. This test
			// documents the boundary condition for defensive completeness.
			const review = { repetitions: 1, interval: 0 } as Review;
			expect(getMasteryLevel(review)).toBe('difficult');
		});
	});
});

// ─── Script isolation ─────────────────────────────────────────────────────────
// Each script must only see its own characters and reviews — not data from other
// scripts the user is also studying.

describe('Script isolation: getDashboardStats', () => {
	// Mixed data: one hiragana review (mastered) and one katakana review (learning)
	const mixedReviews: Row[] = [
		{ itemId: 'hiragana-a', script: 'hiragana', repetitions: 5, easeFactor: 2.6, interval: 25 },
		{ itemId: 'katakana-a', script: 'katakana', repetitions: 1, easeFactor: 2.3, interval: 1 }
	];

	beforeEach(() => {
		vi.mocked(mockDb.reviews.where).mockImplementation(makeChain(mixedReviews).where as typeof mockDb.reviews.where);
	});

	it('Given mixed hiragana and katakana reviews, When getDashboardStats("hiragana") is called, Then only hiragana reviews are counted', async () => {
		const stats = await getDashboardStats('hiragana');
		// Only 1 hiragana review with repetitions > 0 → learnt = 1
		expect(stats.learnt).toBe(1);
	});

	it('Given mixed hiragana and katakana reviews, When getDashboardStats("katakana") is called, Then only katakana reviews are counted', async () => {
		const stats = await getDashboardStats('katakana');
		// Only 1 katakana review with repetitions > 0 → learnt = 1
		expect(stats.learnt).toBe(1);
	});

	it('Given hiragana reviews with all easeFactor >= 2.5, When getDashboardStats("hiragana") is called, Then accuracy is 100% for hiragana only', async () => {
		const hiraganaOnlyReviews: Row[] = [
			{ itemId: 'hiragana-a', script: 'hiragana', repetitions: 2, easeFactor: 2.6, interval: 6 },
			{ itemId: 'hiragana-i', script: 'hiragana', repetitions: 2, easeFactor: 2.5, interval: 6 },
			// katakana card with poor ease factor — must not affect hiragana accuracy
			{ itemId: 'katakana-a', script: 'katakana', repetitions: 1, easeFactor: 1.5, interval: 1 }
		];
		vi.mocked(mockDb.reviews.where).mockImplementation(
			makeChain(hiraganaOnlyReviews).where as typeof mockDb.reviews.where
		);

		const stats = await getDashboardStats('hiragana');
		expect(stats.accuracy).toBe(100);
	});
});

describe('Script isolation: getMasteryBreakdown', () => {
	// Mixed characters and reviews across two scripts
	const mixedCharacters: Row[] = [
		{ id: 'hiragana-a', script: 'hiragana', character: 'あ' },
		{ id: 'hiragana-i', script: 'hiragana', character: 'い' },
		{ id: 'katakana-a', script: 'katakana', character: 'ア' }
	];
	const mixedReviews: Row[] = [
		{ itemId: 'hiragana-a', script: 'hiragana', repetitions: 5, interval: 21 }, // mastered
		{ itemId: 'hiragana-i', script: 'hiragana', repetitions: 1, interval: 1 },  // learning
		{ itemId: 'katakana-a', script: 'katakana', repetitions: 2, interval: 6 }   // good
	];

	beforeEach(() => {
		vi.mocked(mockDb.characters.where).mockImplementation(
			makeChain(mixedCharacters).where as typeof mockDb.characters.where
		);
		vi.mocked(mockDb.reviews.where).mockImplementation(
			makeChain(mixedReviews).where as typeof mockDb.reviews.where
		);
	});

	it('Given characters and reviews for hiragana and katakana, When getMasteryBreakdown("hiragana") is called, Then only hiragana characters are counted', async () => {
		const breakdown = await getMasteryBreakdown('hiragana');

		// 2 hiragana characters: 1 mastered, 1 learning — katakana must not appear
		expect(breakdown.mastered).toBe(1);
		expect(breakdown.learning).toBe(1);
		expect(breakdown.good).toBe(0);
		expect(breakdown.new).toBe(0);
		// Total should be 2 (hiragana only)
		const total = breakdown.mastered + breakdown.good + breakdown.learning + breakdown.difficult + breakdown.new;
		expect(total).toBe(2);
	});

	it('Given characters and reviews for hiragana and katakana, When getMasteryBreakdown("katakana") is called, Then only katakana characters are counted', async () => {
		const breakdown = await getMasteryBreakdown('katakana');

		// 1 katakana character: 1 good — hiragana must not appear
		expect(breakdown.good).toBe(1);
		expect(breakdown.mastered).toBe(0);
		expect(breakdown.learning).toBe(0);
		const total = breakdown.mastered + breakdown.good + breakdown.learning + breakdown.difficult + breakdown.new;
		expect(total).toBe(1);
	});

	it('Given a character with no review record in its script, When getMasteryBreakdown is called, Then it counts as "new"', async () => {
		// Add a third hiragana character with no review
		const chars: Row[] = [
			{ id: 'hiragana-a', script: 'hiragana', character: 'あ' },
			{ id: 'hiragana-i', script: 'hiragana', character: 'い' },
			{ id: 'hiragana-u', script: 'hiragana', character: 'う' } // no review → new
		];
		const reviews: Row[] = [
			{ itemId: 'hiragana-a', script: 'hiragana', repetitions: 5, interval: 21 },
			{ itemId: 'hiragana-i', script: 'hiragana', repetitions: 1, interval: 1 }
		];
		vi.mocked(mockDb.characters.where).mockImplementation(
			makeChain(chars).where as typeof mockDb.characters.where
		);
		vi.mocked(mockDb.reviews.where).mockImplementation(
			makeChain(reviews).where as typeof mockDb.reviews.where
		);

		const breakdown = await getMasteryBreakdown('hiragana');
		expect(breakdown.new).toBe(1);  // 'う' has no review → new
		expect(breakdown.mastered).toBe(1);
		expect(breakdown.learning).toBe(1);
	});
});
