<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { userStore } from '$lib/stores/user';
	import { api } from '$lib/services/api';

	let notifications = $state<Array<{ id: string; type: string; createdAt: string; readAt: string | null }>>([]);
	let loaded = $state(false);
	let dismissed = $state(false);

	async function fetchNotifications() {
		try {
			const list = await api.notifications.list();
			notifications = list ?? [];
		} catch {
			notifications = [];
		} finally {
			loaded = true;
		}
	}

	onMount(() => {
		const unsubscribe = userStore.subscribe((state) => {
			if (!state.initialised) return;
			if (state.isAuthenticated) {
				fetchNotifications();
			} else {
				notifications = [];
				loaded = true;
			}
		});
		return unsubscribe;
	});

	const unread = $derived(notifications.filter((n) => n.readAt == null));
	const show = $derived(loaded && unread.length > 0 && !dismissed);

	async function dismiss() {
		try {
			await api.notifications.markAllRead();
			dismissed = true;
			notifications = notifications.map((n) => ({ ...n, readAt: n.createdAt }));
		} catch {
			dismissed = true;
		}
	}

	function goToStudy() {
		dismiss();
		goto('/dashboard');
	}
</script>

{#if show}
	<div
		class="flex items-center justify-between gap-4 px-4 py-3 bg-[var(--primary)] text-[var(--primary-foreground)] text-sm"
	>
		<span>Time to study — keep your streak going.</span>
		<div class="flex items-center gap-2 shrink-0">
			<button
				type="button"
				onclick={goToStudy}
				class="rounded-[var(--radius-xs)] bg-white/20 px-3 py-1.5 font-medium hover:bg-white/30"
			>
				Open dashboard
			</button>
			<button
				type="button"
				onclick={dismiss}
				class="rounded-[var(--radius-xs)] px-2 py-1.5 opacity-90 hover:opacity-100"
				aria-label="Dismiss"
			>
				×
			</button>
		</div>
	</div>
{/if}
