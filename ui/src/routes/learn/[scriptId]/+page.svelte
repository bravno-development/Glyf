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
	import { ArrowLeft, X, Lightbulb, ChevronRight } from 'lucide-svelte';

	const scriptId = $derived($page.params.scriptId ?? '');

	let scriptDef = $state<ScriptDefinition | null>(null);
	let queue = $state<Array<{ character: Character; review?: Review }>>([]);
	let currentIndex = $state(0);
	let sessionId = $state<string>('');
	let error = $state<string | null>(null);
	let loading = $state(true);
	let shownAt = $state(0);
	let hintShown = $state(false);
	let selectedIndex = $state<number | null>(null);
	let optionsForCurrent = $state<{ options: string[]; correctIndex: number }>({ options: [], correctIndex: 0 });

	function getPrimaryOption(c: Character): string {
		return c.readings?.[0] ?? c.meaning ?? '';
	}

	function buildOptions(
		currentChar: Character,
		allChars: Character[]
	): { options: string[]; correctIndex: number } {
		const correct = getPrimaryOption(currentChar);
		const pool = new Set<string>();
		for (const c of allChars) {
			if (c.id === currentChar.id) continue;
			const primary = getPrimaryOption(c);
			if (primary && primary !== correct) pool.add(primary);
			for (const r of c.readings ?? []) {
				if (r !== correct) pool.add(r);
			}
			if (c.meaning && c.meaning !== correct) pool.add(c.meaning);
		}
		let distractors = [...pool];
		while (distractors.length < 3) {
			if (distractors.length === 0) distractors = [correct, correct, correct];
			else distractors = [...distractors, ...distractors];
		}
		// Shuffle and take 3
		for (let i = distractors.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[distractors[i], distractors[j]] = [distractors[j], distractors[i]];
		}
		const three = distractors.slice(0, 3);
		const options = [correct, ...three];
		for (let i = options.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[options[i], options[j]] = [options[j], options[i]];
		}
		const correctIndex = options.indexOf(correct);
		return { options, correctIndex };
	}

	$effect(() => {
		const cur = queue[currentIndex];
		if (!cur) {
			optionsForCurrent = { options: [], correctIndex: 0 };
			return;
		}
		const allChars = queue.map((x) => x.character);
		optionsForCurrent = buildOptions(cur.character, allChars);
	});

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
		hintShown = false;
		selectedIndex = null;
		if (currentIndex < queue.length - 1) {
			currentIndex += 1;
			shownAt = performance.now();
		} else {
			goto('/dashboard');
		}
	}

	function chooseOption(index: number) {
		if (selectedIndex !== null) return;
		selectedIndex = index;
		const { correctIndex } = optionsForCurrent;
		const grade = index === correctIndex ? 5 : 0;
		setTimeout(() => submitGrade(grade), 600);
	}

	function optionClass(i: number): string {
		const base =
			'flex h-14 items-center justify-center rounded-[12px] border text-[18px] font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--ring)]';
		if (selectedIndex === null) {
			return `${base} border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] hover:bg-[var(--secondary)]`;
		}
		const { correctIndex } = optionsForCurrent;
		const isCorrect = i === correctIndex;
		const isSelected = i === selectedIndex;
		if (isCorrect) {
			return `${base} border-[var(--accent-green)] bg-[var(--color-success)] text-[var(--black)]`;
		}
		if (isSelected) {
			return `${base} border-[var(--color-error)] bg-[var(--color-error)] text-[var(--black)]`;
		}
		return `${base} border-[var(--border)] bg-[var(--card)] text-[var(--muted-foreground)] opacity-60`;
	}

	function skipCard() {
		submitGrade(0);
	}

	const current = $derived(queue[currentIndex]);
	const progressPercent = $derived(queue.length > 0 ? ((currentIndex + 1) / queue.length) * 100 : 0);

	$effect(() => {
		if (current) shownAt = performance.now();
	});

	// Keyboard 1–4 (web only, not mobile)
	let keyboardEnabled = $state(false);
	onMount(() => {
		const mq = window.matchMedia('(pointer: fine)');
		keyboardEnabled = mq.matches;
		if (!mq.matches) return;
		const handler = (e: KeyboardEvent) => {
			if (loading || error || !current || optionsForCurrent.options.length === 0) return;
			if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
			const key = e.key;
			if (key === '1') chooseOption(0);
			else if (key === '2') chooseOption(1);
			else if (key === '3') chooseOption(2);
			else if (key === '4') chooseOption(3);
		};
		window.addEventListener('keydown', handler);
		return () => window.removeEventListener('keydown', handler);
	});
</script>

<svelte:head>
	<title>{scriptDef?.name ?? scriptId} — Learn</title>
</svelte:head>

<div class="flex min-h-screen flex-col bg-[var(--background)]">
	{#if loading}
		<div class="flex flex-1 items-center justify-center p-8">
			<p class="text-[var(--muted-foreground)]">Loading…</p>
		</div>
	{:else if error}
		<div class="flex flex-1 flex-col items-start justify-center gap-4 p-8">
			<p class="text-[var(--color-error)]">{error}</p>
			<a href="/learn" class="text-[var(--accent-green)] underline">Back to scripts</a>
		</div>
	{:else if !current}
		<div class="flex flex-1 flex-col items-start justify-center gap-4 p-8">
			<p class="text-[var(--muted-foreground)]">No cards to review.</p>
			<a href="/dashboard" class="text-[var(--accent-green)] underline">Dashboard</a>
		</div>
	{:else}
		<!-- Header -->
		<header
			class="flex h-14 shrink-0 items-center justify-between border-b border-[var(--border)] bg-[var(--card)] px-6"
		>
			<a
				href="/learn"
				class="flex items-center gap-2 text-[var(--foreground)] no-underline hover:opacity-80"
			>
				<ArrowLeft size={20} class="shrink-0" />
				<span class="text-[18px] font-semibold tracking-tight">Practice</span>
			</a>
			<a
				href="/learn"
				class="flex items-center justify-center rounded-full p-2 text-[var(--muted-foreground)] hover:bg-[var(--secondary)] hover:text-[var(--foreground)]"
				aria-label="Close"
			>
				<X size={20} />
			</a>
		</header>

		<!-- Progress row -->
		<div class="flex shrink-0 items-center gap-3 px-6 py-4">
			<div class="h-1.5 w-full overflow-hidden rounded-[var(--radius-pill)] bg-[var(--muted)]">
				<div
					class="h-full rounded-[var(--radius-pill)] bg-[var(--accent-green)] transition-[width] duration-200"
					style="width: {progressPercent}%"
				></div>
			</div>
			<span class="shrink-0 text-[13px] font-semibold text-[var(--muted-foreground)]">
				{currentIndex + 1}/{queue.length}
			</span>
		</div>

		<!-- Quiz body -->
		<main class="flex flex-1 flex-col gap-10 px-6 pb-8 pt-2 md:px-8">
			<!-- Prompt + script pill -->
			<div class="flex flex-col items-center gap-2">
				<p class="text-[15px] font-medium text-[var(--muted-foreground)]">What is this character?</p>
				<span
					class="rounded-[var(--radius-pill)] bg-[var(--accent-light-green)] px-3 py-1 text-[11px] font-semibold text-[var(--accent-green)]"
				>
					{scriptDef?.name ?? scriptId}
				</span>
			</div>

			<!-- Character card -->
			<div
				class="flex h-[180px] w-full max-w-[280px] flex-shrink-0 items-center justify-center self-center rounded-[20px] bg-[var(--card)] shadow-[var(--shadow-card)]"
			>
				<span class="text-[80px] font-normal text-[var(--foreground)]" lang="ja">
					{current.character.character}
				</span>
			</div>

			<!-- Answer grid 2x2 -->
			{#if optionsForCurrent.options.length >= 4}
				<div class="grid grid-cols-2 gap-3">
					{#each optionsForCurrent.options as option, i}
						<button
							type="button"
							onclick={() => chooseOption(i)}
							disabled={selectedIndex !== null}
							class={optionClass(i)}
						>
							{#if keyboardEnabled}
								<span class="sr-only">Option {i + 1}: </span>
							{/if}
							{option}
						</button>
					{/each}
				</div>
			{:else}
				<!-- Fallback if we couldn't build 4 options -->
				<div class="grid grid-cols-2 gap-3">
					{#each optionsForCurrent.options as option, i}
						<button
							type="button"
							onclick={() => chooseOption(i)}
							disabled={selectedIndex !== null}
							class={optionClass(i)}
						>
							{option}
						</button>
					{/each}
				</div>
			{/if}

			<!-- Hint + Skip -->
			<div class="mt-auto flex w-full items-center justify-between">
				<button
					type="button"
					onclick={() => (hintShown = true)}
					class="flex items-center gap-1.5 text-[13px] font-medium text-[var(--accent-warm)] hover:underline disabled:opacity-50"
					disabled={hintShown}
				>
					<Lightbulb size={16} />
					{hintShown ? getPrimaryOption(current.character) : 'Show hint'}
				</button>
				<button
					type="button"
					onclick={skipCard}
					class="flex items-center gap-1.5 text-[13px] font-medium text-[var(--muted-foreground)] hover:underline"
				>
					Skip
					<ChevronRight size={16} />
				</button>
			</div>
		</main>
	{/if}
</div>
