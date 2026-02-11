<script lang="ts">
	import { goto } from "$app/navigation";
	import { onMount } from "svelte";
	import { getAvailableScripts, type ScriptDefinition } from "$lib/services/scripts";

	let scripts: ScriptDefinition[] = $state([]);

	onMount(async () => {
		scripts = await getAvailableScripts();
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
