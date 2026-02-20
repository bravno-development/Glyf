/**
 * SM-2 spaced repetition algorithm (server-side).
 *
 * Mirrors the logic in ui/src/lib/services/srs.ts.
 * The API uses correct:boolean (grade 5 for correct, grade 0 for incorrect)
 * rather than the 0-5 scale used client-side.
 */
export function nextSm2State(
	easeFactor: number,
	interval: number,
	repetitions: number,
	correct: boolean
): { easeFactor: number; interval: number; repetitions: number } {
	const grade = correct ? 5 : 0;
	let ef = easeFactor;
	let int = interval;
	let rep = repetitions;

	if (grade < 3) {
		rep = 0;
		int = 1;
	} else {
		if (rep === 0) int = 1;
		else if (rep === 1) int = 6;
		else int = Math.round(int * ef);
		rep += 1;
		ef = ef + (0.1 - (5 - grade) * (0.08 + (5 - grade) * 0.02));
		ef = Math.max(1.3, ef);
	}
	return { easeFactor: ef, interval: int, repetitions: rep };
}
