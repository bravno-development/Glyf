<script lang="ts">
	import { goto } from "$app/navigation";
	import { page } from "$app/stores";
	import { onMount } from "svelte";
	import { userStore } from "$lib/stores/user";
	import {
		getCharactersInOrder,
		getPhaseContent,
		getScript,
		type ScriptDefinition,
	} from "$lib/services/scripts";
	import type { ContentRow } from "$lib/components/DetailSections.svelte";
	import { getProgressForScript, getDashboardStats } from "$lib/services/dashboard";
	import AppShell from "$lib/components/AppShell.svelte";
	import DetailSections from "$lib/components/DetailSections.svelte";
	import { ArrowLeft } from "lucide-svelte";

	const scriptId = $derived($page.params.scriptId ?? "");

	let scriptDef = $state<ScriptDefinition | null>(null);
	let rows = $state<Array<{ title: string; content: ContentRow[] }>>([]);
	let learnHref = $state("/scripts");
	let learnLabel = $state("Start learning");
	let learnDisabled = $state(false);
	let loading = $state(true);
	let error = $state<string | null>(null);

	$effect(() => {
		if (!$userStore.initialised) return;
		if (!$userStore.isAuthenticated) {
			goto("/auth/login");
		}
	});

	onMount(async () => {
		if (!scriptId) {
			goto("/scripts");
			return;
		}
		try {
			const def = await getScript(scriptId);
			scriptDef = def;
			learnHref = `/learn/${def.id}`;
			const [prog, stats] = await Promise.all([
				getProgressForScript(def.id),
				getDashboardStats(def.id),
			]);
			if (!prog || prog.learnt === 0) {
				learnLabel = "Start learning";
				learnDisabled = false;
			} else if (stats.dueToday > 0 || prog.learnt < prog.total) {
				learnLabel = "Continue";
				learnDisabled = false;
			} else {
				learnLabel = "All caught up";
				learnDisabled = true;
			}

			const sectionRows: Array<{ title: string; content: ContentRow[] }> = [];
			if (def.description) {
				sectionRows.push({ title: "Overview", content: [{ character: "", meaning: def.description, order: 0 }] });
			}
			if (def.course?.phases?.length) {
				for (const phase of def.course.phases) {
					const content = getPhaseContent(def, phase);
					if (content.length > 0) {
						sectionRows.push({ title: phase.title, content });
					}
				}
			} else if (def.characters?.length || def.extra?.length) {
				// Fallback when course is missing (e.g. legacy script)
				if (def.characters?.length) {
					const ordered = getCharactersInOrder(def);
					sectionRows.push({
						title: "Characters",
				content: ordered.map((c) => ({
						character: c.character,
						meaning: c.meaning,
						order: c.order ?? 0,
						forms: c.forms,
						description: c.description,
					})),
					});
				}
				if (def.extra?.length) {
					for (const section of def.extra) {
						sectionRows.push({
							title: section.title,
							content: section.characters.map((c, i) => ({
								character: c.character,
								meaning: c.meaning,
								order: i,
							})),
						});
					}
				}
			}
			rows = sectionRows;
		} catch {
			error = "Script not found";
		} finally {
			loading = false;
		}
	});
</script>

<svelte:head>
	<title>{scriptDef?.name ?? scriptId} — Script</title>
</svelte:head>

<AppShell>
	<main class="flex-1 overflow-y-auto bg-[var(--background)]">
		<div class="mx-auto max-w-4xl flex flex-col gap-8 py-6 px-4 md:py-10 md:px-12">
			{#if loading}
				<p class="text-[var(--muted-foreground)]">Loading…</p>
			{:else if error}
				<p class="text-[var(--color-error)]">{error}</p>
				<a
					href="/scripts"
					class="mt-4 inline-flex items-center gap-2 text-[14px] font-medium text-[var(--foreground)] no-underline hover:underline"
				>
					<ArrowLeft size={16} />
					Back to scripts
				</a>
			{:else if scriptDef}
				<div class="flex flex-col gap-8">
					<div class="flex items-start justify-between gap-4">
						<a
							href="/scripts"
							class="inline-flex shrink-0 items-center gap-2 text-[14px] font-medium text-[var(--muted-foreground)] no-underline transition-colors hover:text-[var(--foreground)]"
						>
							<ArrowLeft size={16} />
							Back to scripts
						</a>
					</div>

					<header class="flex flex-col gap-4">
						<div class="flex items-center gap-4">
							<span
								class="flex h-14 w-14 shrink-0 items-center justify-center rounded-[var(--radius-m)] bg-[var(--tile)] text-[28px] font-bold text-[var(--primary)]"
								aria-hidden="true"
							>
								{scriptDef.icon}
							</span>
							<div class="min-w-0 flex-1">
								<h1 class="text-[28px] font-semibold text-[var(--foreground)]">
									{scriptDef.name}
								</h1>
								<p class="mt-1 text-[14px] text-[var(--muted-foreground)]">
									{scriptDef.language}
									{#if scriptDef.totalCharacters > 0}
										· {scriptDef.totalCharacters} characters
									{/if}
								</p>
							</div>
						</div>
						<div class="flex flex-wrap items-center gap-3">
							{#if learnDisabled}
								<span
									class="rounded-[var(--radius-pill)] bg-[var(--primary)] px-5 py-2.5 text-[14px] font-medium text-[var(--primary-foreground)] opacity-50 cursor-not-allowed"
									aria-disabled="true"
								>
									{learnLabel}
								</span>
							{:else}
								<a
									href={learnHref}
									class="rounded-[var(--radius-pill)] bg-[var(--primary)] px-5 py-2.5 text-[14px] font-medium text-[var(--primary-foreground)] no-underline transition-opacity hover:opacity-90"
								>
									{learnLabel}
								</a>
							{/if}
						</div>
					</header>

					<DetailSections rows={rows} lowercaseFriendly={scriptDef.lowercaseFriendly ?? false} />
				</div>
			{/if}
		</div>
	</main>
</AppShell>
