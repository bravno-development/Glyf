<script lang="ts">
	import { get } from "svelte/store";
	import { onMount } from "svelte";
	import { goto } from "$app/navigation";
	import { getStores } from "$app/stores";
	import { userStore } from "$lib/stores/user";
	import { api } from "$lib/services/api";
	import { syncFromServer, syncToServer } from "$lib/services/sync";
	import { initPostHog, identifyUser, resetUser } from "$lib/services/analytics";
import ReminderBanner from "$lib/components/ReminderBanner.svelte";
import AdminBanner from "$lib/components/AdminBanner.svelte";
import "../app.css";

	let { children } = $props();

	onMount(() => {
		initPostHog();
		userStore.init();

		let wasAuthenticated = false;

		const unsubscribe = userStore.subscribe((state) => {
			if (state.isAuthenticated && !wasAuthenticated) {
				syncFromServer();
				if (state.user) {
					identifyUser(state.user.id, { email: state.user.email });
				}
				const { page } = getStores();
				const pathname = get(page).url.pathname;
				if (pathname !== "/onboarding" && !pathname.startsWith("/auth")) {
					api.onboarding.status().then(({ onboarded }) => {
						if (!onboarded) goto("/onboarding");
					});
				}
			} else if (!state.isAuthenticated && wasAuthenticated) {
				resetUser();
			}
			wasAuthenticated = state.isAuthenticated;
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
	<AdminBanner />
	<ReminderBanner />
	{@render children()}
</div>
