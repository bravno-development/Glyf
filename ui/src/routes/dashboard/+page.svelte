<script lang="ts">
	import { goto } from "$app/navigation";
	import { onMount } from "svelte";
	import { userStore } from "$lib/stores/user";
	import { api } from "$lib/services/api";
	import { Play, BookOpen, Target, Clock } from "lucide-svelte";
	import Sidebar from "$lib/components/Sidebar.svelte";
	import {
		type DashboardStats,
		type CharacterGridItem,
		type MasteryBreakdown,
		type ScriptProgressItem,
		type UpcomingReviewItem,
		type WeeklyActivityItem,
		getDashboardStats,
		getCharacterGrid,
		getMasteryBreakdown,
		getScriptProgress,
		getUpcomingReviews,
		getWeeklyActivity,
		getMasteryColour,
	} from "$lib/services/dashboard";
	import { getScript, type ScriptDefinition } from "$lib/services/scripts";

	let userScripts: string[] = $state([]);

	let stats: DashboardStats = $state({ learnt: 0, accuracy: 0, dueToday: 0 });
	let grid: CharacterGridItem[] = $state([]);
	let breakdown: MasteryBreakdown = $state({ mastered: 0, good: 0, learning: 0, difficult: 0, new: 0 });
	let scriptProgress: ScriptProgressItem[] = $state([]);
	let upcomingReviews: UpcomingReviewItem[] = $state([]);
	let weeklyActivity: WeeklyActivityItem[] = $state([]);
	let loaded = $state(false);

	let scriptDef: ScriptDefinition | null = $state(null);
	let activeScript = $state("");
	let studyingScripts: ScriptProgressItem[] = $state([]);
	let loadingScript = $state(false);

	const masteryLevels = [
		{ key: "new" as const, label: "New" },
		{ key: "difficult" as const, label: "Difficult" },
		{ key: "good" as const, label: "Good" },
		{ key: "learning" as const, label: "Learning" },
		{ key: "mastered" as const, label: "Mastered" },
	];

	async function loadActiveScriptData(scriptId: string): Promise<void> {
		if (!scriptId) {
			stats = { learnt: 0, accuracy: 0, dueToday: 0 };
			grid = [];
			breakdown = { mastered: 0, good: 0, learning: 0, difficult: 0, new: 0 };
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
			const [s, g, b, ur] = await Promise.all([
				getDashboardStats(scriptId),
				getCharacterGrid(scriptId),
				getMasteryBreakdown(scriptId),
				getUpcomingReviews(scriptId),
			]);
			if (activeScript !== scriptId) return;
			stats = s;
			grid = g;
			breakdown = b;
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

	onMount(async () => {
		try {
			userScripts = await api.user.getScripts();

			const [sp, wa] = await Promise.all([
				getScriptProgress(),
				getWeeklyActivity(),
			]);
			scriptProgress = sp;
			weeklyActivity = wa;

			// Build studyingScripts: progress for user scripts only, ordered by userScripts
			const progressByScript = new Map(sp.map((s) => [s.script, s]));
			const built: ScriptProgressItem[] = [];
			for (const id of userScripts) {
				const item = progressByScript.get(id);
				if (item) {
					built.push(item);
				} else {
					try {
						const def = await getScript(id);
						built.push({
							script: id,
							label: def.name,
							percentage: 0,
							total: def.totalCharacters ?? 0,
							learnt: 0,
						});
					} catch {
						built.push({
							script: id,
							label: id,
							percentage: 0,
							total: 0,
							learnt: 0,
						});
					}
				}
			}
			studyingScripts = built;

			const initialScript = studyingScripts[0]?.script ?? "";
			activeScript = initialScript;
			await loadActiveScriptData(initialScript);
		} catch {
			// IndexedDB may not be populated yet — show zeroes
		}
		loaded = true;
	});

	async function setActiveScript(scriptId: string): Promise<void> {
		activeScript = scriptId;
		await loadActiveScriptData(scriptId);
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

	function maxWeekly(): number {
		return Math.max(...weeklyActivity.map(w => w.count), 1);
	}
</script>

<div class="flex min-h-screen">
	<Sidebar />

	<main class="flex-1 overflow-y-auto bg-[var(--background)]">
		<div class="flex flex-col gap-8 p-10 px-12">
			<!-- Header -->
			<div class="flex items-center justify-between">
				<div>
					<h1 class="text-[28px] font-semibold text-[var(--foreground)]">Dashboard</h1>
					<p class="mt-1 text-[14px] text-[var(--muted-foreground)]">
						Track your script learning progress
					</p>
				</div>
				<a
					href="/learn"
					class="flex items-center gap-2 rounded-[var(--radius-pill)] bg-[var(--accent-green)] px-5 py-2.5 text-[14px] font-semibold text-white no-underline transition-opacity hover:opacity-90"
				>
					<Play size={16} fill="white" />
					Start Practice
				</a>
			</div>

			<!-- Language tabs + Stats for selected script (Script Tabs spec: pill container, active = secondary pill) -->
			{#if studyingScripts.length > 0}
			<div class="flex flex-col gap-4">
				<div
					class="flex h-14 w-fit items-center gap-2 rounded-[var(--radius-pill)] border border-[var(--input)] bg-[var(--card)] p-2"
					role="tablist"
				>
					{#each studyingScripts as sp (sp.script)}
						<button
							type="button"
							role="tab"
							aria-selected={activeScript === sp.script}
							class="rounded-[var(--radius-pill)] px-6 py-2.5 text-[14px] font-normal transition-colors {activeScript === sp.script
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
					class="grid grid-cols-3 gap-5"
					aria-busy={loadingScript}
					aria-live="polite"
				>
					<div class="rounded-[var(--radius-m)] border border-[var(--border)] bg-[var(--card)] p-6 shadow-[var(--shadow-card)]">
						<div class="flex items-center justify-between">
							<span class="text-[13px] font-medium text-[var(--muted-foreground)]">Characters Learnt</span>
							<BookOpen size={18} class="text-[var(--muted-foreground)]" />
						</div>
						<p class="mt-3 text-[32px] font-bold text-[var(--foreground)] {loadingScript ? 'animate-pulse opacity-60' : ''}">
							{loadingScript ? '—' : stats.learnt}
						</p>
					</div>

					<div class="rounded-[var(--radius-m)] border border-[var(--border)] bg-[var(--card)] p-6 shadow-[var(--shadow-card)]">
						<div class="flex items-center justify-between">
							<span class="text-[13px] font-medium text-[var(--muted-foreground)]">Review Accuracy</span>
							<Target size={18} class="text-[var(--muted-foreground)]" />
						</div>
						<p class="mt-3 text-[32px] font-bold text-[var(--foreground)] {loadingScript ? 'animate-pulse opacity-60' : ''}">
							{loadingScript ? '—' : `${stats.accuracy}%`}
						</p>
					</div>

					<div class="rounded-[var(--radius-m)] border border-[var(--border)] bg-[var(--card)] p-6 shadow-[var(--shadow-card)]">
						<div class="flex items-center justify-between">
							<span class="text-[13px] font-medium text-[var(--muted-foreground)]">Due Today</span>
							<Clock size={18} class="text-[var(--muted-foreground)]" />
						</div>
						<p class="mt-3 text-[32px] font-bold text-[var(--foreground)] {loadingScript ? 'animate-pulse opacity-60' : ''}">
							{loadingScript ? '—' : stats.dueToday}
						</p>
					</div>
				</div>
			</div>
			{:else}
			<p class="text-[14px] text-[var(--muted-foreground)]">
				You haven't started any script yet. <a href="/learn" class="font-medium text-[var(--accent-green)] no-underline hover:underline">Choose a script from Learn</a> to see your stats here.
			</p>
			{/if}

			<!-- Main Columns -->
			<div class="flex gap-6">
				<!-- Left Column -->
				<div class="flex flex-1 flex-col gap-6">
					<!-- Character Grid Card -->
					{#if studyingScripts.length === 0}
					<div class="rounded-[var(--radius-m)] border border-[var(--border)] bg-[var(--card)] p-6 shadow-[var(--shadow-card)]">
						<p class="text-[14px] text-[var(--muted-foreground)]">
							You haven't started any script yet. <a href="/learn" class="font-medium text-[var(--accent-green)] no-underline hover:underline">Choose a script from Learn</a> to begin.
						</p>
					</div>
					{:else if scriptDef?.grid}
					<div
						class="rounded-[var(--radius-m)] border border-[var(--border)] bg-[var(--card)] p-6 shadow-[var(--shadow-card)] transition-opacity {loadingScript ? 'opacity-60' : ''}"
						aria-busy={loadingScript}
					>
						<div class="mb-4 flex items-center justify-between">
							<div>
								{#if studyingScripts.length > 1}
								<div class="flex flex-wrap items-center gap-2">
									{#each studyingScripts as sp (sp.script)}
										<button
											type="button"
											class="rounded-[var(--radius-pill)] px-3 py-1.5 text-[13px] font-medium transition-colors {activeScript === sp.script
												? 'bg-[var(--accent-green)] text-white'
												: 'bg-[var(--secondary)] text-[var(--muted-foreground)] hover:bg-[var(--tile)] hover:text-[var(--foreground)]'}"
											onclick={() => setActiveScript(sp.script)}
										>
											{sp.label}
										</button>
									{/each}
								</div>
								{:else}
								<h2 class="text-[16px] font-semibold text-[var(--foreground)]">{scriptDef.name}</h2>
								{/if}
								<p class="mt-0.5 text-[13px] text-[var(--muted-foreground)]">
									{scriptDef.totalCharacters} characters &middot; {stats.learnt} learnt
								</p>
							</div>
							<div class="flex items-center gap-3">
								{#each masteryLevels as level (level.key)}
									<div class="flex items-center gap-1.5">
										<span
											class="inline-block h-2.5 w-2.5 rounded-full"
											style="background-color: {getMasteryColour(level.key)};"
										></span>
										<span class="text-[11px] text-[var(--muted-foreground)]">{level.label}</span>
									</div>
								{/each}
							</div>
						</div>

						<div class="flex gap-1.5">
							{#each scriptDef.grid.columns as col, colIdx (col.label + col.chars[0] + colIdx)}
								<div class="flex flex-col gap-1.5">
									{#each col.chars as char, charIdx (col.label + colIdx + charIdx)}
										{#if char}
											<div
												class="flex h-[52px] w-[52px] items-center justify-center rounded-lg text-[18px] font-medium"
												style="background-color: {getGridCharMastery(char)};"
												title={char}
											>
												{char}
											</div>
										{:else}
											<div class="h-[52px] w-[52px]"></div>
										{/if}
									{/each}
								</div>
							{/each}
						</div>
					</div>
					{/if}

					<!-- Mastery Breakdown Card -->
					{#if activeScript}
					<div
						class="rounded-[var(--radius-m)] border border-[var(--border)] bg-[var(--card)] p-6 shadow-[var(--shadow-card)] transition-opacity {loadingScript ? 'opacity-60' : ''}"
						aria-busy={loadingScript}
					>
						<h2 class="mb-4 text-[16px] font-semibold text-[var(--foreground)]">Mastery Breakdown</h2>

						<!-- Stacked bar -->
						<div class="flex h-4 w-full overflow-hidden rounded-[var(--radius-pill)]">
							{#each masteryLevels as level (level.key)}
								{#if breakdown[level.key] > 0}
									<div
										style="width: {barPercent(breakdown[level.key])}%; background-color: {getMasteryColour(level.key)};"
									></div>
								{/if}
							{/each}
						</div>

						<!-- Legend -->
						<div class="mt-4 flex items-center gap-5">
							{#each masteryLevels as level (level.key)}
								<div class="flex items-center gap-1.5">
									<span
										class="inline-block h-2.5 w-2.5 rounded-full"
										style="background-color: {getMasteryColour(level.key)};"
									></span>
									<span class="text-[12px] text-[var(--muted-foreground)]">
										{level.label}: {breakdown[level.key]}
									</span>
								</div>
							{/each}
						</div>
					</div>
					{/if}
				</div>

				<!-- Right Column -->
				<div class="flex w-[340px] shrink-0 flex-col gap-6">
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
</div>
