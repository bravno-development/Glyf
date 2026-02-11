<script lang="ts">
	import { page } from "$app/state";
	import { goto } from "$app/navigation";
	import { onMount } from "svelte";
	import { api } from "$lib/services/api";
	import { userStore } from "$lib/stores/user";

	let error = $state("");
	let verifying = $state(true);

	onMount(async () => {
		const token = page.url.searchParams.get("token");

		if (!token) {
			error = "No token provided";
			verifying = false;
			return;
		}

		try {
			const result = await api.auth.verify({ token });
			userStore.login(result.user, result.token);
			goto("/");
		} catch (err) {
			error = err instanceof Error ? err.message : "Verification failed";
			verifying = false;
		}
	});
</script>

<div class="max-w-[400px] mx-auto p-8 text-center">
	{#if verifying}
		<p class="text-[var(--muted-foreground)]">Verifying...</p>
	{:else if error}
		<div
			class="mb-4 p-3 rounded-[var(--radius-m)] bg-[var(--color-error)] text-[var(--color-error-foreground)] text-sm"
		>
			{error}
		</div>
		<a
			href="/auth/login"
			class="text-sm text-[var(--primary)]"
		>
			Try logging in again
		</a>
	{/if}
</div>
