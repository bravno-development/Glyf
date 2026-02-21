<script lang="ts">
	import { page } from "$app/stores";
	import { goto } from "$app/navigation";
	import { ArrowLeft, Clock } from "lucide-svelte";
	import AppShell from "$lib/components/AppShell.svelte";
	import {
		getUpcomingReviews,
		type UpcomingReviewItem,
	} from "$lib/services/dashboard";

	const scriptId = $derived($page.params.scriptId);

	let reviews = $state<UpcomingReviewItem[]>([]);
	let loading = $state(true);

	$effect(() => {
		loading = true;
		getUpcomingReviews(scriptId!, Number.MAX_SAFE_INTEGER).then((r) => {
			if (r.length <= 0) goto("/dashboard");
			reviews = r;
			loading = false;
		});
	});

	function dueLabel(dueIn: string): string {
		if (dueIn === "Now") return "Due now";
		if (dueIn.endsWith("m")) return `In ${dueIn} minutes`;
		if (dueIn.endsWith("h")) return `In ${dueIn} hours`;
		return `In ${dueIn} days`;
	}

	const grouped = $derived.by(() => {
		const map = new Map<string, typeof reviews>();
		for (const r of reviews) {
			const bucket = r.dueIn;
			if (!map.has(bucket)) map.set(bucket, []);
			map.get(bucket)!.push(r);
		}
		return [...map.entries()];
	});
</script>

<AppShell>
	<main class="flex-1 overflow-y-auto bg-[var(--background)]">
		<div class="mx-auto max-w-2xl px-4 py-8 md:px-6 md:py-10">
			<!-- Header -->
			<div class="mb-8">
				<a
					href="/dashboard"
					class="mb-5 inline-flex items-center gap-1.5 text-[13px] font-medium text-[var(--muted-foreground)] no-underline transition-colors hover:text-[var(--foreground)]"
				>
					<ArrowLeft size={14} />
					Dashboard
				</a>

				<div class="flex items-baseline justify-between">
					<div>
						<h1
							class="text-[28px] font-semibold text-[var(--foreground)]"
						>
							Upcoming Reviews
						</h1>
						{#if !loading}
							<p
								class="text-[14px] text-[var(--muted-foreground)] mb-4 mt-4"
							>
								{reviews.length}
								{reviews.length === 1 ? "item" : "items"} scheduled
							</p>
						{/if}
					</div>
				</div>
			</div>

			<!-- Content -->
			{#if loading}
				<div class="flex flex-col gap-2">
					{#each { length: 6 } as _}
						<div
							class="h-16 animate-pulse rounded-[var(--radius-l)] bg-[var(--tile)]"
						></div>
					{/each}
				</div>
			{:else if reviews.length === 0}
				<div
					class="flex flex-col items-center justify-center rounded-[var(--radius-md)] bg-[var(--card)] px-6 py-16 shadow-[var(--shadow-card)]"
				>
					<Clock
						size={32}
						class="mb-3 text-[var(--muted-foreground)] opacity-40"
					/>
					<p class="text-[15px] font-medium text-[var(--foreground)]">
						All caught up
					</p>
					<p class="mt-1 text-[13px] text-[var(--muted-foreground)]">
						No upcoming reviews for this script
					</p>
				</div>
			{:else}
				<div class="flex flex-col gap-4">
					{#each grouped as [dueIn, items]}
						<div
							class="overflow-hidden rounded-[var(--radius-l)] bg-[var(--card)] shadow-[var(--shadow-card)]"
						>
							<!-- Group header -->
							<div
								class="flex items-center justify-between border-b border-[var(--border)] px-6 py-3"
							>
								<span
									class="text-[12px] font-semibold tracking-wide text-[var(--muted-foreground)]"
								>
									{dueLabel(dueIn)}
								</span>
								<span
									class="text-[12px] text-[var(--muted-foreground)]"
								>
									{items.length}
									{items.length === 1 ? "item" : "items"}
								</span>
							</div>

							<!-- Glyph grid -->
							<div class="flex flex-wrap gap-1.5 p-4">
								{#each items as review, i (review.character + i)}
									<div
										class="flex h-[52px] w-[52px] items-center justify-center rounded-lg bg-[var(--tile)] text-[18px] font-medium text-[var(--foreground)]"
										title={review.reading}
									>
										{review.character}
									</div>
								{/each}
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</div>
	</main>
</AppShell>
