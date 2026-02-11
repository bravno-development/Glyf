<script lang="ts">
	import { goto } from "$app/navigation";
</script>

<div class="max-w-[800px] mx-auto p-8">
	<h1 class="text-2xl font-medium text-[var(--foreground)] mb-6">
		Choose a Script
	</h1>

	<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
		<button
			onclick={() => goto("/learn/japanese")}
			class="rounded-[var(--radius-l)] border border-[var(--border)] bg-[var(--card)] p-8 text-left shadow-[var(--shadow-card)]"
		>
			<p class="text-3xl mb-2">&#26085;&#26412;&#35486;</p>
			<p class="text-lg font-medium text-[var(--card-foreground)]">
				Japanese
			</p>
			<p class="text-sm text-[var(--muted-foreground)]">
				Kanji, Hiragana, Katakana
			</p>
		</button>

		<button
			onclick={() => goto("/learn/chinese")}
			class="rounded-[var(--radius-l)] border border-[var(--border)] bg-[var(--card)] p-8 text-left shadow-[var(--shadow-card)] opacity-50"
			disabled
		>
			<p class="text-3xl mb-2">&#20013;&#25991;</p>
			<p class="text-lg font-medium text-[var(--card-foreground)]">
				Chinese
			</p>
			<p class="text-sm text-[var(--muted-foreground)]">Coming soon</p>
		</button>
	</div>
</div>
