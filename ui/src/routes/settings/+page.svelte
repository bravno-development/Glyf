<script lang="ts">
	import { onMount } from 'svelte';
	import { api } from '$lib/services/api';

	let reminderEnabled = $state(false);
	let reminderTimeLocal = $state('09:00');
	let timezone = $state('UTC');
	let loading = $state(true);
	let saving = $state(false);
	let error = $state<string | null>(null);

	const COMMON_TIMEZONES = [
		'UTC',
		'America/New_York',
		'America/Chicago',
		'America/Denver',
		'America/Los_Angeles',
		'America/Toronto',
		'Europe/London',
		'Europe/Paris',
		'Europe/Madrid',
		'Europe/Amsterdam',
		'Asia/Tokyo',
		'Asia/Shanghai',
		'Asia/Singapore',
		'Asia/Kolkata',
		'Australia/Sydney',
		'Australia/Melbourne'
	];

	onMount(async () => {
		try {
			const profile = await api.user.getProfile();
			reminderEnabled = profile.reminderEnabled ?? false;
			reminderTimeLocal = profile.reminderTimeLocal ?? '09:00';
			timezone = profile.timezone ?? 'UTC';
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to load settings';
		} finally {
			loading = false;
		}
	});

	async function saveReminder() {
		error = null;
		saving = true;
		try {
			await api.user.updateReminder({
				reminderEnabled,
				...(reminderEnabled && {
					reminderTimeLocal,
					timezone
				})
			});
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to save reminder';
		} finally {
			saving = false;
		}
	}
</script>

<div class="max-w-[800px] mx-auto p-8">
	<h1 class="text-2xl font-medium text-[var(--foreground)] mb-6">Settings</h1>

	{#if loading}
		<p class="text-[var(--muted-foreground)]">Loading…</p>
	{:else}
		<section class="mb-8">
			<h2 class="text-lg font-medium text-[var(--foreground)] mb-3">Study reminder</h2>
			<p class="text-[var(--muted-foreground)] text-sm mb-4">
				Get a reminder (email or in-app) when it's time to study.
			</p>

			<div class="flex flex-col gap-4">
				<label class="flex items-center gap-3 cursor-pointer">
					<input
						type="checkbox"
						bind:checked={reminderEnabled}
						onchange={saveReminder}
						class="rounded border-[var(--input)] bg-[var(--background)] text-[var(--primary)] focus:ring-[var(--ring)]"
					/>
					<span class="text-[var(--foreground)]">Enable daily reminder</span>
				</label>

				{#if reminderEnabled}
					<div class="flex flex-wrap items-end gap-4">
						<div>
							<label for="reminder-time" class="block text-sm text-[var(--muted-foreground)] mb-1">Time</label>
							<input
								id="reminder-time"
								type="time"
								bind:value={reminderTimeLocal}
								onchange={saveReminder}
								class="rounded-[var(--radius-xs)] border border-[var(--input)] bg-[var(--background)] px-3 py-2 text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
							/>
						</div>
						<div>
							<label for="reminder-tz" class="block text-sm text-[var(--muted-foreground)] mb-1">Timezone</label>
							<select
								id="reminder-tz"
								bind:value={timezone}
								onchange={saveReminder}
								class="rounded-[var(--radius-xs)] border border-[var(--input)] bg-[var(--background)] px-3 py-2 text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)] min-w-[200px]"
							>
								{#each COMMON_TIMEZONES as tz}
									<option value={tz}>{tz}</option>
								{/each}
							</select>
						</div>
					</div>
				{/if}
			</div>

			{#if error}
				<p class="mt-2 text-sm text-[var(--color-error)]">{error}</p>
			{/if}
			{#if saving}
				<p class="mt-2 text-sm text-[var(--muted-foreground)]">Saving…</p>
			{/if}
		</section>
	{/if}
</div>
