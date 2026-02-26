<script lang="ts">
	import { onMount } from 'svelte';
	import { Smartphone, X } from 'lucide-svelte';
	import { StorageKey } from '$lib/constants/storageKeys';

	let visible = $state(false);

	onMount(() => {
		if (localStorage.getItem(StorageKey.InstallDismissed)) return;
		if (window.matchMedia('(display-mode: standalone)').matches) return;
		if (window.innerWidth >= 768) return;
		visible = true;
	});

	function dismiss() {
		localStorage.setItem(StorageKey.InstallDismissed, '1');
		visible = false;
	}
</script>

{#if visible}
	<div class="flex items-center gap-3 rounded-[var(--radius-m)] border border-[var(--border)] bg-[var(--card)] px-4 py-3 text-sm shadow-[var(--shadow-card)]">
		<Smartphone size={18} class="shrink-0 text-[var(--muted-foreground)]" />
		<span class="flex-1 text-[var(--foreground)]">Add Glyf to your homescreen</span>
		<a href="/documentation?entry=how-to-install-on-mobile" class="font-medium text-[var(--primary)]">How?</a>
		<button onclick={dismiss} aria-label="Dismiss"><X size={16} class="text-[var(--muted-foreground)]" /></button>
	</div>
{/if}
