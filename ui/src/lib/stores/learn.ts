import { writable, get } from "svelte/store";
import { api } from "$lib/services/api";
import { db } from "$lib/services/db";
import { getScript } from "$lib/services/scripts";
import {
	getScriptProgress,
	getMasteryLevel,
	type ScriptProgressItem,
	type MasteryBreakdown,
	type ScriptStudyState,
} from "$lib/services/dashboard";
import { getNow } from "$lib/stores/adminTime";
import type { Character } from "$lib/services/db";

const BATCH_SIZE = 5;
const NEW_SCRIPT_LIMIT = 15;
const STORAGE_KEY_PREFIX = "glyf_intros_";
const REVIEW_KEYS_STORAGE = "glyf-review-option-keys";
const DEFAULT_REVIEW_KEYS = ["1", "2", "3", "4"];

function getInitialReviewKeys(): string[] {
	if (typeof localStorage === "undefined") return [...DEFAULT_REVIEW_KEYS];
	try {
		const raw = localStorage.getItem(REVIEW_KEYS_STORAGE);
		if (!raw) return [...DEFAULT_REVIEW_KEYS];
		const parsed = JSON.parse(raw) as unknown;
		if (!Array.isArray(parsed) || parsed.length !== 4)
			return [...DEFAULT_REVIEW_KEYS];
		return parsed.map((k) =>
			typeof k === "string" ? k.slice(0, 1) : String(k).slice(0, 1),
		);
	} catch {
		return [...DEFAULT_REVIEW_KEYS];
	}
}

function todayKey(scriptId: string): string {
	const today = getNow().toISOString().slice(0, 10);
	return `${STORAGE_KEY_PREFIX}${scriptId}_${today}`;
}

export interface LearnState {
	studyingScripts: ScriptProgressItem[];
	dailyGoalByScript: Record<string, number>;
	initialised: boolean;
}

/**
 * Returns character IDs in lesson order for a script.
 * Uses course.lessons if defined, otherwise falls back to the order field.
 */
async function buildLessonOrderedIds(
	scriptId: string,
): Promise<{ ids: string[]; charMap: Map<string, Character> }> {
	const [def, characters] = await Promise.all([
		getScript(scriptId),
		db.characters.where("script").equals(scriptId).toArray(),
	]);

	const charMap = new Map(characters.map((c) => [c.id, c]));

	let ids: string[];
	if (def.course?.lessons?.length) {
		const seen = new Set<string>();
		const allIds = new Set(characters.map((c) => c.id));
		ids = [];
		for (const lesson of def.course.lessons) {
			for (const id of lesson.characterIds ?? []) {
				if (allIds.has(id) && !seen.has(id)) {
					ids.push(id);
					seen.add(id);
				}
			}
		}
		// Append any chars not covered by lessons, sorted by order
		const byOrder = [...characters].sort(
			(a, b) => (a.order ?? 999) - (b.order ?? 999),
		);
		for (const c of byOrder) {
			if (!seen.has(c.id)) ids.push(c.id);
		}
	} else {
		ids = [...characters]
			.sort((a, b) => (a.order ?? 999) - (b.order ?? 999))
			.map((c) => c.id);
	}

	return { ids, charMap };
}

function createLearnStore() {
	const { subscribe, set, update } = writable<LearnState>({
		studyingScripts: [],
		dailyGoalByScript: {},
		initialised: false,
	});

	const reviewOptionKeysStore = writable<string[]>(getInitialReviewKeys());

	function getReviewOptionKeys(): string[] {
		return get(reviewOptionKeysStore);
	}

	function setReviewOptionKeys(keys: string[]): void {
		if (!Array.isArray(keys) || keys.length !== 4) return;
		const normalized = keys.map((k) =>
			typeof k === "string" ? k.slice(0, 1) : String(k).slice(0, 1),
		);
		reviewOptionKeysStore.set(normalized);
		if (typeof localStorage !== "undefined") {
			localStorage.setItem(
				REVIEW_KEYS_STORAGE,
				JSON.stringify(normalized),
			);
		}
	}

	function getIntroducedTodayCount(scriptId: string): number {
		if (typeof localStorage === "undefined") return 0;
		const raw = localStorage.getItem(todayKey(scriptId));
		return raw ? parseInt(raw, 10) || 0 : 0;
	}

	function incrementIntroducedToday(scriptId: string, count: number): void {
		if (typeof localStorage === "undefined") return;
		const key = todayKey(scriptId);
		const current = getIntroducedTodayCount(scriptId);
		localStorage.setItem(key, String(current + count));
	}

	function isDailyGoalMet(scriptId: string): boolean {
		const state = get({ subscribe });
		const dailyGoal = state.dailyGoalByScript[scriptId] ?? NEW_SCRIPT_LIMIT;
		return getIntroducedTodayCount(scriptId) >= dailyGoal;
	}

	async function load(): Promise<void> {
		const state = get({ subscribe });
		if (state.initialised) return;

		try {
			const userScripts = await api.user.getScripts();
			if (userScripts.length === 0) {
				update((s) => ({ ...s, initialised: true }));
				return;
			}

			const progress = await getScriptProgress();
			const idSet = new Set(userScripts.map((r) => r.script));
			const dailyGoalByScript: Record<string, number> = {};
			for (const r of userScripts) {
				dailyGoalByScript[r.script] = r.dailyGoal;
			}

			let studyingScripts = progress.filter((p: ScriptProgressItem) =>
				idSet.has(p.script),
			);

			for (const { script } of userScripts) {
				if (
					!studyingScripts.some(
						(p: ScriptProgressItem) => p.script === script,
					)
				) {
					try {
						const def = await getScript(script);
						studyingScripts = [
							...studyingScripts,
							{
								script,
								label: def.name,
								percentage: 0,
								total: def.totalCharacters ?? 0,
								learnt: 0,
							},
						];
					} catch {
						studyingScripts = [
							...studyingScripts,
							{
								script,
								label: script,
								percentage: 0,
								total: 0,
								learnt: 0,
							},
						];
					}
				}
			}

			const order = new Map(userScripts.map((r, i) => [r.script, i]));
			studyingScripts.sort(
				(a: ScriptProgressItem, b: ScriptProgressItem) =>
					(order.get(a.script) ?? 99) - (order.get(b.script) ?? 99),
			);

			update((s) => ({
				...s,
				studyingScripts,
				dailyGoalByScript,
				initialised: true,
			}));
		} catch {
			update((s) => ({ ...s, initialised: true }));
		}
	}

	/**
	 * Returns a single source-of-truth for dashboard data across all studying scripts.
	 * Each entry answers: can I study this script, and is it new learning or review?
	 */
	async function getDashboardData(): Promise<ScriptStudyState[]> {
		const state = get({ subscribe });
		if (!state.initialised) await load();
		const currentState = get({ subscribe });

		const now = getNow().toISOString();

		const results = await Promise.all(
			currentState.studyingScripts.map(async (scriptItem) => {
				const scriptId = scriptItem.script;
				const dailyCap =
					currentState.dailyGoalByScript[scriptId] ??
					NEW_SCRIPT_LIMIT;
				const introducedToday = getIntroducedTodayCount(scriptId);
				const remainingToday = Math.max(0, dailyCap - introducedToday);

				const [def, reviews, { ids: orderedIds }] = await Promise.all([
					getScript(scriptId),
					db.reviews.where("script").equals(scriptId).toArray(),
					buildLessonOrderedIds(scriptId),
				]);

				const reviewMap = new Map(reviews.map((r) => [r.itemId, r]));

				// glyfsToLearn: unreviewed glyphs in lesson order, capped to remaining daily quota
				const glyfsToLearn: string[] = [];
				for (const id of orderedIds) {
					if (glyfsToLearn.length >= remainingToday) break;
					const review = reviewMap.get(id);
					if (!review || review.repetitions === 0) {
						glyfsToLearn.push(id);
					}
				}

				// glyfsToReview: glyphs with SRS records that are now due
				const glyfsToReview = reviews
					.filter((r) => r.repetitions > 0 && r.nextReview < now)
					.map((r) => r.itemId);

				// masteryBreakdown: single pass over all ordered glyphs
				const masteryBreakdown: MasteryBreakdown = {
					mastered: 0,
					good: 0,
					learning: 0,
					difficult: 0,
					new: 0,
				};
				for (const id of orderedIds) {
					const level = getMasteryLevel(reviewMap.get(id));
					masteryBreakdown[level]++;
				}

				return {
					script: scriptId,
					label: def.name,
					glyfsToLearn: glyfsToLearn,
					glyfsToReview: glyfsToReview,
					masteryBreakdown,
				} satisfies ScriptStudyState;
			}),
		);

		return results;
	}

	async function getIntroBatch(scriptId: string): Promise<Character[]> {
		const state = get({ subscribe });
		const dailyCap = state.dailyGoalByScript[scriptId] ?? NEW_SCRIPT_LIMIT;
		const introduced = getIntroducedTodayCount(scriptId);
		const remaining = Math.max(0, dailyCap - introduced);
		if (remaining === 0) return [];

		const batchSize = Math.min(BATCH_SIZE, remaining);

		const reviews = await db.reviews
			.where("script")
			.equals(scriptId)
			.toArray();
		const reviewedIds = new Set(reviews.map((r) => r.itemId));

		const { ids: orderedIds, charMap } =
			await buildLessonOrderedIds(scriptId);

		const result: Character[] = [];
		for (const id of orderedIds) {
			if (result.length >= batchSize) break;
			if (!reviewedIds.has(id)) {
				const char = charMap.get(id);
				if (char) result.push(char);
			}
		}
		return result;
	}

	function setDailyGoal(scriptId: string, goal: number): void {
		update((s) => ({
			...s,
			dailyGoalByScript: { ...s.dailyGoalByScript, [scriptId]: goal },
		}));
	}

	function reset(): void {
		set({
			studyingScripts: [],
			dailyGoalByScript: {},
			initialised: false,
		});
	}

	return {
		subscribe,
		load,
		reset,
		setDailyGoal,
		getDashboardData,
		getIntroBatch,
		incrementIntroducedToday,
		getIntroducedTodayCount,
		isDailyGoalMet,
		reviewOptionKeysStore,
		getReviewOptionKeys,
		setReviewOptionKeys,
	};
}

export const learnStore = createLearnStore();
