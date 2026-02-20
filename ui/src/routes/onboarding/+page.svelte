<script lang="ts">
	import { goto } from "$app/navigation";
	import { userStore } from "$lib/stores/user";
	import { api } from "$lib/services/api";
	import { ArrowLeft, ArrowRight, Lightbulb } from "lucide-svelte";
	import { trackEvent } from "$lib/services/analytics";

	import StepDots from "$lib/components/onboarding/StepDots.svelte";
	import LanguageStep from "$lib/components/onboarding/LanguageStep.svelte";
	import PaceStep from "$lib/components/onboarding/PaceStep.svelte";
	import ReminderStep from "$lib/components/onboarding/ReminderStep.svelte";
	import ReadyStep from "$lib/components/onboarding/ReadyStep.svelte";

	let step = $state(1);
	let selectedScript = $state("");
	let dailyGoal = $state(10);
	let reminderTime = $state<"09:00" | "13:00" | "18:00" | null>("13:00");
	let loading = $state(false);
	let ready = $state(false);
	let statusChecked = false;

	$effect(() => {
		if (!$userStore.initialised) return;

		if (!$userStore.isAuthenticated) {
			goto("/auth/login");
			return;
		}

		if (!statusChecked) {
			statusChecked = true;
			api.onboarding
				.status()
				.then(({ onboarded }) => {
					if (onboarded) {
						goto("/dashboard");
					} else {
						ready = true;
					}
				})
				.catch(() => {
					ready = true;
				});
		}
	});

	function handleBack() {
		if (step > 1) step--;
	}

	function handleContinue() {
		if (step < 4) {
			step++;
		}
	}

	async function handleSetReminder() {
		loading = true;
		try {
			const timezone =
				typeof Intl !== "undefined" &&
				Intl.DateTimeFormat?.().resolvedOptions?.().timeZone
					? Intl.DateTimeFormat().resolvedOptions().timeZone
					: "UTC";
			const time = reminderTime ?? "13:00";
			await api.user.updateReminder({
				reminderEnabled: true,
				reminderTimeLocal: time,
				timezone,
			});
			step = 4;
		} catch {
			// continue to step 4 anyway
			step = 4;
		} finally {
			loading = false;
		}
	}

	async function handleSkipReminder() {
		loading = true;
		try {
			await api.user.updateReminder({ reminderEnabled: false });
			step = 4;
		} catch {
			step = 4;
		} finally {
			loading = false;
		}
	}

	async function handleFinish() {
		loading = true;
		try {
			await api.onboarding.complete(selectedScript, dailyGoal);
			trackEvent("onboarding_completed", {
				script: selectedScript,
				daily_goal: dailyGoal,
			});
			goto("/dashboard");
		} catch {
			goto("/dashboard");
		}
	}
</script>

{#if ready}
	<div class="flex min-h-screen w-full flex-col bg-[var(--background)]">
		<!-- Top bar -->
		<div
			class="flex h-14 w-full items-center justify-between px-6 md:px-10"
		>
			<StepDots currentStep={step} />

			{#if step !== 1}
				<button
					type="button"
					onclick={handleBack}
					class="flex items-center gap-1.5 text-[14px] font-medium text-[var(--muted-foreground)] transition-colors hover:text-[var(--foreground)]"
				>
					<ArrowLeft size={18} strokeWidth={1.5} />
					Back
				</button>
			{/if}
		</div>

		<!-- Step content -->
		{#if step === 1}
			<LanguageStep
				{selectedScript}
				onSelect={(s) => (selectedScript = s)}
			/>
		{:else if step === 2}
			<PaceStep
				{selectedScript}
				{dailyGoal}
				onSelect={(g) => (dailyGoal = g)}
			/>
		{:else if step === 3}
			<ReminderStep
				selectedTime={reminderTime}
				onSelect={(t) => (reminderTime = t)}
			/>
		{:else}
			<ReadyStep {selectedScript} {dailyGoal} />
		{/if}

		<!-- Bottom -->
		<div
			class="mt-auto flex w-full flex-col items-center gap-3 px-6 py-10 md:px-10"
		>
			{#if step === 2}
				<p
					class="text-center text-[12px] text-[var(--muted-foreground)]"
				>
					You can change this anytime in Settings
				</p>
			{/if}

			{#if step === 3}
				<button
					type="button"
					onclick={handleSetReminder}
					disabled={loading}
					class="flex h-[52px] w-full items-center justify-center rounded-full bg-[var(--accent-green)] text-[16px] font-semibold text-[var(--primary-foreground)] transition-opacity hover:opacity-90 disabled:opacity-50"
				>
					Set reminder
				</button>
				<button
					type="button"
					onclick={handleSkipReminder}
					disabled={loading}
					class="text-[13px] font-medium text-[var(--muted-foreground)] transition-colors hover:text-[var(--foreground)]"
				>
					Skip for now
				</button>
			{:else if step === 4}
				<div
					class="flex w-full items-start gap-3 rounded-xl bg-[var(--tile)] p-[14px_16px]"
				>
					<Lightbulb
						size={18}
						strokeWidth={1.5}
						class="shrink-0 text-[var(--accent-warm)]"
					/>
					<p
						class="text-[13px] leading-[1.4] text-[var(--muted-foreground)]"
					>
						Tip: Short, daily sessions work better than long,
						irregular ones.
					</p>
				</div>
			{/if}

			{#if step < 3}
				<button
					type="button"
					onclick={handleContinue}
					class="flex h-[52px] w-full items-center justify-center rounded-full bg-[var(--accent-green)] text-[16px] font-semibold text-[var(--primary-foreground)] transition-opacity hover:opacity-90"
				>
					Continue
				</button>
			{:else if step === 4}
				<button
					type="button"
					onclick={handleFinish}
					disabled={loading}
					class="flex h-14 w-full items-center justify-center gap-2 rounded-full bg-[var(--accent-green)] text-[16px] font-semibold text-[var(--primary-foreground)] transition-opacity hover:opacity-90 disabled:opacity-50"
				>
					Start learning
					<ArrowRight size={20} strokeWidth={2} />
				</button>
			{/if}
		</div>
	</div>
{/if}
