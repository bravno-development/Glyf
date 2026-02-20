<script lang="ts">
	import { goto } from "$app/navigation";
	import { onMount } from "svelte";
	import { userStore } from "$lib/stores/user";
	import { Play, RefreshCcw, BookOpen, Clock } from "lucide-svelte";
	import AppShell from "$lib/components/AppShell.svelte";
	import {
		type CharacterGridItem,
		type MasteryBreakdown,
		type ScriptProgressItem,
		type ScriptStudyState,
		type UpcomingReviewItem,
		type WeeklyActivityItem,
		getCharacterGrid,
		getUpcomingReviews,
		getWeeklyActivity,
		getMasteryColour,
	} from "$lib/services/dashboard";
	import { getScript, getCharactersInOrder, type ScriptDefinition } from "$lib/services/scripts";
	import { learnStore } from "$lib/stores/learn";
	import { syncToServer, syncFromServer } from "$lib/services/sync";

	let studyStates: ScriptStudyState[] = $state([]);
	let grid: CharacterGridItem[] = $state([]);
	let upcomingReviews: UpcomingReviewItem[] = $state([]);
	let weeklyActivity: WeeklyActivityItem[] = $state([]);
	let loaded = $state(false);

	let scriptDef: ScriptDefinition | null = $state(null);
	let activeScript = $state("");
	let loadingScript = $state(false);
	let refreshing = $state(false);

	const masteryLevels = [
		{ key: "mastered" as const, label: "Mastered" },
		{ key: "good" as const, label: "Good" },
		{ key: "learning" as const, label: "Learning" },
		{ key: "difficult" as const, label: "Difficult" },
		{ key: "new" as const, label: "New" },
	];

	// All dashboard stats derived from the active script's study state
	const activeStudyState = $derived(studyStates.find((s) => s.script === activeScript));
	const breakdown = $derived<MasteryBreakdown>(
		activeStudyState?.masteryBreakdown ?? { mastered: 0, good: 0, learning: 0, difficult: 0, new: 0 }
	);
	const learnt = $derived(breakdown.mastered + breakdown.good + breakdown.learning + breakdown.difficult);
	const dueToday = $derived(activeStudyState?.itemsToReview.length ?? 0);
	const charsLeftToday = $derived(activeStudyState?.itemsToLearn.length ?? 0);
	const hasUnlearnedGlyphs = $derived((activeStudyState?.masteryBreakdown.new ?? 0) > 0 || charsLeftToday > 0);
	const isDailyGoalMet = $derived(hasUnlearnedGlyphs && charsLeftToday === 0);
	const hasDueReviews = $derived(dueToday > 0);
	const startStudyingDisabled = $derived(!hasUnlearnedGlyphs || isDailyGoalMet);

	// Script progress bars derived from study states — no separate DB call needed
	const scriptProgress = $derived<ScriptProgressItem[]>(
		studyStates.map((s) => {
			const total = Object.values(s.masteryBreakdown).reduce((a, b) => a + b, 0);
			const learntCount = total - s.masteryBreakdown.new;
			return {
				script: s.script,
				label: s.label,
				percentage: total > 0 ? Math.round((learntCount / total) * 100) : 0,
				total,
				learnt: learntCount,
			};
		})
	);

	async function loadGridAndReviews(scriptId: string): Promise<void> {
		if (!scriptId) {
			grid = [];
			upcomingReviews = [];
			scriptDef = null;
			loadingScript = false;
			return;
		}
		loadingScript = true;
		try {
			const def = await getScript(scriptId);
			if (activeScript !== scriptId) return;
			scriptDef = def;
			const [g, ur] = await Promise.all([
				getCharacterGrid(scriptId),
				getUpcomingReviews(scriptId),
			]);
			if (activeScript !== scriptId) return;
			grid = g;
			upcomingReviews = ur;
		} finally {
			if (activeScript === scriptId) loadingScript = false;
		}
	}

	$effect(() => {
		if (!$userStore.initialised) return;
		if (!$userStore.isAuthenticated) {
			goto("/auth/login");
		}
	});

	async function refreshDashboard(): Promise<void> {
		refreshing = true;
		try {
			// Push local changes first, then pull — ensures a clean baseline
			await syncToServer();
			await syncFromServer();

			await learnStore.load();
			studyStates = await learnStore.getDashboardData();
			weeklyActivity = await getWeeklyActivity();

			const currentScript = studyStates.some((s) => s.script === activeScript)
				? activeScript
				: studyStates[0]?.script ?? "";
			activeScript = currentScript;
			await loadGridAndReviews(currentScript);
		} catch {
			// IndexedDB may not be populated yet — show zeroes
		} finally {
			refreshing = false;
		}
	}

	onMount(async () => {
		try {
			await refreshDashboard();
		} catch {
			// IndexedDB may not be populated yet — show zeroes
		}
		loaded = true;
	});

	async function setActiveScript(scriptId: string): Promise<void> {
		activeScript = scriptId;
		await loadGridAndReviews(scriptId);
	}

	function getGridCharMastery(char: string): string {
		const item = grid.find(g => g.character === char);
		return getMasteryColour(item?.mastery ?? "new");
	}

	function breakdownTotal(): number {
		return Object.values(breakdown).reduce((s, v) => s + v, 0);
	}

	function barPercent(count: number): number {
		const total = breakdownTotal();
		return total > 0 ? (count / total) * 100 : 0;
	}

	function donutGradient(): string {
		const total = breakdownTotal();
		if (total === 0) return "conic-gradient(var(--muted) 0 100%)";
		let acc = 0;
		const stops = masteryLevels.map((level) => {
			const pct = (breakdown[level.key] / total) * 100;
			const start = acc;
			acc += pct;
			return `${getMasteryColour(level.key)} ${start}% ${acc}%`;
		});
		return `conic-gradient(${stops.join(", ")})`;
	}

	function maxWeekly(): number {
		return Math.max(...weeklyActivity.map(w => w.count), 1);
	}
</script>

<svelte:head>
	<title>Dashboard — Glyf</title>
</svelte:head>

<AppShell>
	<main class="flex-1 overflow-y-auto bg-[var(--background)]">
		<div class="flex flex-col gap-8 p-6 px-4 md:p-10 md:px-12">
			<!-- Header -->
			<div class="flex flex-col md:flex-row items-start md:items-center justify-between">
				<div class="mb-4 md:mb-0 flex w-full flex-row items-start justify-between gap-3 md:w-auto">
					<div>
						<h1 class="text-[28px] font-semibold text-[var(--foreground)]">Dashboard</h1>
						<p class="mt-1 text-[14px] text-[var(--muted-foreground)]">
							Track your script learning progress
						</p>
					</div>
					<button
						type="button"
						class="shrink-0 rounded-[var(--radius-pill)] p-2.5 text-[var(--muted-foreground)] transition-colors hover:bg-[var(--tile)] hover:text-[var(--foreground)] disabled:cursor-not-allowed disabled:opacity-60 md:hidden"
						aria-label="Refresh dashboard"
						aria-busy={refreshing}
						disabled={refreshing}
						onclick={() => refreshDashboard()}
					>
						<RefreshCcw size={22} class={refreshing ? 'animate-spin' : ''} />
					</button>
				</div>
				<div class="flex flex-row gap-3">
					{#if startStudyingDisabled}
						<span
							class="flex items-center gap-2 rounded-[var(--radius-pill)] bg-[var(--accent-green)] px-5 py-2.5 text-[14px] font-semibold text-white opacity-50 cursor-not-allowed"
							aria-disabled="true"
						>
							<Play size={16} class="text-white" />
							Start Studying
						</span>
					{:else}
						<a
							href={studyStates.length > 0 ? `/learn/${activeScript || studyStates[0]?.script || ''}` : '/onboarding'}
							class="flex items-center gap-2 rounded-[var(--radius-pill)] bg-[var(--accent-green)] px-5 py-2.5 text-[14px] font-semibold text-white no-underline transition-opacity hover:opacity-90"
						>
							<Play size={16} class="text-white" />
							Start Studying
						</a>
					{/if}
					{#if hasDueReviews}
						<a
							href={studyStates.length > 0 ? `/learn/${activeScript || studyStates[0]?.script || ''}?mode=review` : '/onboarding'}
							class="flex items-center gap-2 rounded-[var(--radius-pill)] bg-[var(--accent-review)] px-5 py-2.5 text-[14px] font-semibold text-[var(--accent-review-foreground)] no-underline transition-opacity hover:opacity-90"
						>
							<RefreshCcw size={16} class="text-[var(--accent-review-foreground)]" />
							Review
						</a>
					{:else}
						<span
							class="flex items-center gap-2 rounded-[var(--radius-pill)] bg-[var(--accent-review)] px-5 py-2.5 text-[14px] font-semibold text-[var(--accent-review-foreground)] opacity-50 cursor-not-allowed"
							aria-disabled="true"
						>
							<RefreshCcw size={16} class="text-[var(--accent-review-foreground)]" />
							Review
						</span>
					{/if}
				</div>
			</div>

			<!-- Language tabs + Stats for selected script -->
			{#if studyStates.length > 0}
			<div class="flex flex-col gap-4">
				<div
					class="flex h-14 w-full min-w-0 max-w-full items-center gap-2 overflow-x-auto rounded-[var(--radius-pill)] border border-[var(--input)] bg-[var(--card)] p-2 md:w-fit overflow-y-hidden"
					role="tablist"
				>
					{#each studyStates as sp (sp.script)}
						<button
							type="button"
							role="tab"
							aria-selected={activeScript === sp.script}
							class="shrink-0 rounded-[var(--radius-pill)] px-6 py-2.5 text-[14px] font-normal transition-colors {activeScript === sp.script
								? 'bg-[var(--secondary)] text-[var(--secondary-foreground)] shadow-[0_1px_3.5px_-1px_rgba(0,0,0,0.06)]'
								: 'bg-transparent text-[var(--accent-foreground)] hover:bg-[var(--tile)] hover:text-[var(--foreground)]'}"
							onclick={() => setActiveScript(sp.script)}
						>
							{sp.label}
						</button>
					{/each}
				</div>

				<!-- Stats Row (for active script) -->
				<div
					class="grid grid-cols-1 gap-5 sm:grid-cols-3"
					aria-busy={loadingScript}
					aria-live="polite"
				>
					<div class="rounded-[var(--radius-m)] border border-[var(--border)] bg-[var(--card)] p-6 shadow-[var(--shadow-card)]">
						<div class="flex items-center justify-between">
							<span class="text-[13px] font-medium text-[var(--muted-foreground)]">Progress</span>
							<BookOpen size={18} class="text-[var(--muted-foreground)]" />
						</div>
						<p class="mt-3 text-[32px] font-bold text-[var(--foreground)] {loadingScript ? 'animate-pulse opacity-60' : ''}">
							{loadingScript ? '—' : (learnt + "/" + scriptDef?.totalCharacters)}
						</p>
					</div>

					<div class="rounded-[var(--radius-m)] border border-[var(--border)] bg-[var(--card)] p-6 shadow-[var(--shadow-card)]">
						<div class="flex items-center justify-between">
							<span class="text-[13px] font-medium text-[var(--muted-foreground)]">Characters left to learn today</span>
							<Clock size={18} class="text-[var(--muted-foreground)]" />
						</div>
						<p class="mt-3 text-[32px] font-bold text-[var(--foreground)] {loadingScript ? 'animate-pulse opacity-60' : ''}">
							{loadingScript ? '—' : charsLeftToday}
						</p>
					</div>

					<div class="rounded-[var(--radius-m)] border border-[var(--border)] bg-[var(--card)] p-6 shadow-[var(--shadow-card)]">
						<div class="flex items-center justify-between">
							<span class="text-[13px] font-medium text-[var(--muted-foreground)]">Due for review</span>
							<RefreshCcw size={18} class="text-[var(--muted-foreground)]" />
						</div>
						<p class="mt-3 text-[32px] font-bold text-[var(--foreground)] {loadingScript ? 'animate-pulse opacity-60' : ''}">
							{loadingScript ? '—' : dueToday}
						</p>
					</div>
				</div>
			</div>
			{:else}
				<p class="text-[14px] text-[var(--muted-foreground)]">
					You haven't started any script yet.
					<a href="/learn" class="font-medium text-[var(--accent-green)] no-underline hover:underline">
						Choose a script from Learn
					</a>
					to see your stats here.
				</p>
			{/if}

			<!-- Main Columns -->
			<div class="flex flex-col gap-6 lg:flex-row">
				<!-- Left Column -->
				<div class="flex flex-1 flex-col gap-6">
					<!-- Character Grid Card -->
					{#if studyStates.length === 0}
					<div class="rounded-[var(--radius-m)] border border-[var(--border)] bg-[var(--card)] p-6 shadow-[var(--shadow-card)]">
						<p class="text-[14px] text-[var(--muted-foreground)]">
							You haven't started any script yet. <a href="/learn" class="font-medium text-[var(--accent-green)] no-underline hover:underline">Choose a script from Learn</a> to begin.
						</p>
					</div>
					{:else if scriptDef?.characters?.length}
					<div
						class="rounded-[var(--radius-m)] border border-[var(--border)] bg-[var(--card)] p-6 shadow-[var(--shadow-card)] transition-opacity {loadingScript ? 'opacity-60' : ''}"
						aria-busy={loadingScript}
					>
						<div class="mb-4 flex items-center justify-between">
							<div class="flex items-center gap-3">
								{#each masteryLevels as level (level.key)}
									<div class="flex items-center gap-1.5">
										<span
											class="inline-block h-2.5 w-2.5 rounded-full"
											style="background-color: {getMasteryColour(level.key)}"
										></span>
										<span class="text-[11px] text-[var(--muted-foreground)]">{level.label}</span>
									</div>
								{/each}
							</div>
						</div>
						<div class="flex flex-wrap gap-1.5">
							{#each getCharactersInOrder(scriptDef) as c (c.id)}
								<div
									class="flex h-[52px] w-[52px] items-center justify-center rounded-lg text-[18px] font-medium text-[var(--black)]"
									style="background-color: {getGridCharMastery(c.character)};"
									title={c.character}
								>
									{c.character}
								</div>
							{/each}
						</div>

						{#if scriptDef.extra?.length}
							<div class="mt-6 border-t border-[var(--border)] pt-6">
								<h3 class="mb-3 text-[14px] font-semibold text-[var(--muted-foreground)]">Extra</h3>
								{#each scriptDef.extra as section (section.title)}
									<div class="mb-4 last:mb-0">
										<p class="mb-2 text-[12px] font-medium text-[var(--muted-foreground)]">{section.title}</p>
										<div class="flex flex-wrap gap-1.5">
											{#each section.characters as ec, i (section.title + ec.character + i)}
												<div
													class="flex h-[52px] w-[52px] items-center justify-center rounded-lg text-[18px] font-medium text-[var(--black)]"
													style="background-color: {getGridCharMastery(ec.character)};"
													title={ec.character}
												>
													{ec.character}
												</div>
											{/each}
										</div>
									</div>
								{/each}
							</div>
						{/if}
					</div>
					{/if}

					<!-- Mastery Breakdown Card -->
					{#if activeScript}
					<div
						class="rounded-[var(--radius-m)] border border-[var(--border)] bg-[var(--card)] p-6 shadow-[var(--shadow-card)] transition-opacity {loadingScript ? 'opacity-60' : ''}"
						aria-busy={loadingScript}
					>
						<h2 class="mb-4 text-[16px] font-semibold text-[var(--foreground)]">Mastery Breakdown</h2>

						<!-- Mobile: donut + compact legend -->
						<div class="block sm:hidden">
							<div class="flex flex-col items-center gap-4">
								<div class="relative flex h-32 w-32 shrink-0 items-center justify-center">
									<div
										class="h-full w-full rounded-full"
										style="background: {donutGradient()}"
										aria-hidden="true"
									></div>
									<div
										class="absolute inset-0 m-auto flex h-16 w-16 items-center justify-center rounded-full bg-[var(--card)]"
										aria-hidden="true"
									>
										<span class="text-[14px] font-semibold text-[var(--foreground)]">
											{breakdownTotal()}
										</span>
									</div>
								</div>
								<div class="grid w-full grid-cols-2 gap-x-4 gap-y-2">
									{#each masteryLevels as level (level.key)}
										<div class="flex items-center gap-1.5">
											<span
												class="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
												style="background-color: {getMasteryColour(level.key)}"
											></span>
											<span class="text-[12px] text-[var(--muted-foreground)]">
												{level.label}: {breakdown[level.key]}
											</span>
										</div>
									{/each}
								</div>
							</div>
						</div>

						<!-- Desktop: stacked bar + legend -->
						<div class="hidden sm:block">
							<div class="flex h-4 w-full overflow-hidden rounded-[var(--radius-pill)]">
								{#each masteryLevels as level (level.key)}
									{#if breakdown[level.key] > 0}
										<div
											style="width: {barPercent(breakdown[level.key])}%; background-color: {getMasteryColour(level.key)}"
										></div>
									{/if}
								{/each}
							</div>
							<div class="mt-4 flex items-center gap-5">
								{#each masteryLevels as level (level.key)}
									<div class="flex items-center gap-1.5">
										<span
											class="inline-block h-2.5 w-2.5 rounded-full"
											style="background-color: {getMasteryColour(level.key)}"
										></span>
										<span class="text-[12px] text-[var(--muted-foreground)]">
											{level.label}: {breakdown[level.key]}
										</span>
									</div>
								{/each}
							</div>
						</div>
					</div>
					{/if}
				</div>

				<!-- Right Column -->
				<div class="flex w-full shrink-0 flex-col gap-6 lg:w-[340px]">
					<!-- Script Progress Card -->
					<div class="rounded-[var(--radius-m)] border border-[var(--border)] bg-[var(--card)] p-6 shadow-[var(--shadow-card)]">
						<h2 class="mb-4 text-[16px] font-semibold text-[var(--foreground)]">Script Progress</h2>

						<div class="flex flex-col gap-4">
							{#each scriptProgress as sp (sp.script)}
								<div>
									<div class="mb-1.5 flex items-center justify-between">
										<span class="text-[13px] font-medium text-[var(--foreground)]">{sp.label}</span>
										<span class="text-[13px] font-semibold text-[var(--accent-green)]">{sp.percentage}%</span>
									</div>
									<div class="h-2 w-full overflow-hidden rounded-[var(--radius-pill)] bg-[var(--secondary)]">
										<div
											class="h-full rounded-[var(--radius-pill)] bg-[var(--accent-green)]"
											style="width: {sp.percentage}%;"
										></div>
									</div>
								</div>
							{/each}
						</div>
					</div>

					<!-- Upcoming Reviews Card -->
					<div
						class="rounded-[var(--radius-m)] border border-[var(--border)] bg-[var(--card)] p-6 shadow-[var(--shadow-card)] transition-opacity {loadingScript ? 'opacity-60' : ''}"
						aria-busy={loadingScript}
					>
						<div class="mb-4 flex items-center justify-between">
							<h2 class="text-[16px] font-semibold text-[var(--foreground)]">Upcoming Reviews</h2>
							<a href="/learn" class="text-[12px] font-medium text-[var(--accent-green)] no-underline">View all</a>
						</div>

						<div class="flex flex-col">
							{#each upcomingReviews as review, i (review.character + i)}
								<div class="flex items-center justify-between border-t border-[var(--border)] py-3">
									<div class="flex items-center gap-3">
										<span class="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--tile)] text-[16px] font-medium text-[var(--foreground)]">
											{review.character}
										</span>
										<div>
											<p class="text-[13px] font-medium text-[var(--foreground)]">{review.reading}</p>
											<p class="text-[11px] text-[var(--muted-foreground)]">{review.interval}d interval</p>
										</div>
									</div>
									<span class="text-[12px] font-medium text-[var(--muted-foreground)]">{review.dueIn}</span>
								</div>
							{/each}
							{#if upcomingReviews.length === 0}
								<p class="py-4 text-center text-[13px] text-[var(--muted-foreground)]">No upcoming reviews</p>
							{/if}
						</div>
					</div>

					<!-- This Week Card -->
					<div class="rounded-[var(--radius-m)] border border-[var(--border)] bg-[var(--card)] p-6 shadow-[var(--shadow-card)]">
						<div class="mb-4 flex items-center justify-between">
							<h2 class="text-[16px] font-semibold text-[var(--foreground)]">This Week</h2>
						</div>

						<div class="flex items-end justify-between gap-2" style="height: 100px;">
							{#each weeklyActivity as day, i (i)}
								<div class="flex flex-1 flex-col items-center gap-1.5">
									<div
										class="w-full rounded-t-md bg-[var(--accent-green)]"
										style="height: {day.count > 0 ? Math.max((day.count / maxWeekly()) * 80, 4) : 4}px; opacity: {day.count > 0 ? 1 : 0.2};"
									></div>
									<span class="text-[11px] text-[var(--muted-foreground)]">{day.day}</span>
								</div>
							{/each}
						</div>
					</div>
				</div>
			</div>
		</div>
	</main>
</AppShell>
