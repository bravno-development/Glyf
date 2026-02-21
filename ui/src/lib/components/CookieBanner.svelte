<script lang="ts">
	import { onMount } from 'svelte';
	import { acceptTracking, declineTracking, hasConsentDecision } from '$lib/services/analytics';

	let visible = $state(false);

	onMount(() => {
		if (!hasConsentDecision()) {
			visible = true;
		}
	});

	function accept() {
		acceptTracking();
		visible = false;
	}

	function decline() {
		declineTracking();
		visible = false;
	}
</script>

{#if visible}
	<div class="fixed bottom-0 left-0 z-50 w-screen border-t border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow-card)]">
		<div class="mx-auto flex max-w-4xl flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
			<p class="text-sm text-[var(--foreground)]">
				We use PostHog to understand how Glyf is used. No ads, no third-party sharing.
			</p>
			<div class="flex shrink-0 gap-2">
				<button
					onclick={decline}
					class="rounded-full border border-[var(--border)] bg-transparent px-4 py-1.5 text-sm text-[var(--foreground)] transition-colors hover:bg-[var(--muted)]"
				>
					Decline
				</button>
				<button
					onclick={accept}
					class="rounded-full bg-[var(--accent-green)] px-4 py-1.5 text-sm font-medium text-[var(--background)] transition-opacity hover:opacity-90"
				>
					Accept
				</button>
			</div>
		</div>
	</div>
{/if}
