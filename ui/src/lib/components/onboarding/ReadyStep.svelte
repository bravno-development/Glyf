<script lang="ts">
	import { Sparkles, Calendar } from "lucide-svelte";

	let {
		selectedScript,
		dailyGoal
	}: {
		selectedScript: string;
		dailyGoal: number;
	} = $props();

	const TOTAL_CHARS = 92;
	let estimatedDays = $derived(Math.ceil(TOTAL_CHARS / dailyGoal));

	let scriptLabel = $derived(selectedScript === "hiragana" ? "Japanese" : selectedScript);

	let paceLabel = $derived(
		dailyGoal === 5 ? "Relaxed" : dailyGoal === 10 ? "Steady" : "Intensive"
	);
</script>

<!-- Hero -->
<div class="flex w-full flex-col items-center gap-4 px-6 pt-10 pb-6">
	<div class="flex h-[88px] w-[88px] items-center justify-center rounded-3xl bg-[var(--accent-light-green)]">
		<Sparkles size={44} strokeWidth={1.5} class="text-[var(--accent-green)]" />
	</div>
	<h1 class="text-[28px] font-bold tracking-tight text-[#1A1918]">You're all set!</h1>
	<p class="max-w-[300px] text-center text-[15px] leading-[1.4] text-[#6D6C6A]">
		Here's your learning plan. Your first lesson starts with the Japanese vowels.
	</p>
</div>

<!-- Summary card -->
<div class="w-full px-6">
	<div class="flex flex-col gap-5 rounded-[20px] bg-white p-[24px_28px] shadow-[0_4px_20px_rgba(26,25,24,0.06)]">
		<!-- Script row -->
		<div class="flex items-center justify-between">
			<div class="flex flex-col gap-0.5">
				<span class="text-[12px] font-medium text-[#9C9B99]">Script</span>
				<span class="text-[16px] font-semibold text-[#1A1918]">{scriptLabel}</span>
			</div>
			<div class="flex items-center gap-1.5">
				<span class="font-['Noto_Sans_JP'] text-[18px] text-[var(--accent-green)]">あ</span>
				<span class="font-['Noto_Sans_JP'] text-[18px] text-[var(--accent-warm)]">ア</span>
			</div>
		</div>

		<div class="h-px w-full bg-[#E5E4E1]"></div>

		<!-- Daily goal row -->
		<div class="flex items-center justify-between">
			<div class="flex flex-col gap-0.5">
				<span class="text-[12px] font-medium text-[#9C9B99]">Daily goal</span>
				<span class="text-[16px] font-semibold text-[#1A1918]">{dailyGoal} characters/day</span>
			</div>
			<span class="rounded-full bg-[var(--accent-light-green)] px-2.5 py-1 text-[12px] font-semibold text-[var(--accent-green)]">
				{paceLabel}
			</span>
		</div>

		<div class="h-px w-full bg-[#E5E4E1]"></div>

		<!-- Timeline row -->
		<div class="flex items-center justify-between">
			<div class="flex flex-col gap-0.5">
				<span class="text-[12px] font-medium text-[#9C9B99]">Estimated timeline</span>
				<span class="text-[16px] font-semibold text-[#1A1918]">~{estimatedDays} days to learn all {TOTAL_CHARS}</span>
			</div>
			<Calendar size={20} strokeWidth={1.5} class="text-[#9C9B99]" />
		</div>
	</div>
</div>
