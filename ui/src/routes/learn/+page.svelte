<script lang="ts">
	import { goto } from "$app/navigation";
	import { onMount } from "svelte";
	import { userStore } from "$lib/stores/user";
	import { api } from "$lib/services/api";
	import { getAvailableScripts, type ScriptDefinition } from "$lib/services/scripts";

	let scripts: ScriptDefinition[] = $state([]);

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
			const allScripts = await getAvailableScripts();
			const idSet = new Set(userScriptIds);
			scripts = allScripts.filter((s) => idSet.has(s.id));
		} catch {
			goto("/onboarding");
		}
	});
</script>

<div class="max-w-[800px] mx-auto p-8">
	<h1 class="text-2xl font-medium text-[var(--foreground)] mb-6">
		Choose a Script
	</h1>

	<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
		{#each scripts as script (script.id)}
			<button
				onclick={() => script.available && goto(`/learn/${script.id}`)}
				class="rounded-[var(--radius-l)] border border-[var(--border)] bg-[var(--card)] p-8 text-left shadow-[var(--shadow-card)]
					{script.available ? '' : 'opacity-50'}"
				disabled={!script.available}
			>
				<p class="text-3xl mb-2">{script.icon}</p>
				<p class="text-lg font-medium text-[var(--card-foreground)]">
					{script.name}
				</p>
				<p class="text-sm text-[var(--muted-foreground)]">
					{script.available ? script.description : 'Coming soon'}
				</p>
			</button>
		{/each}
	</div>
</div>
