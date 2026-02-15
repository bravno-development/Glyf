<script lang="ts">
	import { Sparkles, Calendar } from "lucide-svelte";
	import { onMount } from "svelte";
	import { getScript } from "$lib/services/scripts";

	let {
		selectedScript,
		dailyGoal
	}: {
		selectedScript: string;
		dailyGoal: number;
	} = $props();

	let totalChars = $state(0);
	let scriptLabel = $state("");
	let scriptIcon = $state("");

	onMount(async () => {
		try {
			const def = await getScript(selectedScript);
			totalChars = def.totalCharacters;
			scriptLabel = def.name;
			scriptIcon = def.icon;
		} catch {
			// fallback to defaults
		}
	});

	let estimatedDays = $derived(Math.ceil(totalChars / dailyGoal));

	let paceLabel = $derived(
		dailyGoal === 5 ? "Relaxed" : dailyGoal === 10 ? "Steady" : "Intensive"
	);
</script>

<!-- Hero -->
<div class="flex w-full flex-col items-center gap-4 px-6 pt-10 pb-6">
	<div class="flex h-[88px] w-[88px] items-center justify-center rounded-3xl bg-[var(--accent-light-green)]">
		<Sparkles size={44} strokeWidth={1.5} class="text-[var(--accent-green)]" />
	</div>
	<h1 class="text-[28px] font-bold tracking-tight text-[var(--foreground)]">You're all set!</h1>
	<p class="max-w-[300px] text-center text-[15px] leading-[1.4] text-[var(--muted-foreground)]">
		Here's your learning plan. Your first lesson starts with the basics.
	</p>
</div>

<!-- Summary card -->
<div class="w-full px-6">
	<div class="flex flex-col gap-5 rounded-[20px] bg-[var(--card)] p-[24px_28px] shadow-[var(--shadow-card)]">
		<!-- Script row -->
		<div class="flex items-center justify-between">
			<div class="flex flex-col gap-0.5">
				<span class="text-[12px] font-medium text-[var(--muted-foreground)]">Script</span>
				<span class="text-[16px] font-semibold text-[var(--foreground)]">{scriptLabel}</span>
			</div>
			<div class="flex items-center gap-1.5">
				<span class="font-['Noto_Sans_JP'] text-[18px] text-[var(--accent-green)]">{scriptIcon}</span>
			</div>
		</div>

		<div class="h-px w-full bg-[var(--border)]"></div>

		<!-- Daily goal row -->
		<div class="flex items-center justify-between">
			<div class="flex flex-col gap-0.5">
				<span class="text-[12px] font-medium text-[var(--muted-foreground)]">Daily goal</span>
				<span class="text-[16px] font-semibold text-[var(--foreground)]">{dailyGoal} characters/day</span>
			</div>
			<span class="rounded-full bg-[var(--accent-light-green)] px-2.5 py-1 text-[12px] font-semibold text-[var(--accent-green)]">
				{paceLabel}
			</span>
		</div>

		<div class="h-px w-full bg-[var(--border)]"></div>

		<!-- Timeline row -->
		<div class="flex items-center justify-between">
			<div class="flex flex-col gap-0.5">
				<span class="text-[12px] font-medium text-[var(--muted-foreground)]">Estimated timeline</span>
				<span class="text-[16px] font-semibold text-[var(--foreground)]">~{estimatedDays} days to learn all {totalChars}</span>
			</div>
			<Calendar size={20} strokeWidth={1.5} class="text-[var(--muted-foreground)]" />
		</div>
	</div>
</div>
