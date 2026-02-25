<script lang="ts">
	import { ArrowRight } from 'lucide-svelte';
	import type { WritingSystem } from '$lib/data/writing-systems';

	export let data: { script: WritingSystem };

	const script = data.script;
	const baseUrl = 'https://glyf.app';
	const pageUrl = `${baseUrl}/writing-systems/${script.slug}`;
	const pageTitle = `Learn the ${script.title} alphabet — Glyf`;
	const pageDescription = script.description;
	const heroImageUrl = `${baseUrl}${script.picture}`;

	// Grid placement for the 7 Perso-Arabic phases:
	// col 1: phase 1 only | col 2: phases 2-4 | col 3: phases 5-7
	const persoArabicGrid: Record<number, { col: number; row: number }> = {
		0: { col: 1, row: 1 },
		1: { col: 2, row: 1 },
		2: { col: 2, row: 2 },
		3: { col: 2, row: 3 },
		4: { col: 3, row: 1 },
		5: { col: 3, row: 2 },
		6: { col: 3, row: 3 },
	};

	const jsonLd = {
		'@context': 'https://schema.org',
		'@type': 'Article',
		name: pageTitle,
		description: pageDescription,
		url: pageUrl,
		image: heroImageUrl,
		publisher: { '@type': 'Organization', name: 'Glyf' }
	};
</script>

<svelte:head>
	<title>{pageTitle}</title>
	<meta name="description" content={pageDescription} />
	<link rel="canonical" href={pageUrl} />
	<meta property="og:type" content="article" />
	<meta property="og:url" content={pageUrl} />
	<meta property="og:title" content={pageTitle} />
	<meta property="og:description" content={pageDescription} />
	<meta property="og:image" content={heroImageUrl} />
	<meta property="twitter:card" content="summary_large_image" />
	<meta property="twitter:url" content={pageUrl} />
	<meta property="twitter:title" content={pageTitle} />
	<meta property="twitter:description" content={pageDescription} />
	<meta property="twitter:image" content={heroImageUrl} />
	{@html `<script type="application/ld+json">${JSON.stringify(jsonLd)}<\/script>`}
</svelte:head>

<div class="flex min-h-screen flex-col bg-[var(--background)]">
	<header class="flex w-full items-center justify-between px-20 py-5 max-md:px-6">
		<a href="/" class="text-[28px] font-bold text-[var(--foreground)] no-underline">glyf</a>
		<nav class="flex items-center gap-8">
			<a href="/writing-systems" class="text-[15px] font-medium text-[var(--text-tertiary)] no-underline transition-colors hover:text-[var(--foreground)]">Writing systems</a>
			<a href="/dashboard" class="rounded-[var(--radius-pill)] bg-[var(--accent-green)] px-5 py-2.5 text-[15px] font-semibold text-white no-underline transition-opacity hover:opacity-90">Start learning</a>
		</nav>
	</header>

	<main>
		<!-- Hero -->
		<section class="mx-auto flex w-full max-w-7xl flex-col items-start gap-16 px-20 pt-12 pb-24 md:flex-row max-md:px-6">
			<div class="flex flex-1 flex-col items-start">
				<!-- Breadcrumb -->
				<nav class="flex items-center gap-2 text-[13px]" aria-label="Breadcrumb">
					<a href="/writing-systems" class="text-[var(--accent-green)] no-underline transition-opacity hover:opacity-80">Writing systems</a>
					<span class="text-[var(--text-tertiary)]">/</span>
					<span class="text-[var(--text-tertiary)]">{script.title}</span>
				</nav>

				<h1 class="mt-4 text-[56px] leading-[1.05] font-bold tracking-tight text-[var(--foreground)] max-md:text-[36px]">
					{script.title}
				</h1>
				<p class="mt-4 max-w-[500px] text-[17px] leading-[1.6] text-[var(--text-tertiary)]">
					{script.longDescription}
				</p>

				<!-- Study plan -->
				<div class="mt-7 w-full max-w-[500px] rounded-[var(--radius-m)] border border-[var(--border)] bg-[var(--background)] p-5">
					<span class="text-[12px] font-medium tracking-[1px] uppercase text-[var(--text-tertiary)]">Study plan</span>
					<div class="mt-3 grid grid-cols-2 gap-4">
						<div class="flex flex-col gap-1">
							<span class="text-[13px] font-semibold text-[var(--foreground)]">Beginner pace</span>
							{#if script.studyPlan.recommended === 'beginner'}
								<span class="w-fit rounded-[var(--radius-pill)] bg-[var(--accent-light-green)] px-2.5 py-0.5 text-[11px] font-semibold text-[var(--accent-green)]">Recommended</span>
							{/if}
							<span class="text-[14px] text-[var(--text-tertiary)]">{script.studyPlan.beginner.perDay} letters / day</span>
							<span class="text-[13px] text-[var(--text-tertiary)]">Core letters in {script.studyPlan.beginner.coreIn}</span>
						</div>
						<div class="flex flex-col gap-1">
							<span class="text-[13px] font-semibold text-[var(--foreground)]">Intensive pace</span>
							<span class="text-[14px] text-[var(--text-tertiary)]">{script.studyPlan.intensive.perDay} letters / day</span>
							<span class="text-[13px] text-[var(--text-tertiary)]">Core letters in {script.studyPlan.intensive.coreIn}</span>
							{#if script.studyPlan.recommended === 'intensive'}
								<span class="w-fit rounded-[var(--radius-pill)] bg-[var(--accent-light-green)] px-2.5 py-0.5 text-[11px] font-semibold text-[var(--accent-green)]">Recommended</span>
							{/if}
						</div>
					</div>
				</div>

				<!-- Stats -->
				<div class="mt-6 flex items-center gap-8">
					{#each script.stats as stat, i (stat.label)}
						{#if i > 0}
							<span class="h-6 w-px bg-[var(--border)]"></span>
						{/if}
						<div class="flex items-baseline gap-1.5">
							<span class="text-[32px] font-bold leading-none text-[var(--foreground)]">{stat.value}</span>
							<span class="text-[14px] text-[var(--text-tertiary)]">{stat.label}</span>
						</div>
					{/each}
				</div>

				<!-- CTA -->
				<a href="/auth/login" class="mt-8 flex items-center gap-2 rounded-[var(--radius-pill)] bg-[var(--accent-green)] px-6 py-3.5 text-[16px] font-semibold text-white no-underline transition-opacity hover:opacity-90">
					Start learning {script.title} alphabet
					<ArrowRight size={16} />
				</a>
			</div>

			<!-- Hero image -->
			<div class="hidden w-[420px] shrink-0 md:block">
				<img
					src={script.picture}
					alt="{script.title} script characters"
					width="420"
					height="420"
					class="rounded-[40px]"
				/>
			</div>
		</section>

		<!-- Our Approach -->
		<section class="w-full bg-[var(--tile)] py-24">
			<div class="mx-auto max-w-7xl px-20 max-md:px-6">
				<div class="flex flex-col gap-14 md:flex-row md:gap-20">
					<!-- Left: approach copy -->
					<div class="flex flex-1 flex-col justify-start">
						<span class="text-[12px] font-semibold tracking-[2px] uppercase text-[var(--accent-green)]">Our approach</span>
						<h2 class="mt-3 text-[36px] font-bold leading-[1.15] tracking-tight text-[var(--foreground)] max-md:text-[26px]">
							{script.approach.title}
						</h2>
						<p class="mt-4 max-w-[420px] text-[16px] leading-[1.6] text-[var(--text-tertiary)]">
							{script.approach.description}
						</p>
					</div>

					<!-- Right: phases -->
					<div class="{script.slug === 'perso_arabic' ? 'flex-[2] flex flex-col lg:grid lg:grid-cols-3 lg:grid-rows-3' : 'flex flex-1 flex-col'} gap-4">
						{#each script.approach.phases as phase, i (phase.title)}
							<div
								style={script.slug === 'perso_arabic' && persoArabicGrid[i]
									? `grid-column-start:${persoArabicGrid[i].col};grid-row-start:${persoArabicGrid[i].row}`
									: ''}
								class="rounded-[var(--radius-m)] bg-[var(--card)] px-6 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
								<div class="flex flex-col items-start gap-4">
									<div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--accent-light-green)]">
										<span class="text-[15px] font-bold text-[var(--accent-green)]">{phase.icon}</span>
									</div>
									<div>
										<div class="mb-1 text-[12px] font-medium text-[var(--text-tertiary)]">Phase {i + 1}</div>
										<h3 class="text-[16px] font-semibold text-[var(--foreground)]">{phase.title}</h3>
										<p class="mt-1.5 text-[14px] leading-[1.55] text-[var(--text-tertiary)]">{phase.description}</p>
									</div>
								</div>
							</div>
						{/each}
					</div>
				</div>
			</div>
		</section>

		<!-- CTA Section -->
		<section class="w-full bg-[var(--accent-green)] px-20 py-[80px] max-md:px-6 max-md:py-16">
			<div class="mx-auto flex max-w-2xl flex-col items-center gap-6 text-center">
				<h2 class="text-[40px] font-bold leading-tight text-white max-md:text-[30px]">
					Build your {script.title} reading foundation.
				</h2>
				<p class="text-[17px] leading-[1.5] text-white/85">
					Free to start. Active recall &amp; spaced repetition from day one.
				</p>
				<a href="/auth/login" class="inline-flex items-center gap-2 rounded-[var(--radius-pill)] bg-white px-7 py-3.5 text-[16px] font-semibold text-[var(--accent-green)] no-underline transition-opacity hover:opacity-90">
					Start learning {script.title}
					<ArrowRight size={16} />
				</a>
			</div>
		</section>

		<!-- Contact -->
		<section class="w-full px-20 py-16 max-md:px-6">
			<div class="mx-auto flex max-w-xl flex-col items-center gap-4 text-center">
				<h2 class="text-[22px] font-bold text-[var(--foreground)]">Have thoughts or suggestions?</h2>
				<p class="text-[15px] leading-[1.6] text-[var(--muted-foreground)]">
					We'd love to hear from you — whether it's feedback on the curriculum, a script you'd like us to add, or anything else.
				</p>
				<a href="mailto:support@bravno.com" class="flex items-center gap-2 text-[14px] font-medium text-[var(--accent-green)] no-underline transition-opacity hover:opacity-80">
					support@bravno.com
				</a>
			</div>
		</section>

		<!-- Footer -->
		<footer class="w-full bg-[var(--tile)] px-20 py-16 max-md:px-6">
			<div class="mx-auto max-w-7xl">
				<div class="grid grid-cols-1 gap-12 md:grid-cols-4">
					<div>
						<span class="text-[22px] font-bold text-white">glyf</span>
						<p class="mt-3 text-[14px] leading-[1.5] text-white/60">Learn to read &amp; write any script, anywhere.</p>
					</div>
					<div>
						<h4 class="text-[12px] font-semibold tracking-[1px] uppercase text-white/40">Product</h4>
						<ul class="mt-4 flex flex-col gap-3">
							<li><a href="/#scripts" class="text-[14px] text-white/70 no-underline transition-colors hover:text-white">Scripts</a></li>
							<li><a href="/#features" class="text-[14px] text-white/70 no-underline transition-colors hover:text-white">Features</a></li>
							<li><a href="/pricing" class="text-[14px] text-white/70 no-underline transition-colors hover:text-white">Pricing</a></li>
							<li><a href="/changelog" class="text-[14px] text-white/70 no-underline transition-colors hover:text-white">Changelog</a></li>
						</ul>
					</div>
					<div>
						<h4 class="text-[12px] font-semibold tracking-[1px] uppercase text-white/40">Resources</h4>
						<ul class="mt-4 flex flex-col gap-3">
							<li><a href="/writing-systems" class="text-[14px] text-white/70 no-underline transition-colors hover:text-white">Writing systems</a></li>
							<li><a href="/documentation" class="text-[14px] text-white/70 no-underline transition-colors hover:text-white">Documentation</a></li>
							<li><a href="mailto:support@bravno.com" class="text-[14px] text-white/70 no-underline transition-colors hover:text-white">Support</a></li>
						</ul>
					</div>
					<div>
						<h4 class="text-[12px] font-semibold tracking-[1px] uppercase text-white/40">Legal</h4>
						<ul class="mt-4 flex flex-col gap-3">
							<li><a href="/legal/privacy" class="text-[14px] text-white/70 no-underline transition-colors hover:text-white">Privacy</a></li>
							<li><a href="/legal/terms" class="text-[14px] text-white/70 no-underline transition-colors hover:text-white">Terms</a></li>
							<li><a href="/legal/cookies" class="text-[14px] text-white/70 no-underline transition-colors hover:text-white">Cookies</a></li>
						</ul>
					</div>
				</div>
				<div class="mt-12 border-t border-white/10 pt-8 flex flex-col items-center gap-2 md:flex-row md:justify-between">
					<span class="text-[13px] text-white/40">&copy; {new Date().getFullYear()} glyf. All rights reserved.</span>
					<span class="text-[13px] text-white/40">Made with care for learners everywhere</span>
				</div>
			</div>
		</footer>
	</main>
</div>
