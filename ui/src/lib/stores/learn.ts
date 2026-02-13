import { writable, get } from 'svelte/store';
import { api } from '$lib/services/api';
import { db } from '$lib/services/db';
import { getScript } from '$lib/services/scripts';
import { getScriptProgress, type ScriptProgressItem } from '$lib/services/dashboard';
import { getNewCards } from '$lib/services/srs';
import type { Character } from '$lib/services/db';

const BATCH_SIZE = 5;
const NEW_SCRIPT_LIMIT = 15;
const STORAGE_KEY_PREFIX = 'glyf_intros_';
const REVIEW_KEYS_STORAGE = 'glyf-review-option-keys';
const DEFAULT_REVIEW_KEYS = ['1', '2', '3', '4'];

function getInitialReviewKeys(): string[] {
	if (typeof localStorage === 'undefined') return [...DEFAULT_REVIEW_KEYS];
	try {
		const raw = localStorage.getItem(REVIEW_KEYS_STORAGE);
		if (!raw) return [...DEFAULT_REVIEW_KEYS];
		const parsed = JSON.parse(raw) as unknown;
		if (!Array.isArray(parsed) || parsed.length !== 4) return [...DEFAULT_REVIEW_KEYS];
		return parsed.map((k) => (typeof k === 'string' ? k.slice(0, 1) : String(k).slice(0, 1)));
	} catch {
		return [...DEFAULT_REVIEW_KEYS];
	}
}

function todayKey(scriptId: string): string {
	const today = new Date().toISOString().slice(0, 10);
	return `${STORAGE_KEY_PREFIX}${scriptId}_${today}`;
}

export interface LearnState {
	studyingScripts: ScriptProgressItem[];
	dailyGoalByScript: Record<string, number>;
	initialised: boolean;
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
		const normalized = keys.map((k) => (typeof k === 'string' ? k.slice(0, 1) : String(k).slice(0, 1)));
		reviewOptionKeysStore.set(normalized);
		if (typeof localStorage !== 'undefined') {
			localStorage.setItem(REVIEW_KEYS_STORAGE, JSON.stringify(normalized));
		}
	}

	function getIntroducedTodayCount(scriptId: string): number {
		if (typeof localStorage === 'undefined') return 0;
		const raw = localStorage.getItem(todayKey(scriptId));
		return raw ? parseInt(raw, 10) || 0 : 0;
	}

	function incrementIntroducedToday(scriptId: string, count: number): void {
		if (typeof localStorage === 'undefined') return;
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

			let studyingScripts = progress.filter((p: ScriptProgressItem) => idSet.has(p.script));

			for (const { script } of userScripts) {
				if (!studyingScripts.some((p: ScriptProgressItem) => p.script === script)) {
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
							{ script, label: script, percentage: 0, total: 0, learnt: 0 },
						];
					}
				}
			}

			const order = new Map(userScripts.map((r, i) => [r.script, i]));
			studyingScripts.sort(
				(a: ScriptProgressItem, b: ScriptProgressItem) =>
					(order.get(a.script) ?? 99) - (order.get(b.script) ?? 99)
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

	async function getIntroBatch(scriptId: string): Promise<Character[]> {
		const state = get({ subscribe });
		const dailyCap = state.dailyGoalByScript[scriptId] ?? NEW_SCRIPT_LIMIT;
		const introduced = getIntroducedTodayCount(scriptId);
		const remaining = Math.max(0, dailyCap - introduced);
		if (remaining === 0) return [];

		const batchSize = Math.min(BATCH_SIZE, remaining);
		const newCards = await getNewCards(scriptId, Math.min(dailyCap, remaining), db);
		return newCards.slice(0, batchSize);
	}

	return {
		subscribe,
		load,
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
