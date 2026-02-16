<script lang="ts">
	import { goto } from "$app/navigation";
	import { get } from "svelte/store";
	import { onMount } from "svelte";
	import { userStore } from "$lib/stores/user";
	import { learnStore } from "$lib/stores/learn";
	import AppShell from "$lib/components/AppShell.svelte";

	let loading = $state(true);

	$effect(() => {
		if (!$userStore.initialised) return;
		if (!$userStore.isAuthenticated) {
			goto("/auth/login");
		}
	});

	onMount(async () => {
		try {
			await learnStore.load();
			const state = get(learnStore);
			if (state.studyingScripts.length === 0) {
				goto("/onboarding");
				return;
			}
		} catch {
			goto("/onboarding");
		} finally {
			loading = false;
		}
	});
</script>

<svelte:head>
	<title>Practice — Glyf</title>
</svelte:head>

<AppShell>
	<main class="flex-1 overflow-y-auto bg-[var(--background)]">
		<div class="max-w-[800px] mx-auto p-6 px-4 md:p-8 md:px-10">
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
					{#each $learnStore.studyingScripts as item (item.script)}
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
</AppShell>
