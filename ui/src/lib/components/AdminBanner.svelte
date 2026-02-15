<script lang="ts">
	import { onMount } from 'svelte';
	import { adminTimeStore, ONE_DAY_MS } from '$lib/stores/adminTime';
	import { resetAccount } from '$lib/services/admin';

	let isLocalhost = $state(false);
	let timeOffsetMs = $state<number | null>(null);
	let resetting = $state(false);
	let confirmReset = $state(false);

	onMount(() => {
		const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
		isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
		const unsub = adminTimeStore.subscribe((v) => {
			timeOffsetMs = v;
		});
		return unsub;
	});

	const timeLabel = $derived(
		timeOffsetMs === null
			? 'Time: real'
			: Math.round(timeOffsetMs / ONE_DAY_MS) === 1
				? 'Time: +1 day'
				: `Time: +${Math.round(timeOffsetMs / ONE_DAY_MS)} days`
	);

	async function handleReset() {
		if (!confirmReset) {
			confirmReset = true;
			return;
		}
		resetting = true;
		try {
			await resetAccount();
		} catch {
			resetting = false;
			confirmReset = false;
		}
	}

	function cancelReset() {
		confirmReset = false;
	}
</script>

{#if isLocalhost}
	<div
		class="flex items-center justify-between gap-4 px-4 py-3 bg-[var(--muted)] text-[var(--foreground)] text-sm"
	>
		<span class="font-medium">Admin</span>
		<div class="flex items-center gap-2 shrink-0 flex-wrap justify-end">
			<span class="text-[var(--muted-foreground)]">{timeLabel}</span>
			<button
				type="button"
				onclick={() => adminTimeStore.addDay()}
				class="rounded-[var(--radius-xs)] bg-[var(--secondary)] px-2 py-1.5 text-[var(--secondary-foreground)] hover:opacity-90"
			>
				+1 day
			</button>
			<button
				type="button"
				onclick={() => adminTimeStore.addWeek()}
				class="rounded-[var(--radius-xs)] bg-[var(--secondary)] px-2 py-1.5 text-[var(--secondary-foreground)] hover:opacity-90"
			>
				+1 week
			</button>
			<button
				type="button"
				onclick={() => adminTimeStore.reset()}
				class="rounded-[var(--radius-xs)] bg-[var(--secondary)] px-2 py-1.5 text-[var(--secondary-foreground)] hover:opacity-90"
			>
				Reset time
			</button>
			{#if confirmReset}
				<button
					type="button"
					onclick={handleReset}
					disabled={resetting}
					class="rounded-[var(--radius-xs)] bg-[var(--destructive)] px-2 py-1.5 text-[var(--destructive-foreground)] hover:opacity-90 disabled:opacity-50"
				>
					{resetting ? 'Resetting…' : 'Confirm reset'}
				</button>
				<button
					type="button"
					onclick={cancelReset}
					class="rounded-[var(--radius-xs)] px-2 py-1.5 opacity-90 hover:opacity-100"
				>
					Cancel
				</button>
			{:else}
				<button
					type="button"
					onclick={handleReset}
					disabled={resetting}
					class="rounded-[var(--radius-xs)] bg-[var(--destructive)] px-2 py-1.5 text-[var(--destructive-foreground)] hover:opacity-90 disabled:opacity-50"
				>
					Reset account
				</button>
			{/if}
		</div>
	</div>
{/if}
