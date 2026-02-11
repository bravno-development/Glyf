<script lang="ts">
	import { Languages, Check } from "lucide-svelte";

	let {
		selectedScript,
		onSelect
	}: {
		selectedScript: string;
		onSelect: (script: string) => void;
	} = $props();

	const scripts = [
		{
			id: "hiragana",
			char: "あ",
			charFont: "font-['Noto_Sans_JP']",
			name: "Japanese",
			desc: "Hiragana & Katakana \u00b7 92 characters",
			available: true
		},
		{
			id: "hangul",
			char: "\u3131",
			charFont: "font-['Noto_Sans_KR']",
			name: "Korean",
			desc: "Hangul \u00b7 40 characters",
			available: false
		},
		{
			id: "arabic",
			char: "\u0627",
			charFont: "font-['Noto_Sans_Arabic']",
			name: "Arabic",
			desc: "Abjad \u00b7 28 characters",
			available: false
		}
	];
</script>

<!-- Hero -->
<div class="flex w-full flex-col items-center gap-3 px-6 pt-8">
	<div class="flex h-[72px] w-[72px] items-center justify-center rounded-[20px] bg-[var(--accent-light-green)]">
		<Languages size={36} strokeWidth={1.5} class="text-[var(--accent-green)]" />
	</div>
	<h1 class="text-[26px] font-semibold tracking-tight text-[#1A1918]">Choose your script</h1>
	<p class="max-w-[320px] text-center text-[15px] leading-[1.4] text-[#6D6C6A]">
		Which writing system would you like to learn first? You can always add more later.
	</p>
</div>

<!-- Script cards -->
<div class="flex w-full flex-col gap-3 px-6 pt-7">
	{#each scripts as script (script.id)}
		<button
			type="button"
			onclick={() => script.available && onSelect(script.id)}
			class="flex w-full items-center gap-4 rounded-2xl border-[1.5px] bg-white p-[18px_20px] shadow-[0_2px_12px_rgba(26,25,24,0.03)] transition-colors
				{selectedScript === script.id
					? 'border-[var(--accent-green)] shadow-[0_2px_12px_rgba(26,25,24,0.06)]'
					: 'border-[#E5E4E1]'}
				{script.available ? 'cursor-pointer' : 'cursor-default opacity-70'}"
			disabled={!script.available}
		>
			<div
				class="flex h-14 w-14 shrink-0 items-center justify-center rounded-[14px]
					{selectedScript === script.id
						? 'bg-[var(--accent-light-green)]'
						: 'bg-[#EDECEA]'}"
			>
				<span
					class="text-[28px] {script.charFont}
						{selectedScript === script.id ? 'text-[var(--accent-green)]' : 'text-[#6D6C6A]'}"
				>
					{script.char}
				</span>
			</div>

			<div class="flex flex-1 flex-col gap-1 text-left">
				<span class="text-[16px] font-semibold text-[#1A1918]">{script.name}</span>
				<span class="text-[13px] text-[#6D6C6A]">{script.desc}</span>
			</div>

			{#if selectedScript === script.id}
				<div class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--accent-green)]">
					<Check size={14} strokeWidth={2.5} class="text-white" />
				</div>
			{:else if !script.available}
				<span class="shrink-0 rounded-md bg-[#EDECEA] px-2 py-1 text-[10px] font-semibold text-[#9C9B99]">
					Soon
				</span>
			{/if}
		</button>
	{/each}
</div>
