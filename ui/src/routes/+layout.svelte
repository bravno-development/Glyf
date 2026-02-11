<script lang="ts">
	import { onMount } from "svelte";
	import { userStore } from "$lib/stores/user";
	import { syncFromServer, syncToServer } from "$lib/services/sync";
	import "../app.css";

	let { children } = $props();

	onMount(() => {
		userStore.init();

		const unsubscribe = userStore.subscribe((state) => {
			if (state.isAuthenticated) {
				syncFromServer();
			}
		});

		const syncInterval = setInterval(
			() => {
				const state = $userStore;
				if (state.isAuthenticated) {
					syncToServer();
				}
			},
			5 * 60 * 1000,
		);

		return () => {
			clearInterval(syncInterval);
			unsubscribe();
		};
	});
</script>

<div
	class="min-h-screen flex flex-col font-primary bg-[var(--background)] text-[var(--foreground)]"
>
	{@render children()}
</div>
