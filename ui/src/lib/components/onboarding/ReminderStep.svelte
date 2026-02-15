<script lang="ts">
	import { Bell } from "lucide-svelte";

	let {
		selectedTime,
		onSelect
	}: {
		selectedTime: "09:00" | "13:00" | "18:00" | null;
		onSelect: (time: "09:00" | "13:00" | "18:00") => void;
	} = $props();

	const slots = [
		{ value: "09:00" as const, label: "Morning", description: "09:00" },
		{ value: "13:00" as const, label: "Afternoon", description: "13:00" },
		{ value: "18:00" as const, label: "Evening", description: "18:00" },
	];
</script>

<!-- Hero -->
<div class="flex w-full flex-col items-center gap-3 px-6 pt-6">
	<div class="flex h-[72px] w-[72px] items-center justify-center rounded-[20px] bg-[var(--accent-light-green)]">
		<Bell size={36} strokeWidth={1.5} class="text-[var(--accent-green)]" />
	</div>
	<h1 class="text-[26px] font-semibold tracking-tight text-[var(--foreground)]">Study reminders</h1>
	<p class="max-w-[320px] text-center text-[15px] leading-[1.4] text-[var(--muted-foreground)]">
		A daily nudge keeps your streak alive. Pick a time that works for you.
	</p>
</div>

<!-- Time preset cards -->
<div class="flex w-full flex-col gap-3 p-6">
	{#each slots as slot (slot.value)}
		<button
			type="button"
			onclick={() => onSelect(slot.value)}
			class="flex w-full items-center gap-3.5 rounded-2xl border-[1.5px] bg-[var(--card)] p-[18px_20px] transition-colors
				{selectedTime === slot.value
					? 'border-[var(--accent-green)] shadow-[var(--shadow-card)]'
					: 'border-[var(--border)] shadow-[var(--shadow-card)]'}"
		>
			<div
				class="flex h-12 min-w-[72px] shrink-0 items-center justify-center rounded-xl px-2
					{selectedTime === slot.value ? 'bg-[var(--accent-light-green)]' : 'bg-[var(--tile)]'}"
			>
				<span
					class="truncate text-[16px] font-bold tabular-nums
						{selectedTime === slot.value ? 'text-[var(--accent-green)]' : 'text-[var(--muted-foreground)]'}"
				>
					{slot.description}
				</span>
			</div>

			<div class="flex flex-1 flex-col gap-[3px] text-left">
				<span class="text-[16px] font-semibold text-[var(--foreground)]">{slot.label}</span>
			</div>

			<!-- Radio indicator -->
			<div
				class="flex h-5 w-5 shrink-0 items-center justify-center rounded-full
					{selectedTime === slot.value
						? 'bg-[var(--accent-green)]'
						: 'border-2 border-[var(--border)]'}"
			>
				{#if selectedTime === slot.value}
					<div class="h-2 w-2 rounded-full bg-[var(--primary-foreground)]"></div>
				{/if}
			</div>
		</button>
	{/each}
</div>
