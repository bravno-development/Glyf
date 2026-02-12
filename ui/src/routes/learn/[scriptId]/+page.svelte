<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { db, type Character, type Review } from '$lib/services/db';
	import { getScript, seedCharacters } from '$lib/services/scripts';
	import { getDueCards, getNewCards, calculateNextReview } from '$lib/services/srs';
	import { api } from '$lib/services/api';
	import { userStore } from '$lib/stores/user';
	import type { ScriptDefinition } from '$lib/services/scripts';

	const scriptId = $derived($page.params.scriptId ?? '');

	let scriptDef = $state<ScriptDefinition | null>(null);
	let queue = $state<Array<{ character: Character; review?: Review }>>([]);
	let currentIndex = $state(0);
	let sessionId = $state<string>('');
	let error = $state<string | null>(null);
	let loading = $state(true);
	let shownAt = $state(0);

	$effect(() => {
		if (!$userStore.initialised) return;
		if (!$userStore.isAuthenticated) {
			goto('/auth/login');
		}
	});

	onMount(async () => {
		if (!scriptId) return;
		try {
			const def = await getScript(scriptId);
			scriptDef = def;
			await seedCharacters(scriptId);

			const due = await getDueCards(scriptId, db);
			const dueChars = await db.characters.where('script').equals(scriptId).toArray();
			const charMap = new Map(dueChars.map((c: Character) => [c.id, c]));
			const dueWithChar = due
				.filter((r: Review) => r.itemType === 'character')
				.map((r: Review) => ({
					character: charMap.get(r.itemId)!,
					review: r
				}))
				.filter((x) => x.character);

			const newCards = await getNewCards(scriptId, 20, db);
			const newWithChar = newCards.map((c: Character) => ({ character: c, review: undefined }));

			queue = [...dueWithChar, ...newWithChar];
			sessionId = crypto.randomUUID();
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to load';
		} finally {
			loading = false;
		}
	});

	async function submitGrade(grade: number) {
		const item = queue[currentIndex];
		if (!item) return;
		const responseTimeMs = shownAt ? Math.round(performance.now() - shownAt) : 0;
		const correct = grade >= 3;
		const review = item.review ?? {
			itemId: item.character.id,
			itemType: 'character' as const,
			script: scriptId,
			easeFactor: 2.5,
			interval: 0,
			repetitions: 0,
			nextReview: new Date().toISOString(),
			lastReview: new Date().toISOString()
		};
		const next = calculateNextReview(review, grade);
		const toPut = {
			...review,
			easeFactor: next.easeFactor,
			interval: next.interval,
			repetitions: next.repetitions,
			nextReview: next.nextReview,
			lastReview: next.lastReview
		};
		await db.reviews.put({
			...toPut,
			itemId: item.character.id,
			script: scriptId
		} as Review);
		try {
			await api.progress.submitAttempts({
				sessionId,
				attempts: [
					{
						itemId: item.character.id,
						script: scriptId,
						stepType: 'review',
						correct,
						responseTimeMs,
						uuidLocal: crypto.randomUUID()
					}
				]
			});
		} catch {
			// Keep local state; server sync can retry later
		}
		if (currentIndex < queue.length - 1) {
			currentIndex += 1;
			shownAt = performance.now();
		} else {
			goto('/dashboard');
		}
	}

	const current = $derived(queue[currentIndex]);

	$effect(() => {
		if (current) shownAt = performance.now();
	});
</script>

<svelte:head>
	<title>{scriptDef?.name ?? scriptId} — Learn</title>
</svelte:head>

<div class="max-w-[800px] mx-auto p-8">
	{#if loading}
		<p class="text-[var(--muted-foreground)]">Loading…</p>
	{:else if error}
		<p class="text-[var(--color-error)]">{error}</p>
		<a href="/learn" class="text-[var(--accent-green)] underline">Back to scripts</a>
	{:else if !current}
		<p class="text-[var(--muted-foreground)]">No cards to review.</p>
		<a href="/dashboard" class="text-[var(--accent-green)] underline">Dashboard</a>
	{:else}
		<div class="rounded-[var(--radius-l)] border border-[var(--border)] bg-[var(--card)] p-12 shadow-[var(--shadow-card)] text-center">
			<p class="text-6xl mb-6 text-[var(--foreground)]">{current.character.character}</p>
			<p class="text-[14px] text-[var(--muted-foreground)] mb-8">
				{currentIndex + 1} / {queue.length}
			</p>
			<div class="flex justify-center gap-4">
				<button
					type="button"
					onclick={() => submitGrade(0)}
					class="rounded-[var(--radius-m)] border border-[var(--border)] bg-[var(--card)] px-6 py-3 text-[14px] font-medium text-[var(--foreground)] hover:bg-[var(--secondary)]"
				>
					Fail
				</button>
				<button
					type="button"
					onclick={() => submitGrade(3)}
					class="rounded-[var(--radius-m)] border border-[var(--border)] bg-[var(--card)] px-6 py-3 text-[14px] font-medium text-[var(--foreground)] hover:bg-[var(--secondary)]"
				>
					Pass
				</button>
				<button
					type="button"
					onclick={() => submitGrade(5)}
					class="rounded-[var(--radius-m)] bg-[var(--accent-green)] px-6 py-3 text-[14px] font-medium text-white hover:opacity-90"
				>
					Easy
				</button>
			</div>
		</div>
	{/if}
</div>
