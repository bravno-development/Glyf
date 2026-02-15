<script lang="ts">
	import { goto } from "$app/navigation";
	import { onMount } from "svelte";
	import { userStore } from "$lib/stores/user";
	import { api } from "$lib/services/api";
	import { db } from "$lib/services/db";
	import { getAvailableScripts, type ScriptDefinition } from "$lib/services/scripts";
	import {
		getScriptProgress,
		type ScriptProgressItem,
	} from "$lib/services/dashboard";
	import Sidebar from "$lib/components/Sidebar.svelte";

	let availableScripts: ScriptDefinition[] = $state([]);
	let userScriptIds: string[] = $state([]);
	let progress: ScriptProgressItem[] = $state([]);
	let completedDates: Record<string, string> = $state({});

	const progressByScript = $derived(new Map(progress.map((p) => [p.script, p])));
	const studying = $derived(
		progress.filter((p) => p.percentage > 0 && p.percentage < 100),
	);
	const mastered = $derived(progress.filter((p) => p.percentage === 100));
	const studyingCount = $derived(studying.length);
	const masteredCount = $derived(mastered.length);

	type AllScriptRow = {
		def: ScriptDefinition;
		progress: ScriptProgressItem | undefined;
		isStudying: boolean;
		buttonLabel: string;
	};
	const allScriptRows = $derived(
		availableScripts.map((def) => {
			const p = progressByScript.get(def.id);
			const isStudying = p != null && p.percentage > 0 && p.percentage < 100;
			const buttonLabel =
				p != null && p.percentage > 0 ? "Continue" : "Start";
			return { def, progress: p, isStudying, buttonLabel } satisfies AllScriptRow;
		}),
	);

	$effect(() => {
		if (!$userStore.initialised) return;
		if (!$userStore.isAuthenticated) {
			goto("/auth/login");
		}
	});

	onMount(async () => {
		try {
			const [scripts, scriptsResponse, prog] = await Promise.all([
				getAvailableScripts(),
				api.user.getScripts(),
				getScriptProgress(),
			]);
			availableScripts = scripts;
			userScriptIds = scriptsResponse.map((r) => r.script);
			progress = prog;

			if (scriptsResponse.length === 0) {
				goto("/onboarding");
				return;
			}

			const dates: Record<string, string> = {};
			for (const p of prog.filter((x) => x.percentage === 100)) {
				const sessions = await db.sessions
					.where("script")
					.equals(p.script)
					.toArray();
				const sorted = sessions.sort(
					(a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
				);
				if (sorted[0]) {
					const d = new Date(sorted[0].date);
					dates[p.script] = d.toLocaleDateString("en-GB", {
						day: "numeric",
						month: "short",
						year: "numeric",
					});
				}
			}
			completedDates = dates;
		} catch {
			goto("/onboarding");
		}
	});

	function formatCompleted(dateStr: string | undefined): string {
		return dateStr ? `Completed ${dateStr}` : "Completed";
	}
</script>

<div class="flex min-h-screen">
	<Sidebar />

	<main class="flex-1 overflow-y-auto bg-[var(--background)]">
		<div class="flex flex-col gap-8 py-10 px-12">
			<!-- Page header -->
			<div class="flex items-end justify-between">
				<div>
					<h1 class="text-[28px] font-semibold text-[var(--foreground)]">
						Scripts
					</h1>
					<p class="mt-1 text-[14px] text-[var(--muted-foreground)]">
						Browse available writing systems & see your progress
					</p>
				</div>
				<div class="text-[14px] text-[var(--muted-foreground)]">
					{availableScripts.length} scripts available
				</div>
			</div>

			<!-- Currently Studying -->
			{#if studying.length > 0}
				<section class="flex flex-col gap-4" aria-labelledby="studying-heading">
					<div class="flex items-center justify-between">
						<h2
							id="studying-heading"
							class="text-[18px] font-semibold text-[var(--foreground)]"
						>
							Currently Studying
						</h2>
						<span
							class="rounded-[var(--radius-pill)] bg-[var(--color-success)] px-3 py-1.5 text-[12px] font-medium text-[var(--color-success-foreground)]"
						>
							{studyingCount} active
						</span>
					</div>
					<div class="flex flex-wrap gap-5">
						{#each studying as item (item.script)}
							{@const def = availableScripts.find((s) => s.id === item.script)}
							{#if def}
								<article
									class="w-full min-w-0 max-w-[360px] rounded-[var(--radius-m)] border border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow-card)]"
								>
									<div class="flex flex-col gap-3 p-6">
										<div class="flex items-center justify-between">
											<div class="flex items-center gap-2.5">
												<span
													class="text-[24px] font-bold text-[var(--primary)]"
													aria-hidden="true"
												>
													{def.icon}
												</span>
												<span
													class="text-[18px] font-semibold text-[var(--foreground)]"
												>
													{def.name}
												</span>
											</div>
											<span
												class="rounded-[var(--radius-pill)] bg-[var(--color-success)] px-3 py-1.5 text-[12px] font-medium text-[var(--color-black)]"
											>
												Studying
											</span>
										</div>
										<div class="flex justify-between text-[13px] text-[var(--muted-foreground)]">
											<span>{item.percentage}% mastered</span>
											<span>{item.total} characters</span>
										</div>
										<div
											class="h-4 w-full overflow-hidden rounded-[var(--radius-pill)] bg-[var(--secondary)]"
											role="progressbar"
											aria-valuenow={item.percentage}
											aria-valuemin="0"
											aria-valuemax="100"
										>
											<div
												class="h-full rounded-[var(--radius-pill)] bg-[var(--primary)] transition-[width]"
												style="width: {item.percentage}%"
											></div>
										</div>
									</div>
									<div
										class="flex justify-end border-t border-[var(--border)] px-6 py-4"
									>
										<a
											href="/learn/{item.script}"
											class="rounded-[var(--radius-pill)] bg-[var(--border)] px-4 py-2.5 text-[14px] font-medium text-[var(--foreground)] no-underline transition-colors hover:opacity-90"
										>
											Continue
										</a>
									</div>
								</article>
							{/if}
						{/each}
					</div>
				</section>
			{/if}

			<!-- All Scripts -->
			<section class="flex flex-col gap-4" aria-labelledby="all-heading">
				<div class="flex items-center justify-between">
					<h2
						id="all-heading"
						class="text-[18px] font-semibold text-[var(--foreground)]"
					>
						All Scripts
					</h2>
					<span class="text-[13px] text-[var(--muted-foreground)]">
						{availableScripts.length} writing systems
					</span>
				</div>
				<div
					class="overflow-hidden rounded-[var(--radius-m)] border border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow-card)]"
				>
					<ul class="divide-y divide-[var(--border)]" role="list">
						{#each allScriptRows as row (row.def.id)}
							<li>
								<div
									class="flex flex-wrap items-center gap-4 px-6 py-4 sm:flex-nowrap text-[var(--card-foreground)]"
								>
									<div
										class="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-xs)] bg-[var(--tile)] text-[20px] font-bold text-[var(--primary)]"
										aria-hidden="true"
									>
										{row.def.icon}
									</div>
									<div class="min-w-0 flex-1">
										<a
											href={row.detailHref}
											class="text-[15px] font-medium text-[var(--card-foreground)] no-underline transition-colors hover:underline"
										>
											{row.def.name}
										</a>
										<p class="text-[13px] text-[var(--muted-foreground)]">
											{row.def.language}
										</p>
									</div>
									<span
										class="w-20 shrink-0 text-right text-[13px] text-[var(--muted-foreground)] tabular-nums"
									>
										{row.def.totalCharacters} chars
									</span>
									{#if row.isStudying}
										<span
											class="w-[90px] shrink-0 rounded-[var(--radius-pill)] bg-[var(--color-success)] px-3 py-1.5 text-center text-[12px] font-medium text-[var(--color-black)]"
										>
											Studying
										</span>
									{/if}
									<a
										href={row.detailHref}
										class="shrink-0 rounded-[var(--radius-pill)] px-4 py-2.5 text-[13px] font-medium no-underline transition-opacity bg-[var(--border)] text-[var(--card-foreground)] hover:opacity-90"
									>
										View Details
									</a>
									<a
										href={row.learnHref}
										class="shrink-0 rounded-[var(--radius-pill)] px-4 py-2.5 text-[13px] font-medium no-underline transition-opacity {row.isStudying
											? 'bg-[var(--border)] text-[var(--card-foreground)] hover:opacity-90'
											: 'bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90'}"
									>
										{row.buttonLabel}
									</a>
								</div>
							</li>
						{/each}
					</ul>
				</div>
			</section>

			<!-- Mastered -->
			{#if mastered.length > 0}
				<section class="flex flex-col gap-4" aria-labelledby="mastered-heading">
					<div class="flex items-center justify-between">
						<h2
							id="mastered-heading"
							class="text-[18px] font-semibold text-[var(--foreground)]"
						>
							Mastered
						</h2>
						<span class="text-[13px] text-[var(--muted-foreground)]">
							{masteredCount} script{masteredCount === 1 ? "" : "s"} completed
						</span>
					</div>
					<div class="flex flex-wrap gap-5">
						{#each mastered as item (item.script)}
							{@const def = availableScripts.find((s) => s.id === item.script)}
							{#if def}
								<article
									class="flex min-w-0 max-w-md flex-1 items-center gap-4 rounded-[var(--radius-m)] border border-[var(--border)] bg-[var(--card)] p-6 shadow-[var(--shadow-card)]"
								>
									<div class="flex flex-1 items-center gap-3">
										<div
											class="flex h-12 w-12 shrink-0 items-center justify-center rounded-[var(--radius-xs)] bg-[var(--color-success)] text-[24px] font-bold text-[var(--color-success-foreground)]"
											aria-hidden="true"
										>
											{def.icon}
										</div>
										<p class="text-[15px] font-medium text-[var(--foreground)]">
											{def.name}
										</p>
									</div>
									<div class="flex flex-col items-end gap-1">
										<span
											class="rounded-[var(--radius-pill)] bg-[var(--color-success)] px-3 py-1.5 text-[12px] font-medium text-[var(--color-success-foreground)]"
										>
											100%
										</span>
										<span
											class="text-[12px] text-[var(--muted-foreground)]"
										>
											{formatCompleted(completedDates[item.script])}
										</span>
									</div>
								</article>
							{/if}
						{/each}
					</div>
				</section>
			{/if}
		</div>
	</main>
</div>
