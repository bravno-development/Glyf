<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { db, type Character, type Review } from '$lib/services/db';
	import { getScript, seedCharacters, type ScriptDefinition } from '$lib/services/scripts';
	import { getDueCharacters, getNewCards, calculateNextReview } from '$lib/services/srs';
	import { learnStore } from '$lib/stores/learn';
	import { api } from '$lib/services/api';
	import { userStore } from '$lib/stores/user';
	import AppShell from '$lib/components/AppShell.svelte';
	import { ArrowLeft, X, Lightbulb, ChevronRight, Play, ArrowRight } from 'lucide-svelte';
	import { BookOpen } from 'lucide-svelte';

	const scriptId = $derived($page.params.scriptId ?? '');

	let phase = $state<'loading' | 'intro' | 'quiz'>('loading');
	let scriptDef = $state<ScriptDefinition | null>(null);
	let introBatch = $state<Character[]>([]);
	let introIndex = $state(0);
	let queue = $state<Array<{ character: Character; review?: Review }>>([]);
	let currentIndex = $state(0);
	let sessionId = $state<string>('');
	let error = $state<string | null>(null);
	let shownAt = $state(0);
	let hintShown = $state(false);
	let selectedIndex = $state<number | null>(null);

	function getPrimaryOption(c: Character): string {
		return c.readings?.[0] ?? c.meaning ?? '';
	}

	function getLessonLabel(def: ScriptDefinition | null, batch: Character[]): string {
		if (!def || batch.length === 0) return def?.name ?? '';
		return batch.length === 1
			? `${def.name} · ${batch[0].character}`
			: `${def.name} · ${batch.length} characters`;
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

	const optionsForCurrent = $derived.by(() => {
		const cur = queue[currentIndex];
		if (!cur) return { options: [], correctIndex: 0 };
		const allChars = queue.map((x) => x.character);
		return buildOptions(cur.character, allChars);
	});

	$effect(() => {
		if (!$userStore.initialised) return;
		if (!$userStore.isAuthenticated) {
			goto('/auth/login');
		}
	});

	onMount(async () => {
		if (!scriptId) return;
		const modeReview = $page.url.searchParams.get('mode') === 'review';
		try {
			await learnStore.load();
			const def = await getScript(scriptId);
			scriptDef = def;
			await seedCharacters(scriptId);

			if (modeReview) {
				await loadQuiz();
				return;
			}

			const batch = await learnStore.getIntroBatch(scriptId);
			if (batch.length > 0) {
				introBatch = batch;
				introIndex = 0;
				phase = 'intro';
				return;
			}

			await loadQuiz();
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to load';
			phase = 'quiz';
		}
	});

	async function loadQuiz(): Promise<void> {
		phase = 'loading';
		try {
			const due = await getDueCharacters(scriptId, db);
			const dueChars = await db.characters.where('script').equals(scriptId).toArray();
			const charMap = new Map(dueChars.map((c: Character) => [c.id, c]));
			const dueWithChar = due
				.filter((r: Review) => r.itemType === 'character')
				.map((r: Review) => ({
					character: charMap.get(r.itemId)!,
					review: r,
				}))
				.filter((x) => x.character);

			const dailyCap = $learnStore.dailyGoalByScript[scriptId] ?? 15;
			const introduced = learnStore.getIntroducedTodayCount(scriptId);
			const remaining = Math.max(0, dailyCap - introduced);
			const newCards = await getNewCards(scriptId, remaining, db);
			const newWithChar = newCards.map((c: Character) => ({ character: c, review: undefined }));

			queue = [...dueWithChar, ...newWithChar];
			sessionId = crypto.randomUUID();
			phase = 'quiz';
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to load';
			phase = 'quiz';
		}
	}

	async function startQuiz(): Promise<void> {
		learnStore.incrementIntroducedToday(scriptId, introBatch.length);
		await loadQuiz();
	}

	function prevIntro(): void {
		if (introIndex > 0) introIndex -= 1;
	}

	function nextIntro(): void {
		if (introIndex < introBatch.length - 1) introIndex += 1;
	}

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
			lastReview: new Date().toISOString(),
		};
		const next = calculateNextReview(review, grade);
		const toPut = {
			...review,
			easeFactor: next.easeFactor,
			interval: next.interval,
			repetitions: next.repetitions,
			nextReview: next.nextReview,
			lastReview: next.lastReview,
		};
		await db.reviews.put({
			...toPut,
			itemId: item.character.id,
			script: scriptId,
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
						uuidLocal: crypto.randomUUID(),
					},
				],
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
	const progressPercent = $derived(
		queue.length > 0 ? ((currentIndex + 1) / queue.length) * 100 : 0
	);
	const introChar = $derived(introBatch[introIndex]);
	const introducedToday = $derived.by(() => learnStore.getIntroducedTodayCount(scriptId));
	const dailyGoalForScript = $derived($learnStore.dailyGoalByScript[scriptId] ?? 15);
	const remainingQuota = $derived(Math.max(0, dailyGoalForScript - introducedToday));

	$effect(() => {
		if (current) shownAt = performance.now();
	});

	let keyboardEnabled = $state(false);
	let reviewOptionKeys = $state<string[]>(['1', '2', '3', '4']);
	onMount(() => {
		reviewOptionKeys = learnStore.getReviewOptionKeys();
		const unsubKeys = learnStore.reviewOptionKeysStore.subscribe((k) => {
			reviewOptionKeys = k;
		});
		const mq = window.matchMedia('(pointer: fine)');
		keyboardEnabled = mq.matches;
		if (!mq.matches) {
			return unsubKeys;
		}
		const handler = (e: KeyboardEvent) => {
			if (phase !== 'quiz') return;
			if (error || !current || optionsForCurrent.options.length === 0) return;
			if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)
				return;
			const keys = learnStore.getReviewOptionKeys();
			const i = keys.indexOf(e.key);
			if (i >= 0 && i < optionsForCurrent.options.length) chooseOption(i);
		};
		window.addEventListener('keydown', handler);
		return () => {
			window.removeEventListener('keydown', handler);
			unsubKeys();
		};
	});
</script>

<svelte:head>
	<title>{scriptDef?.name ?? scriptId} — Learn</title>
</svelte:head>

<AppShell>
	<main class="flex-1 overflow-y-auto bg-[var(--background)]">
		{#if phase === 'loading'}
			<div class="flex flex-1 items-center justify-center p-8">
				<p class="text-[var(--muted-foreground)]">Loading…</p>
			</div>
		{:else if error && phase === 'quiz'}
			<div class="flex flex-1 flex-col items-start justify-center gap-4 p-8">
				<p class="text-[var(--color-error)]">{error}</p>
				<a href="/learn" class="text-[var(--accent-green)] underline">Back to scripts</a>
			</div>
		{:else if phase === 'intro'}
			<!-- Intro phase: Character Introduction -->
			<div class="flex flex-1 flex-col gap-8 p-6 px-4 md:p-10 md:px-12">
				<!-- Header -->
				<div class="flex items-center justify-between">
					<div class="flex flex-col gap-1">
						<h1 class="text-[28px] font-semibold text-[var(--foreground)]">
							Learn New Characters
						</h1>
						<p class="text-[14px] text-[var(--muted-foreground)]">
							{getLessonLabel(scriptDef, introBatch)}
						</p>
					</div>
					<div class="flex items-center gap-4">
						<span class="text-[14px] font-medium text-[var(--muted-foreground)]">
							{introIndex + 1} of {introBatch.length} characters
						</span>
						<button
							type="button"
							onclick={startQuiz}
							class="flex items-center gap-2 rounded-[var(--radius-pill)] bg-[var(--primary)] px-5 py-2.5 text-[14px] font-semibold text-[var(--primary-foreground)] transition-opacity hover:opacity-90"
						>
							<Play size={16} />
							Start quiz
						</button>
					</div>
				</div>

				<!-- Progress dots -->
				<div class="flex items-center gap-2">
					{#each introBatch as _, i (i)}
						<div
							class="h-1.5 flex-1 rounded-[var(--radius-pill)] {i <= introIndex
								? 'bg-[var(--primary)]'
								: 'bg-[var(--border)]'}"
						></div>
					{/each}
				</div>

				<!-- Main content: two columns -->
				<div class="flex flex-1 flex-col gap-10 lg:flex-row">
					<!-- Left: Character card + reading -->
					<div class="flex flex-1 flex-col items-center justify-center gap-8">
						{#if introChar}
							<div
								class="flex h-[240px] w-[240px] md:h-[320px] md:w-[320px] items-center justify-center rounded-[var(--radius-m)] border border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow-card)]"
							>
								<span
									class="text-[100px] md:text-[140px] font-normal text-[var(--foreground)]"
									lang="ja"
								>
									{introChar.character}
								</span>
							</div>
							<div class="flex flex-col items-center gap-2">
								<span
									class="text-[36px] font-bold tracking-tight text-[var(--foreground)]"
								>
									{getPrimaryOption(introChar)}
								</span>
								<p class="text-[15px] text-[var(--muted-foreground)]">
									Pronounced like "{getPrimaryOption(introChar)}"
								</p>
								<span
									class="rounded-[var(--radius-pill)] bg-[var(--accent-light-green)] px-4 py-1.5 text-[12px] font-medium text-[var(--accent-green)]"
								>
									{introChar.character} {scriptDef?.name ?? scriptId}
								</span>
							</div>
						{/if}
					</div>

					<!-- Right: Mnemonic, Examples, Lesson characters -->
					<div class="flex w-full max-w-[420px] flex-col justify-center gap-6 min-w-0">
						<!-- Mnemonic card -->
						<div
							class="rounded-[var(--radius-m)] border border-[var(--border)] bg-[var(--card)] p-6 shadow-[var(--shadow-card)]"
						>
							<div class="mb-3 flex items-center gap-2">
								<Lightbulb size={18} class="shrink-0 text-[var(--accent-warm)]" />
								<span class="text-[15px] font-semibold text-[var(--foreground)]"
									>Memory trick</span
								>
							</div>
							<p class="text-[14px] leading-[1.5] text-[var(--muted-foreground)]">
								{#if introChar}
									Think of the reading "{getPrimaryOption(introChar)}" — the character
									{introChar.character} represents this sound.
								{/if}
							</p>
						</div>

						<!-- Examples card -->
						<div
							class="rounded-[var(--radius-m)] border border-[var(--border)] bg-[var(--card)] p-6 shadow-[var(--shadow-card)]"
						>
							<div class="mb-3 flex items-center gap-2">
								<BookOpen size={18} class="shrink-0 text-[var(--primary)]" />
								<span class="text-[15px] font-semibold text-[var(--foreground)]"
									>Used in words</span
								>
							</div>
							<div class="flex flex-col gap-3">
								<p class="text-[14px] text-[var(--muted-foreground)]">
									{#if introChar}
										Words using {introChar.character} will appear as you learn more
										characters.
									{/if}
								</p>
							</div>
						</div>

						<!-- Lesson characters + nav -->
						<div class="flex flex-col gap-3">
							<p class="text-[13px] font-medium text-[var(--muted-foreground)]">
								Characters in this lesson
							</p>
							<div class="flex justify-center gap-2 mb-4">
								{#each introBatch as char, i (char.id)}
									<button
										type="button"
										onclick={() => (introIndex = i)}
										class="flex h-14 w-14 items-center justify-center rounded-xl text-[22px] font-normal transition-colors {i === introIndex
											? 'border-2 border-[var(--primary)] bg-[var(--primary)] text-[var(--primary-foreground)]'
											: 'border border-[var(--border)] bg-[var(--tile)] text-[var(--muted-foreground)]'}"
									>
										{char.character}
									</button>
								{/each}
							</div>
							<div class="flex gap-3">
								<button
									type="button"
									onclick={prevIntro}
									disabled={introIndex === 0}
									class="flex flex-1 items-center justify-center gap-2 rounded-[var(--radius-pill)] border border-[var(--input)] bg-transparent px-4 py-2.5 text-[14px] font-medium text-[var(--foreground)] transition-opacity hover:bg-[var(--accent)] disabled:opacity-50"
								>
									<ArrowLeft size={16} />
									Previous
								</button>
								<button
									type="button"
									onclick={introIndex >= introBatch.length - 1 ? startQuiz : nextIntro}
									class="flex flex-1 items-center justify-center gap-2 rounded-[var(--radius-pill)] bg-[var(--primary)] px-4 py-2.5 text-[14px] font-medium text-[var(--primary-foreground)] transition-opacity hover:opacity-90 disabled:opacity-50"
								>
									{introIndex >= introBatch.length - 1 ? 'Start quiz' : 'Next character'}
									{#if introIndex >= introBatch.length - 1}
										<Play size={16} />
									{:else}
										<ArrowRight size={16} />
									{/if}
								</button>
							</div>
						</div>
					</div>
				</div>

				{#if remainingQuota < dailyGoalForScript}
					<p class="text-[13px] text-[var(--muted-foreground)]">
						{introducedToday} of {dailyGoalForScript} new characters introduced today.
					</p>
				{/if}
			</div>
		{:else}
			<!-- Quiz phase -->
			{#if !current}
				<div class="flex flex-1 flex-col items-start justify-center gap-4 p-8">
					<p class="text-[var(--muted-foreground)]">No cards to review.</p>
					<a href="/dashboard" class="text-[var(--accent-green)] underline"
						>Dashboard</a
					>
				</div>
			{:else}
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

				<main class="flex flex-1 flex-col items-center gap-10 px-6 pb-8 pt-2 md:px-8 md:items-stretch">
					<div class="flex flex-col items-center gap-2 w-full max-w-[320px] md:max-w-none">
						<p class="text-[15px] font-medium text-[var(--muted-foreground)]">
							What is this character?
						</p>
						<span
							class="rounded-[var(--radius-pill)] bg-[var(--accent-light-green)] px-3 py-1 text-[11px] font-semibold text-[var(--accent-green)]"
						>
							{scriptDef?.name ?? scriptId}
						</span>
					</div>

					<div
						class="flex h-[180px] w-full max-w-[280px] flex-shrink-0 items-center justify-center self-center rounded-[20px] border border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow-card)]"
					>
						<span class="text-[80px] font-normal text-[var(--foreground)]" lang="ja">
							{current.character.character}
						</span>
					</div>

					{#if optionsForCurrent.options.length >= 4}
						<div class="grid w-full max-w-[320px] grid-cols-2 gap-3 md:max-w-none">
							{#each optionsForCurrent.options as option, i (i)}
								<button
									type="button"
									onclick={() => chooseOption(i)}
									disabled={selectedIndex !== null}
									class={optionClass(i)}
								>
									{#if keyboardEnabled && reviewOptionKeys[i]}
										<span class="sr-only">Option key {reviewOptionKeys[i]}: </span>
										<span
											class="mr-2 inline-flex h-6 min-w-6 items-center justify-center rounded border border-[var(--border)] bg-[var(--accent)] px-1.5 text-[12px] font-medium text-[var(--muted-foreground)]"
											aria-hidden="true"
										>
											{reviewOptionKeys[i]}
										</span>
									{/if}
									{option}
								</button>
							{/each}
						</div>
					{:else}
						<div class="grid w-full max-w-[320px] grid-cols-2 gap-3 md:max-w-none">
							{#each optionsForCurrent.options as option, i (i)}
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

					<div class="mt-auto flex w-full max-w-[320px] items-center justify-between md:max-w-none">
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
		{/if}
	</main>
</AppShell>
