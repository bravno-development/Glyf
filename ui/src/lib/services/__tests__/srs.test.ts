import { vi, describe, it, expect } from 'vitest';

// Must be hoisted before the module under test is imported
vi.mock('$lib/stores/adminTime', () => ({
	getNow: () => new Date('2026-02-17T00:00:00.000Z'),
	adminTimeStore: {
		subscribe: vi.fn(),
		setOffset: vi.fn(),
		addDay: vi.fn(),
		addWeek: vi.fn(),
		reset: vi.fn()
	},
	ONE_DAY_MS: 86400000,
	ONE_WEEK_MS: 7 * 86400000
}));

import { calculateNextReview } from '../srs';

describe('calculateNextReview', () => {
	describe('Given a brand-new card (no prior reviews)', () => {
		it('When graded 0 (total failure), Then interval is 1 and repetitions stay 0', () => {
			// Given: empty card state (defaults: easeFactor=2.5, interval=0, repetitions=0)
			// When
			const result = calculateNextReview({}, 0);
			// Then: failure resets to initial state
			expect(result.interval).toBe(1);
			expect(result.repetitions).toBe(0);
		});

		it('When graded 3 (bare pass), Then interval is 1 day and repetitions advance to 1', () => {
			const result = calculateNextReview({}, 3);
			expect(result.interval).toBe(1);
			expect(result.repetitions).toBe(1);
		});

		it('When graded 5 (perfect recall), Then interval is 1 day and ease factor increases above default', () => {
			const result = calculateNextReview({}, 5);
			expect(result.interval).toBe(1);
			expect(result.repetitions).toBe(1);
			expect(result.easeFactor).toBeGreaterThan(2.5);
		});
	});

	describe('Given a card seen exactly once (repetitions=1, interval=1)', () => {
		const card = { repetitions: 1, interval: 1, easeFactor: 2.5 };

		it('When graded 3 (pass), Then interval jumps to 6 days as per SM-2', () => {
			const result = calculateNextReview(card, 3);
			expect(result.interval).toBe(6);
			expect(result.repetitions).toBe(2);
		});

		it('When graded 1 (failure), Then repetitions reset to 0 and interval resets to 1', () => {
			const result = calculateNextReview(card, 1);
			expect(result.repetitions).toBe(0);
			expect(result.interval).toBe(1);
		});
	});

	describe('Given an established card (repetitions=2, interval=6, easeFactor=2.5)', () => {
		const card = { repetitions: 2, interval: 6, easeFactor: 2.5 };

		it('When graded 5 (perfect), Then next interval is round(6 × 2.5) = 15 days', () => {
			const result = calculateNextReview(card, 5);
			expect(result.interval).toBe(15);
			expect(result.repetitions).toBe(3);
			expect(result.easeFactor).toBeGreaterThan(2.5);
		});

		it('When graded 3 (bare pass), Then ease factor decreases to ~2.36', () => {
			const result = calculateNextReview(card, 3);
			expect(result.easeFactor).toBeLessThan(2.5);
			expect(result.easeFactor).toBeCloseTo(2.36, 5);
		});

		it('When graded 0 (failure), Then repetitions reset to 0 and interval resets to 1', () => {
			const result = calculateNextReview(card, 0);
			expect(result.repetitions).toBe(0);
			expect(result.interval).toBe(1);
		});
	});

	describe('Ease factor floor', () => {
		it('When a degraded card (easeFactor=1.3) is graded 3, Then ease factor does not drop below 1.3', () => {
			// Grade 3 would normally reduce ease factor by 0.14; floor prevents this
			const card = { repetitions: 5, interval: 10, easeFactor: 1.3 };
			const result = calculateNextReview(card, 3);
			expect(result.easeFactor).toBe(1.3);
		});
	});

	describe('nextReview and lastReview dates', () => {
		it('When interval=1, Then nextReview is exactly 1 day after the fixed now (2026-02-18)', () => {
			// New card with grade 3 → interval=1
			const result = calculateNextReview({}, 3);
			expect(result.nextReview).toBe('2026-02-18T00:00:00.000Z');
		});

		it('When interval=6, Then nextReview is exactly 6 days after fixed now (2026-02-23)', () => {
			// Card seen once with grade 3 → interval=6
			const card = { repetitions: 1, interval: 1, easeFactor: 2.5 };
			const result = calculateNextReview(card, 3);
			expect(result.nextReview).toBe('2026-02-23T00:00:00.000Z');
		});

		it('lastReview is always the current time (fixed now)', () => {
			const result = calculateNextReview({}, 5);
			expect(result.lastReview).toBe('2026-02-17T00:00:00.000Z');
		});
	});
});
