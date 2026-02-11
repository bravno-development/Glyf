<script lang="ts">
	let { currentStep }: { currentStep: number } = $props();
</script>

<div class="flex items-center gap-2">
	{#each [1, 2, 3] as dot (dot)}
		<div
			class="h-2 w-2 rounded-full {dot <= currentStep
				? 'bg-[var(--accent-green)]'
				: 'bg-[#D1D0CD]'}"
		></div>
	{/each}
</div>
