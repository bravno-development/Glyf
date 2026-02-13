<script lang="ts">
	import { goto } from "$app/navigation";
	import { onMount } from "svelte";
	import { userStore } from "$lib/stores/user";
	import Sidebar from "$lib/components/Sidebar.svelte";
	import { api } from "$lib/services/api";
	import { getScriptProgress, type ScriptProgressItem } from "$lib/services/dashboard";
	import { getScript } from "$lib/services/scripts";

	let studyingScripts: ScriptProgressItem[] = $state([]);
	let loading = $state(true);

	$effect(() => {
		if (!$userStore.initialised) return;
		if (!$userStore.isAuthenticated) {
			goto("/auth/login");
		}
	});

	onMount(async () => {
		try {
			const userScriptIds = await api.user.getScripts();
			if (userScriptIds.length === 0) {
				goto("/onboarding");
				return;
			}
			const progress = await getScriptProgress();
			const idSet = new Set(userScriptIds);
			studyingScripts = progress.filter((p) => idSet.has(p.script));
			// Ensure every user script appears (getScriptProgress only returns scripts with characters)
			for (const id of userScriptIds) {
				if (!studyingScripts.some((p) => p.script === id)) {
					try {
						const def = await getScript(id);
						studyingScripts = [
							...studyingScripts,
							{ script: id, label: def.name, percentage: 0, total: def.totalCharacters ?? 0, learnt: 0 },
						];
					} catch {
						studyingScripts = [...studyingScripts, { script: id, label: id, percentage: 0, total: 0, learnt: 0 }];
					}
				}
			}
			// Preserve user script order
			const order = new Map(userScriptIds.map((id, i) => [id, i]));
			studyingScripts.sort((a, b) => (order.get(a.script) ?? 99) - (order.get(b.script) ?? 99));
		} catch {
			goto("/onboarding");
		} finally {
			loading = false;
		}
	});
</script>

<div class="flex min-h-screen">
	<Sidebar />

	<main class="flex-1 overflow-y-auto bg-[var(--background)]">
		<div class="max-w-[800px] mx-auto p-8 px-10">
			<div class="mb-2">
				<p class="text-[13px] font-medium text-[var(--muted-foreground)]">Welcome back</p>
				<h1 class="text-[22px] font-semibold tracking-tight text-[var(--foreground)]">Your Scripts</h1>
			</div>
			<p class="text-[14px] text-[var(--muted-foreground)] mb-6">
				Choose a script to practice. Progress is saved per script.
			</p>

			{#if loading}
				<p class="text-[var(--muted-foreground)]">Loading…</p>
			{:else}
				<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
					{#each studyingScripts as item (item.script)}
						<a
							href="/learn/{item.script}"
							class="block rounded-[var(--radius-l)] border border-[var(--border)] bg-[var(--card)] p-6 text-left shadow-[var(--shadow-card)] no-underline transition-opacity hover:opacity-90"
						>
							<p class="text-lg font-medium text-[var(--card-foreground)]">{item.label}</p>
							<p class="mt-1 text-[13px] text-[var(--muted-foreground)]">
								{item.learnt} / {item.total} learnt
								{#if item.total > 0}
									· {item.percentage}%
								{/if}
							</p>
						</a>
					{/each}
				</div>
			{/if}
		</div>
	</main>
</div>
