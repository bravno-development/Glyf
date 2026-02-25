<script lang="ts">
	import type { CharacterForms } from '$lib/services/scripts';

	export interface ContentRow {
		character: string;
		meaning: string;
		order: number;
		forms?: CharacterForms;
		description?: string;
	}

	interface Row {
		title: string;
		content: ContentRow[];
	}

	let { rows = [], lowercaseFriendly = false }: { rows: Row[]; lowercaseFriendly?: boolean } = $props();

	function isOverviewSection(content: ContentRow[]): boolean {
		return content.length === 1 && content[0].character === '';
	}

	function sectionHasForms(content: ContentRow[]): boolean {
		return content.some((c) => !!c.forms);
	}
</script>

<div class="flex flex-col gap-8">
	{#each rows as row, i (i)}
		<section class="flex flex-col gap-4" aria-labelledby="section-{i}">
			<h2
				id="section-{i}"
				class="border-b border-[var(--border)] pb-3 text-[18px] font-semibold text-[var(--foreground)]"
			>
				{row.title}
			</h2>
			{#if isOverviewSection(row.content)}
				<p class="text-[14px] leading-[1.5] text-[var(--muted-foreground)]">
					{row.content[0].meaning}
				</p>
			{:else if sectionHasForms(row.content)}
				<!-- Arabic-style: forms table -->
				<div class="flex flex-col gap-3" dir="rtl">
					<!-- Header row -->
					<div class="grid grid-cols-[1fr_1fr_1fr_1fr_auto] gap-2 px-1">
						{#each ['Isolated', 'Initial', 'Medial', 'Final'] as label}
							<span class="text-center text-[11px] font-medium text-[var(--muted-foreground)]" dir="ltr">
								{label}
							</span>
						{/each}
						<span class="w-16 text-center text-[11px] font-medium text-[var(--muted-foreground)]" dir="ltr">
							Sound
						</span>
					</div>
					{#each row.content as item (item.character + item.order)}
						<div class="flex flex-col gap-1.5">
							<div class="grid grid-cols-[1fr_1fr_1fr_1fr_auto] items-center gap-2">
								{#each ['isolated', 'initial', 'medial', 'final'] as pos}
									<div
										class="flex min-h-12 items-center justify-center rounded-[var(--radius-xs)] bg-[var(--tile)] px-2 text-[26px] font-medium text-[var(--foreground)]"
									>
										{item.forms?.[pos as keyof CharacterForms] ?? '—'}
									</div>
								{/each}
								<div class="flex w-16 flex-col items-center gap-0.5" dir="ltr">
									<span class="text-[14px] font-medium text-[var(--foreground)]">{item.meaning}</span>
								</div>
							</div>
							{#if item.description}
								<p class="px-1 text-[13px] leading-[1.5] text-[var(--muted-foreground)]" dir="ltr">
									{item.description}
								</p>
							{/if}
						</div>
					{/each}
				</div>
			{:else}
				<div class="flex flex-wrap gap-4">
					{#each row.content as item (item.character + item.order)}
						<div class="flex flex-col items-center gap-1.5">
							<div
								class="flex min-h-11 min-w-11 md:min-h-12 md:min-w-12 items-center justify-center rounded-[var(--radius-xs)] bg-[var(--tile)] px-2.5 py-2.5 text-[22px] md:text-[24px] font-medium text-[var(--foreground)]"
							>
								{#if item.character.length === 1 && lowercaseFriendly}
									<span class="pr-0.5 uppercase">{item.character}</span>
									<span class="lowercase">{item.character}</span>
								{:else}
									<span>{item.character}</span>
								{/if}
							</div>
							<span class="text-[12px] md:text-[13px] text-[var(--muted-foreground)] text-center">
								{item.meaning}
							</span>
							{#if item.description}
								<p class="max-w-[120px] text-center text-[11px] leading-[1.4] text-[var(--muted-foreground)]">
									{item.description}
								</p>
							{/if}
						</div>
					{/each}
				</div>
			{/if}
		</section>
	{/each}
</div>
