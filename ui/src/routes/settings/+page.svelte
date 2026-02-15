<script lang="ts">
	import { goto } from "$app/navigation";
	import { onMount } from "svelte";
	import { userStore } from "$lib/stores/user";
	import { learnStore } from "$lib/stores/learn";
	import { api } from "$lib/services/api";
	import { Info } from "lucide-svelte";
	import Sidebar from "$lib/components/Sidebar.svelte";

	const DAILY_GOAL_OPTIONS = [
		{ value: "5", label: "5 characters/day (Light)" },
		{ value: "10", label: "10 characters/day (Steady)" },
		{ value: "20", label: "20 characters/day (Intense)" },
	];

	const REMINDER_TIME_OPTIONS = [
		{ value: "09:00", label: "09:00 (Morning)" },
		{ value: "13:00", label: "13:00 (Afternoon)" },
		{ value: "18:00", label: "18:00 (Evening)" },
	];

	const THEME_OPTIONS = [
		{ value: "system", label: "System" },
		{ value: "light", label: "Light" },
		{ value: "dark", label: "Dark" },
	];

	const LANGUAGE_OPTIONS = [{ value: "en-GB", label: "English (UK)" }];

	const COMMON_TIMEZONES = [
		"UTC",
		"America/New_York",
		"America/Chicago",
		"America/Denver",
		"America/Los_Angeles",
		"Europe/London",
		"Europe/Paris",
		"Asia/Tokyo",
		"Australia/Sydney",
	];

	let loading = $state(true);
	let error = $state<string | null>(null);
	let savingReminder = $state(false);

	let displayName = $state("");
	let email = $state("");
	let reminderEnabled = $state(false);
	let reminderTimeLocal = $state("09:00");
	let timezone = $state("UTC");
	let pushEnabled = $state(false);
	let dailyGoal = $state("10");
	let theme = $state("system");
	let language = $state("en-GB");
	let deleteDialogOpen = $state(false);
	let reviewKeys = $state(["1", "2", "3", "4"]);

	$effect(() => {
		if (!$userStore.initialised) return;
		if (!$userStore.isAuthenticated) {
			goto("/auth/login");
		}
	});

	onMount(async () => {
		try {
			const profile = await api.user.getProfile();
			email = profile.email ?? "";
			reminderEnabled = profile.reminderEnabled ?? false;
			reminderTimeLocal = profile.reminderTimeLocal ?? "09:00";
			timezone = profile.timezone ?? "UTC";
			const storedGoal = typeof localStorage !== "undefined" && localStorage.getItem("glyf-daily-goal");
			if (storedGoal) dailyGoal = storedGoal;
			const storedTheme = typeof localStorage !== "undefined" && localStorage.getItem("glyf-theme");
			if (storedTheme && ["light", "dark", "system"].includes(storedTheme)) theme = storedTheme;
			reviewKeys = learnStore.getReviewOptionKeys();
		} catch (e) {
			error = e instanceof Error ? e.message : "Failed to load settings";
		} finally {
			loading = false;
		}
	});

	// function applyTheme(value: string) {
	// 	if (typeof document === "undefined") return;
	// 	const html = document.documentElement;
	// 	html.classList.remove("theme-light", "theme-dark");
	// 	if (value === "light") html.classList.add("theme-light");
	// 	else if (value === "dark") html.classList.add("theme-dark");
	// }

	// function onThemeChange(e: Event) {
	// 	const value = (e.target as HTMLSelectElement).value;
	// 	theme = value;
	// 	if (typeof localStorage !== "undefined") localStorage.setItem("glyf-theme", value);
	// 	applyTheme(value);
	// }

	function onDailyGoalChange(e: Event) {
		const value = (e.target as HTMLSelectElement).value;
		dailyGoal = value;
		if (typeof localStorage !== "undefined") localStorage.setItem("glyf-daily-goal", value);
	}

	async function saveReminder() {
		error = null;
		savingReminder = true;
		try {
			await api.user.updateReminder({
				reminderEnabled,
				...(reminderEnabled && { reminderTimeLocal, timezone }),
			});
		} catch (e) {
			error = e instanceof Error ? e.message : "Failed to save reminder";
		} finally {
			savingReminder = false;
		}
	}

	function onEmailReminderChange() {
		reminderEnabled = !reminderEnabled;
		saveReminder();
	}

	function onReminderTimeChange(e: Event) {
		reminderTimeLocal = (e.target as HTMLSelectElement).value;
		saveReminder();
	}

	function onReviewKeyChange(index: number, value: string) {
		const next = [...reviewKeys];
		next[index] = value.slice(0, 1);
		reviewKeys = next;
		learnStore.setReviewOptionKeys(next);
	}

	function resetReviewKeys() {
		reviewKeys = ["1", "2", "3", "4"];
		learnStore.setReviewOptionKeys(reviewKeys);
	}

	function openDeleteDialog() {
		deleteDialogOpen = true;
	}

	function closeDeleteDialog() {
		deleteDialogOpen = false;
	}

	function confirmDeleteAccount() {
		closeDeleteDialog();
		// Stub: no DELETE account API yet
	}
</script>

<div class="flex min-h-screen">
	<Sidebar />

	<main class="flex-1 overflow-y-auto bg-[var(--background)]">
		<div class="flex flex-col gap-10 py-10 px-12">
			<!-- Page header -->
			<header class="flex items-end justify-between">
				<div>
					<h1 class="text-[28px] font-semibold text-[var(--foreground)]">
						Settings
					</h1>
					<p class="mt-1 text-[14px] text-[var(--muted-foreground)]">
						Manage your account, preferences &#38; notifications
					</p>
				</div>
			</header>

			{#if loading}
				<p class="text-[var(--muted-foreground)]">Loading…</p>
			{:else}
				<!-- Profile -->
				<section class="flex flex-col gap-5" aria-labelledby="profile-heading">
					<div class="border-b border-[var(--border)] pb-4">
						<h2
							id="profile-heading"
							class="text-[18px] font-semibold text-[var(--foreground)]"
						>
							Profile
						</h2>
						<p class="mt-1 text-[13px] text-[var(--muted-foreground)]">
							Your personal information &#38; display name
						</p>
					</div>
					<div class="flex flex-col gap-5">
						<div class="flex flex-col gap-1.5">
							<label for="display-name" class="text-[14px] text-[var(--muted-foreground)]">
								Display name
							</label>
							<input
								id="display-name"
								type="text"
								bind:value={displayName}
								placeholder="Your name"
								class="rounded-[var(--radius-pill)] border border-[var(--input)] bg-[var(--accent)] px-6 py-[18px] text-[16px] text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
							/>
						</div>
						<div class="flex flex-col gap-1.5">
							<label for="email" class="text-[14px] text-[var(--muted-foreground)]">
								Email address
							</label>
							<input
								id="email"
								type="email"
								value={email}
								readonly
								class="rounded-[var(--radius-pill)] border border-[var(--input)] bg-[var(--accent)] px-6 py-[18px] text-[16px] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)] disabled:opacity-70"
							/>
						</div>
						<button
							type="button"
							disabled
							class="w-fit rounded-[var(--radius-pill)] bg-[var(--primary)] px-4 py-2.5 text-[14px] font-medium text-[var(--primary-foreground)] opacity-60 cursor-not-allowed"
							title="Profile update not available yet"
						>
							Save changes
						</button>
					</div>
				</section>

				<!-- Study Preferences -->
				<section class="flex flex-col gap-5" aria-labelledby="study-heading">
					<div class="border-b border-[var(--border)] pb-4">
						<h2
							id="study-heading"
							class="text-[18px] font-semibold text-[var(--foreground)]"
						>
							Study Preferences
						</h2>
						<p class="mt-1 text-[13px] text-[var(--muted-foreground)]">
							Customise your daily learning pace &#38; schedule
						</p>
					</div>
					<div class="flex flex-col gap-5">
						<div class="flex flex-col gap-1.5">
							<label for="daily-goal" class="text-[14px] text-[var(--muted-foreground)]">
								Daily character goal
							</label>
							<select
								id="daily-goal"
								value={dailyGoal}
								onchange={onDailyGoalChange}
								class="select-pill rounded-[var(--radius-pill)] border border-[var(--input)] bg-[var(--accent)] px-6 py-[18px] text-[16px] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
							>
								{#each DAILY_GOAL_OPTIONS as opt}
									<option value={opt.value}>{opt.label}</option>
								{/each}
							</select>
						</div>
						<div class="flex flex-col gap-1.5">
							<label for="reminder-time" class="text-[14px] text-[var(--muted-foreground)]">
								Reminder time
							</label>
							<select
								id="reminder-time"
								value={reminderTimeLocal}
								onchange={onReminderTimeChange}
								class="select-pill rounded-[var(--radius-pill)] border border-[var(--input)] bg-[var(--accent)] px-6 py-[18px] text-[16px] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
							>
								{#each REMINDER_TIME_OPTIONS as opt}
									<option value={opt.value}>{opt.label}</option>
								{/each}
							</select>
						</div>
						<div class="flex flex-col gap-1.5">
							<label for="review-key-0" class="text-[14px] text-[var(--muted-foreground)]">
								Review shortcut keys
							</label>
							<p class="text-[13px] text-[var(--muted-foreground)]">
								Keys to select quiz answers (options 1–4). One character per key.
							</p>
							<div class="flex items-center gap-2">
								{#each reviewKeys as key, i (i)}
									<input
										id={i === 0 ? "review-key-0" : undefined}
										type="text"
										inputmode="text"
										maxlength="1"
										value={key}
										oninput={(e) => onReviewKeyChange(i, (e.target as HTMLInputElement).value)}
										aria-label="Key for option {i + 1}"
										class="h-12 w-12 rounded-[var(--radius-m)] border border-[var(--input)] bg-[var(--accent)] text-center text-[16px] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
									/>
								{/each}
								<button
									type="button"
									onclick={resetReviewKeys}
									class="text-[13px] text-[var(--muted-foreground)] underline hover:text-[var(--foreground)]"
								>
									Reset to 1,2,3,4
								</button>
							</div>
						</div>
					</div>
				</section>

				<!-- Notifications -->
				<section class="flex flex-col gap-5" aria-labelledby="notif-heading">
					<div class="border-b border-[var(--border)] pb-4">
						<h2
							id="notif-heading"
							class="text-[18px] font-semibold text-[var(--foreground)]"
						>
							Notifications
						</h2>
						<p class="mt-1 text-[13px] text-[var(--muted-foreground)]">
							Control how &#38; when we reach out to you
						</p>
					</div>
					<div
						class="overflow-hidden rounded-[var(--radius-m)] border border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow-card)]"
					>
						<div
							class="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--border)] px-6 py-5"
						>
							<div class="flex flex-col gap-0.5">
								<span class="text-[14px] font-medium text-[var(--foreground)]">
									Push notifications
								</span>
								<span class="text-[13px] text-[var(--muted-foreground)]">
									Receive study reminders on your device
								</span>
							</div>
							<button
								type="button"
								role="switch"
								aria-checked={pushEnabled}
								aria-label="Toggle push notifications"
								onclick={() => (pushEnabled = !pushEnabled)}
								class="relative h-6 w-11 shrink-0 rounded-[var(--radius-pill)] border border-[var(--input)] transition-colors {pushEnabled
									? 'bg-[var(--primary)] border-[var(--primary)]'
									: 'bg-[var(--accent)]'}"
							>
								<span
									class="absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform {pushEnabled
										? 'translate-x-5'
										: 'translate-x-0'}"
								></span>
							</button>
						</div>
						<div
							class="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--border)] px-6 py-5"
						>
							<div class="flex flex-col gap-0.5">
								<span class="text-[14px] font-medium text-[var(--foreground)]">
									Email reminders
								</span>
								<span class="text-[13px] text-[var(--muted-foreground)]">
									Fallback when push notifications aren't available
								</span>
							</div>
							<button
								type="button"
								role="switch"
								aria-checked={reminderEnabled}
								aria-label="Toggle email reminders"
								onclick={onEmailReminderChange}
								class="relative h-6 w-11 shrink-0 rounded-[var(--radius-pill)] border border-[var(--input)] transition-colors {reminderEnabled
									? 'bg-[var(--primary)] border-[var(--primary)]'
									: 'bg-[var(--accent)]'}"
							>
								<span
									class="absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform {reminderEnabled
										? 'translate-x-5'
										: 'translate-x-0'}"
								></span>
							</button>
						</div>
						<div class="flex items-start gap-3 bg-[var(--tile)] px-6 py-4">
							<Info class="mt-0.5 size-4 shrink-0 text-[var(--primary)]" aria-hidden="true" />
							<p class="text-[12px] leading-relaxed text-[var(--muted-foreground)]">
								We'll try mobile push notifications first. If you're on the web &#38; push isn't available, we'll send a friendly email reminder instead.
							</p>
						</div>
					</div>
					{#if error}
						<p class="text-[14px] text-[var(--color-error)]">{error}</p>
					{/if}
					{#if savingReminder}
						<p class="text-[14px] text-[var(--muted-foreground)]">Saving…</p>
					{/if}
				</section>

				<!-- Appearance -->
				<section class="flex flex-col gap-5" aria-labelledby="appear-heading">
					<div class="border-b border-[var(--border)] pb-4">
						<h2
							id="appear-heading"
							class="text-[18px] font-semibold text-[var(--foreground)]"
						>
							Appearance
						</h2>
						<p class="mt-1 text-[13px] text-[var(--muted-foreground)]">
							Choose your preferred theme &#38; display settings
						</p>
					</div>
					<div class="flex flex-col gap-5">
						<div class="flex flex-col gap-1.5">
							<label for="theme" class="text-[14px] text-[var(--muted-foreground)]">
								Theme
							</label>
							<select
								id="theme"
								value={theme}
								class="select-pill rounded-[var(--radius-pill)] border border-[var(--input)] bg-[var(--accent)] px-6 py-[18px] text-[16px] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
							>
								{#each THEME_OPTIONS as opt}
									<option value={opt.value}>{opt.label}</option>
								{/each}
							</select>
						</div>
						<div class="flex flex-col gap-1.5">
							<label for="language" class="text-[14px] text-[var(--muted-foreground)]">
								Interface language
							</label>
							<select
								id="language"
								bind:value={language}
								class="select-pill rounded-[var(--radius-pill)] border border-[var(--input)] bg-[var(--accent)] px-6 py-[18px] text-[16px] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
							>
								{#each LANGUAGE_OPTIONS as opt}
									<option value={opt.value}>{opt.label}</option>
								{/each}
							</select>
						</div>
					</div>
				</section>

				<!-- Danger Zone -->
				<section class="flex flex-col gap-5" aria-labelledby="danger-heading">
					<div class="border-b border-[var(--border)] pb-4">
						<h2
							id="danger-heading"
							class="text-[18px] font-semibold text-[var(--destructive)]"
						>
							Danger Zone
						</h2>
						<p class="mt-1 text-[13px] text-[var(--muted-foreground)]">
							Irreversible actions — proceed w/ caution
						</p>
					</div>
					<div
						class="flex flex-wrap items-center justify-between gap-4 rounded-[var(--radius-m)] border border-[var(--border)] bg-[var(--card)] p-6 shadow-[var(--shadow-card)]"
					>
						<div class="flex flex-col gap-0.5">
							<span class="text-[14px] font-medium text-[var(--foreground)]">
								Delete account
							</span>
							<span class="text-[13px] text-[var(--muted-foreground)]">
								Permanently remove your account &#38; all learning data
							</span>
						</div>
						<button
							type="button"
							onclick={openDeleteDialog}
							class="shrink-0 rounded-[var(--radius-pill)] bg-[var(--destructive)] px-4 py-2.5 text-[14px] font-medium text-[var(--destructive-foreground)] transition-opacity hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
						>
							Delete account
						</button>
					</div>
				</section>
			{/if}
		</div>
	</main>
</div>

<!-- Delete confirmation dialog -->
{#if deleteDialogOpen}
	<div
		role="dialog"
		aria-modal="true"
		aria-labelledby="delete-dialog-title"
		aria-describedby="delete-dialog-desc"
		tabindex="-1"
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
		onclick={(e) => e.target === e.currentTarget && closeDeleteDialog()}
		onkeydown={(e) => e.key === 'Escape' && closeDeleteDialog()}
	>
		<div
			tabindex="-1"
			class="w-full max-w-md rounded-[var(--radius-m)] border border-[var(--border)] bg-[var(--card)] p-6 shadow-[var(--shadow-card)]"
		>
			<h3 id="delete-dialog-title" class="text-[18px] font-semibold text-[var(--foreground)]">
				Delete account?
			</h3>
			<p id="delete-dialog-desc" class="mt-2 text-[14px] text-[var(--muted-foreground)]">
				This will permanently remove your account and all learning data. This action cannot be undone.
			</p>
			<div class="mt-6 flex justify-end gap-3">
				<button
					type="button"
					onclick={closeDeleteDialog}
					class="rounded-[var(--radius-pill)] border border-[var(--border)] bg-transparent px-4 py-2.5 text-[14px] font-medium text-[var(--foreground)] hover:bg-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
				>
					Cancel
				</button>
				<button
					type="button"
					onclick={confirmDeleteAccount}
					class="rounded-[var(--radius-pill)] bg-[var(--destructive)] px-4 py-2.5 text-[14px] font-medium text-[var(--destructive-foreground)] hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
				>
					Delete account
				</button>
			</div>
		</div>
	</div>
{/if}
