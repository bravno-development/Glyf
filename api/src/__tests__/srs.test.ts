import { assertEquals, assertGreater, assertLess } from "@std/assert";
import { nextSm2State } from "../lib/srs.ts";

// Cross-check: the API's nextSm2State (correct: boolean → grade 5 or 0)
// must produce results consistent with the client-side SM-2 algorithm.

Deno.test("nextSm2State: Given a new card (defaults), When correct=true, Then interval=1 and repetitions=1", () => {
	// Given: new card defaults
	const result = nextSm2State(2.5, 0, 0, true);
	// Then: first successful review → interval 1 day, repetitions advances
	assertEquals(result.interval, 1);
	assertEquals(result.repetitions, 1);
});

Deno.test("nextSm2State: Given a new card, When correct=false, Then interval resets to 1 and repetitions stay 0", () => {
	const result = nextSm2State(2.5, 0, 0, false);
	assertEquals(result.interval, 1);
	assertEquals(result.repetitions, 0);
});

Deno.test("nextSm2State: Given a card seen once (repetitions=1), When correct=true, Then interval jumps to 6 days", () => {
	const result = nextSm2State(2.5, 1, 1, true);
	assertEquals(result.interval, 6);
	assertEquals(result.repetitions, 2);
});

Deno.test("nextSm2State: Given an established card (repetitions=2, interval=6, easeFactor=2.5), When correct=true, Then interval is round(6 × 2.5) = 15", () => {
	const result = nextSm2State(2.5, 6, 2, true);
	assertEquals(result.interval, 15);
	assertEquals(result.repetitions, 3);
});

Deno.test("nextSm2State: Given an established card, When correct=false, Then repetitions reset to 0 and interval resets to 1", () => {
	const result = nextSm2State(2.5, 15, 3, false);
	assertEquals(result.interval, 1);
	assertEquals(result.repetitions, 0);
});

Deno.test("nextSm2State: When correct=true, Then ease factor increases (grade 5 formula)", () => {
	// grade 5: ef = ef + 0.1
	const result = nextSm2State(2.5, 1, 1, true);
	assertGreater(result.easeFactor, 2.5);
});

Deno.test("nextSm2State: Ease factor floor — ease factor never drops below 1.3", () => {
	// A degraded card at the floor: grade 5 (correct) actually increases, so test with
	// a card that would drop below 1.3 under normal SM-2. Since we only have grade 0 or 5,
	// we verify grade 0 leaves easeFactor unchanged (no ef update on failure branch).
	const result = nextSm2State(1.3, 10, 5, false);
	// On failure, ef is not recalculated — still 1.3
	assertEquals(result.easeFactor, 1.3);
});

Deno.test("nextSm2State: Cross-check correct=true matches client grade 5 for new card", () => {
	// Client: calculateNextReview({}, 5) → interval=1, rep=1, ef=2.6
	// Server: nextSm2State(2.5, 0, 0, true) should match
	const result = nextSm2State(2.5, 0, 0, true);
	assertEquals(result.interval, 1);
	assertEquals(result.repetitions, 1);
	assertEquals(result.easeFactor, 2.5 + 0.1); // grade 5 formula: ef + 0.1
});

Deno.test("nextSm2State: Cross-check correct=false matches client grade 0 for established card", () => {
	// Client: calculateNextReview({repetitions:3, interval:15, easeFactor:2.5}, 0)
	//   → interval=1, repetitions=0, easeFactor unchanged (failure branch)
	// Server: nextSm2State(2.5, 15, 3, false) should match
	const result = nextSm2State(2.5, 15, 3, false);
	assertEquals(result.interval, 1);
	assertEquals(result.repetitions, 0);
	assertEquals(result.easeFactor, 2.5); // no ef change on failure
});
