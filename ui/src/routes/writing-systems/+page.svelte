<script lang="ts">
	import { ArrowRight } from 'lucide-svelte';

	export let data: { writingSystems: import('$lib/data/writing-systems').WritingSystem[] };
	const baseUrl = 'https://glyf.bravno.com';
	const listUrl = `${baseUrl}/writing-systems`;
	const listTitle = 'Writing systems — Glyf';
	const listDescription =
		'Explore writing systems from around the world. Learn about Hangul, Arabic, Greek, Devanagari and more. Master any script with spaced repetition.';

	const jsonLd = {
		'@context': 'https://schema.org',
		'@type': 'CollectionPage',
		name: listTitle,
		description: listDescription,
		url: listUrl,
		mainEntity: {
			'@type': 'ItemList',
			itemListElement: data.writingSystems.map((s, i) => ({
				'@type': 'ListItem',
				position: i + 1,
				url: `${baseUrl}/writing-systems/${s.slug}`,
				name: s.title
			}))
		}
	};
</script>

<svelte:head>
	<title>{listTitle}</title>
	<meta name="description" content={listDescription} />
	<link rel="canonical" href={listUrl} />
	<meta property="og:type" content="website" />
	<meta property="og:url" content={listUrl} />
	<meta property="og:title" content={listTitle} />
	<meta property="og:description" content={listDescription} />
	<meta property="og:image" content="{baseUrl}/og-image.png" />
	<meta property="twitter:card" content="summary_large_image" />
	<meta property="twitter:url" content={listUrl} />
	<meta property="twitter:title" content={listTitle} />
	<meta property="twitter:description" content={listDescription} />
	<meta property="twitter:image" content="{baseUrl}/og-image.png" />
	{@html `<script type="application/ld+json">${JSON.stringify(jsonLd)}<\/script>`}
</svelte:head>

<div class="flex min-h-screen flex-col bg-[var(--background)]">
	<header class="flex w-full items-center justify-between px-20 py-5 max-md:px-6">
		<a href="/" class="text-[28px] font-bold text-[var(--foreground)] no-underline">glyf</a>
	</header>

	<main class="mx-auto w-full max-w-4xl px-20 py-16 max-md:px-6">
		<h1 class="text-[40px] font-bold tracking-tight text-[var(--foreground)] max-md:text-[28px]">Writing systems</h1>
		<p class="mt-4 max-w-[560px] text-[18px] leading-[1.5] text-[var(--text-tertiary)]">
			Explore alphabets and scripts from around the world. Each guide introduces a writing system and how you can learn it with Glyf.
		</p>

		<ul class="mt-12 flex flex-col gap-6" role="list">
			{#each data.writingSystems as script (script.slug)}
				<li>
					<article class="rounded-[var(--radius-l)] border border-[var(--border)] bg-[var(--card)] p-6 shadow-[var(--shadow-card)] transition-colors hover:border-[var(--ring)]">
						<h2 class="text-[22px] font-bold text-[var(--foreground)]">
							<a href="/writing-systems/{script.slug}" class="no-underline transition-colors hover:text-[var(--accent-green)]">
								{script.title}
							</a>
						</h2>
						<p class="mt-2 text-[15px] leading-[1.5] text-[var(--text-tertiary)]">
							{script.description}
						</p>
						<a
							href="/writing-systems/{script.slug}"
							class="mt-4 inline-flex items-center gap-2 text-[15px] font-medium text-[var(--accent-green)] no-underline transition-opacity hover:opacity-80"
						>
							Learn about {script.title}
							<ArrowRight size={16} />
						</a>
					</article>
				</li>
			{/each}
		</ul>
	</main>

	<footer class="mt-auto w-full bg-[var(--tile)] px-20 py-8 max-md:px-6">
		<div class="mx-auto flex max-w-4xl flex-col items-center gap-2 md:flex-row md:justify-between">
			<span class="text-[13px] text-[var(--text-tertiary)]">&copy; {new Date().getFullYear()} glyf. All rights reserved.</span>
			<div class="flex items-center gap-6">
				<a href="/legal/privacy" class="text-[13px] text-[var(--text-tertiary)] no-underline transition-colors hover:text-[var(--foreground)]">Privacy</a>
				<a href="/legal/terms" class="text-[13px] text-[var(--text-tertiary)] no-underline transition-colors hover:text-[var(--foreground)]">Terms</a>
				<a href="/legal/cookies" class="text-[13px] text-[var(--text-tertiary)] no-underline transition-colors hover:text-[var(--foreground)]">Cookies</a>
			</div>
		</div>
	</footer>
</div>
