<script lang="ts">
	import { page } from "$app/stores";
</script>

<div class="flex min-h-screen flex-col items-center justify-center px-6">
	<div class="flex max-w-md flex-col items-center text-center">
		<span class="text-[64px] font-bold leading-none text-[var(--foreground)]">
			{$page.status}
		</span>
		<h1 class="mt-4 text-[24px] font-bold text-[var(--foreground)]">
			{$page.error?.message ?? "Something went wrong"}
		</h1>
		<p class="mt-3 text-[15px] leading-relaxed text-[var(--text-tertiary)]">
			{#if $page.status === 404}
				The page you're looking for doesn't exist or has been moved.
			{:else}
				An unexpected error occurred. Please try again.
			{/if}
		</p>
		<a
			href="/"
			class="mt-8 rounded-[var(--radius-pill)] bg-[var(--accent-green)] px-6 py-3 text-[15px] font-semibold text-white no-underline transition-opacity hover:opacity-90"
		>
			Go home
		</a>
	</div>
</div>
