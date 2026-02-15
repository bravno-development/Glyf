<script lang="ts">
	import { Target } from "lucide-svelte";
	import { onMount } from "svelte";
	import { getScript } from "$lib/services/scripts";

	let {
		selectedScript,
		dailyGoal,
		onSelect
	}: {
		selectedScript: string;
		dailyGoal: number;
		onSelect: (goal: number) => void;
	} = $props();

	let totalChars = $state(92);
	let scriptIcon = $state("あ");
	let scriptLabel = $state("Japanese");

	onMount(async () => {
		try {
			const def = await getScript(selectedScript);
			totalChars = def.totalCharacters;
			scriptIcon = def.icon;
			scriptLabel = def.language;
		} catch {
			// fallback to defaults
		}
	});

	const paces = $derived([
		{
			goal: 5,
			label: "Relaxed",
			days: Math.ceil(totalChars / 5),
			memo: "Start memorising in ~3 weeks",
			recommended: false
		},
		{
			goal: 10,
			label: "Steady",
			days: Math.ceil(totalChars / 10),
			memo: "Start memorising in ~2 weeks",
			recommended: true
		},
		{
			goal: 15,
			label: "Intensive",
			days: Math.ceil(totalChars / 15),
			memo: "Start memorising in ~1 week",
			recommended: false
		}
	]);
</script>

<!-- Hero -->
<div class="flex w-full flex-col items-center gap-3 px-6 pt-6">
	<div class="flex h-[72px] w-[72px] items-center justify-center rounded-[20px] bg-[var(--accent-light-green)]">
		<Target size={36} strokeWidth={1.5} class="text-[var(--accent-green)]" />
	</div>
	<h1 class="text-[26px] font-semibold tracking-tight text-[var(--foreground)]">Set your pace</h1>
	<p class="max-w-[320px] text-center text-[15px] leading-[1.4] text-[var(--muted-foreground)]">
		How many new characters do you want to learn each day? This sets when you start memorisation drills.
	</p>

	<!-- Script badge pill -->
	<div class="flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--card)] px-3.5 py-1.5">
		<span class="font-['Noto_Sans_JP'] text-[14px] text-[var(--accent-green)]">{scriptIcon}</span>
		<span class="text-[12px] font-medium text-[var(--muted-foreground)]">{scriptLabel} · {totalChars} characters total</span>
	</div>
</div>

<!-- Pace cards -->
<div class="flex w-full flex-col gap-3 p-6">
	{#each paces as pace (pace.goal)}
		<button
			type="button"
			onclick={() => onSelect(pace.goal)}
			class="flex w-full items-center gap-3.5 rounded-2xl border-[1.5px] bg-[var(--card)] p-[18px_20px] transition-colors
				{dailyGoal === pace.goal
					? 'border-[var(--accent-green)] shadow-[var(--shadow-card)]'
					: 'border-[var(--border)] shadow-[var(--shadow-card)]'}"
		>
			<div
				class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl
					{dailyGoal === pace.goal ? 'bg-[var(--accent-light-green)]' : 'bg-[var(--tile)]'}"
			>
				<span
					class="text-[22px] font-bold
						{dailyGoal === pace.goal ? 'text-[var(--accent-green)]' : 'text-[var(--muted-foreground)]'}"
				>
					{pace.goal}
				</span>
			</div>

			<div class="flex flex-1 flex-col gap-[3px] text-left">
				<div class="flex items-center gap-2">
					<span class="text-[16px] font-semibold text-[var(--foreground)]">{pace.label}</span>
					{#if pace.recommended}
						<span class="rounded-full bg-[var(--accent-light-green)] px-2 py-[2px] text-[10px] font-semibold text-[var(--accent-green)]">
							Recommended
						</span>
					{/if}
				</div>
				<span class="text-[13px] text-[var(--muted-foreground)]">
					{pace.goal} characters/day · ~{pace.days} days
				</span>
				<span
					class="text-[11px] font-medium
						{dailyGoal === pace.goal ? 'text-[var(--accent-green)]' : 'text-[var(--muted-foreground)]'}"
				>
					{pace.memo}
				</span>
			</div>

			<!-- Radio indicator -->
			<div
				class="flex h-5 w-5 shrink-0 items-center justify-center rounded-full
					{dailyGoal === pace.goal
						? 'bg-[var(--accent-green)]'
						: 'border-2 border-[var(--border)]'}"
			>
				{#if dailyGoal === pace.goal}
					<div class="h-2 w-2 rounded-full bg-[var(--primary-foreground)]"></div>
				{/if}
			</div>
		</button>
	{/each}
</div>
