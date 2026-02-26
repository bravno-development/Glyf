<script lang="ts">
	import { userStore } from "$lib/stores/user";
	import { ArrowRight, CalendarCheck, Brain, BarChart3, WifiOff } from "lucide-svelte";
	import Marquee from "svelte-fast-marquee";

	let isLoggedIn = $derived($userStore.isAuthenticated);
	let dashboardHref = "/dashboard";

	const scripts = [
		{
			title: "Hangul",
		},
		{
			title: "Arabic",
		},
		{
			title: "Thai",
		},
		{
			title: "Devanagari",
		},
		{
			title: "Bengali",
		},
		{
			title: "Tamil",
		},
		{
			title: "Telugu",
		},
		{
			title: "Gujarati",
		},
		{
			title: "Gurmukhi",
		},
		{
			title: "Kannada",
		},
		{
			title: "Malayalam",
		},
		{
			title: "Burmese",
		},
		{
			title: "Khmer",
		},
		{
			title: "Hebrew",
		},
		{
			title: "Greek",
		},
		{
			title: "Cyrillic",
		},
		{
			title: "Armenian",
		},
		{
			title: "Mkhedruli",
		},
		{
			title: "Geʽez",
		},
		{
			title: "Cherokee",
		},
	];

	const steps = [
		{
			number: "1",
			title: "Pick a script",
			description:
				"Choose from Japanese, Korean or one of our growing list of writing systems.",
		},
		{
			number: "2",
			title: "Learn new glyphs",
			description:
				"Each character is introduced with its reading, meaning & example words. Practise recognition through quizzes until it clicks.",
		},
		{
			number: "3",
			title: "Review & retain",
			description:
				"Spaced repetition surfaces characters right before you forget — building lasting fluency.",
		},
	];

	const features = [
		{
			icon: CalendarCheck,
			title: "Daily practice",
			description:
				"Build a consistent habit with bite-sized daily sessions tailored to your pace & goals.",
			iconBg: "bg-[var(--accent-light-green)]",
			iconColour: "text-[var(--accent-green)]",
		},
		{
			icon: Brain,
			title: "Spaced repetition",
			description:
				"Our SRS algorithm adapts to your memory, scheduling reviews at the optimal moment.",
			iconBg: "bg-[#F5E0D5]",
			iconColour: "text-[var(--accent-warm)]",
		},
		{
			icon: BarChart3,
			title: "Progress tracking",
			description:
				"See exactly how many characters you've mastered, your streaks & accuracy over time.",
			iconBg: "bg-[#E8E0F0]",
			iconColour: "text-[#7B6B9E]",
		},
		{
			icon: WifiOff,
			title: "Offline-first",
			description:
				"Works without internet. Your progress lives on your device & syncs when you reconnect.",
			iconBg: "bg-[var(--accent-light-green)]",
			iconColour: "text-[var(--accent-green)]",
		},
	];

	const footerLinks = {
		Product: [
			{ label: "Scripts", link: "#scripts" },
			{ label: "Features", link: "#features" },
			{ label: "Pricing", link: "/pricing" },
			{ label: "Changelog", link: "/changelog" },
		],
		Resources: [
			{ label: "Writing systems", link: "/writing-systems" },
			{ label: "Documentation", link: "https://coda.io/d/Glyf_doNfF_A_A0f" },
			{ label: "Support", link: "/legal/privacy" },
		],
		Legal: [
			{ label: "Privacy", link: "/legal/privacy" },
			{ label: "Terms", link: "/legal/terms" },
			{ label: "Cookies", link: "/legal/cookies" },
		],
	};

</script>

<div class="flex min-h-screen flex-col">
		<!-- Header / Nav -->
		<header class="flex w-full items-center justify-between px-20 py-5 max-md:px-6">
			<div class="flex items-center gap-10">
				<a href="/" class="text-[28px] font-bold text-[var(--foreground)] no-underline">glyf</a>
				<nav class="hidden items-center gap-8 md:flex">
					<a href="#scripts" class="text-[15px] font-medium text-[var(--text-tertiary)] no-underline transition-colors hover:text-[var(--foreground)]">Scripts</a>
					<a href="#how" class="text-[15px] font-medium text-[var(--text-tertiary)] no-underline transition-colors hover:text-[var(--foreground)]">How it works</a>
					<a href="#features" class="text-[15px] font-medium text-[var(--text-tertiary)] no-underline transition-colors hover:text-[var(--foreground)]">Features</a>
					<a href="/pricing" class="text-[15px] font-medium text-[var(--text-tertiary)] no-underline transition-colors hover:text-[var(--foreground)]">Pricing</a>
				</nav>
			</div>
			<div class="flex items-center gap-5">
				{#if isLoggedIn}
					<a href={dashboardHref} class="rounded-[var(--radius-pill)] bg-[var(--accent-green)] px-5 py-2.5 text-[15px] font-semibold text-white no-underline transition-opacity hover:opacity-90">Dashboard</a>
				{:else}
					<a href="/auth/login" class="text-[15px] font-medium text-[var(--foreground)] no-underline transition-opacity hover:opacity-80">Log in</a>
					<a href="/auth/login" class="rounded-[var(--radius-pill)] bg-[var(--accent-green)] px-5 py-2.5 text-[15px] font-semibold text-white no-underline transition-opacity hover:opacity-90">Start learning</a>
				{/if}
			</div>
		</header>

		<!-- Hero -->
		<section class="mx-auto flex w-full max-w-7xl flex-col items-center gap-16 px-20 pt-16 pb-24 md:flex-row md:items-start max-md:px-6">
			<div class="flex flex-1 flex-col items-start">
				<div class="flex items-center gap-2 rounded-[var(--radius-pill)] bg-[var(--accent-light-green)] px-4 py-1.5">
					<span class="h-2 w-2 rounded-full bg-[var(--accent-green)]"></span>
					<span class="text-[13px] font-medium text-[var(--accent-green)]">Free to start — no credit card needed</span>
				</div>
				<h1 class="mt-6 text-[64px] leading-[1.05] font-bold tracking-tight text-[var(--foreground)] max-md:text-[40px]">
					Learn to read<br />& write any script
				</h1>
				<p class="mt-6 max-w-[520px] text-[20px] leading-[1.5] text-[var(--text-tertiary)] max-md:text-[17px]">
					Master writing systems from around the world with guided phases, spaced repetition & a practice routine that fits your life.
				</p>
				<div class="mt-8 flex items-center gap-4">
					{#if isLoggedIn}
						<a href={dashboardHref} class="flex items-center gap-2 rounded-[var(--radius-pill)] bg-[var(--accent-green)] px-6 py-3.5 text-[17px] font-semibold text-white no-underline transition-opacity hover:opacity-90">
							Go to dashboard
							<ArrowRight size={18} />
						</a>
					{:else}
						<a href="/auth/login" class="flex items-center gap-2 rounded-[var(--radius-pill)] bg-[var(--accent-green)] px-6 py-3.5 text-[17px] font-semibold text-white no-underline transition-opacity hover:opacity-90">
							Start learning free
							<ArrowRight size={18} />
						</a>
					{/if}
					<a href="#how" class="rounded-[var(--radius-pill)] border border-[#E5E4E1] px-6 py-3.5 text-[17px] font-medium text-[var(--foreground)] no-underline transition-colors hover:bg-[var(--tile)]">
						See how it works
					</a>
				</div>
			</div>
			<div class="hidden w-[480px] shrink-0 md:block">
				<img src="/hero-right.png" alt="Script characters from Japanese, Korean, Arabic, Devanagari & Khmer" width="480" height="480" class="rounded-[40px]" />
			</div>
		</section>

		<!-- Scripts Section -->
		<section id="scripts" class="mx-auto w-full max-w-7xl px-20 py-24 max-md:px-6">
			<div class="flex flex-col items-center text-center">
				<span class="text-[13px] font-semibold tracking-[2px] text-[var(--accent-green)] uppercase">Growing library</span>
				<h2 class="mt-4 text-[40px] font-bold tracking-tight text-[var(--foreground)] max-md:text-[28px]">One platform, every script</h2>
				<p class="mt-4 max-w-[560px] text-[18px] leading-[1.5] text-[var(--text-tertiary)]">
					We started with Greek & Korean, and we're adding new writing systems regularly. Your next script is just around the corner.
				</p>
				<a href="/writing-systems" class="mt-4 text-[15px] font-medium text-[var(--foreground)] no-underline transition-colors hover:text-[var(--accent-green)]">See what we have as of now</a>
			</div>
			<div class="mt-14 flex flex-col gap-6 overflow-hidden">
				<Marquee speed={50} direction="left" gap="24px">
					{#each scripts as script (script.title)}
						<span class="whitespace-nowrap text-[18px] font-semibold text-[var(--foreground)]">{script.title}</span>
					{/each}
				</Marquee>
			</div>
		</section>

		<!-- How It Works -->
		<section id="how" class="w-full bg-[var(--tile)] py-24">
			<div class="mx-auto max-w-7xl px-20 max-md:px-6">
				<div class="flex flex-col items-center text-center">
					<span class="text-[13px] font-semibold tracking-[2px] text-[var(--accent-green)] uppercase">How it works</span>
					<h2 class="mt-4 text-[40px] font-bold tracking-tight text-[var(--foreground)] max-md:text-[28px]">From zero to fluent in three steps</h2>
				</div>
				<div class="mt-14 grid grid-cols-1 gap-8 md:grid-cols-3">
					{#each steps as step (step.number)}
						<div class="flex flex-col items-center text-center">
							<div class="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--accent-green)]">
								<span class="text-[22px] font-bold text-white">{step.number}</span>
							</div>
							<h3 class="mt-5 text-[22px] font-bold text-[var(--foreground)]">{step.title}</h3>
							<p class="mt-2 max-w-[320px] text-[15px] leading-[1.5] text-[var(--text-tertiary)]">{step.description}</p>
						</div>
					{/each}
				</div>
			</div>
		</section>

		<!-- Features -->
		<section id="features" class="mx-auto w-full max-w-7xl px-20 py-24 max-md:px-6">
			<div class="flex flex-col items-center text-center">
				<span class="text-[13px] font-semibold tracking-[2px] text-[var(--accent-green)] uppercase">Features</span>
				<h2 class="mt-4 max-w-[700px] text-[40px] font-bold tracking-tight text-[var(--foreground)] max-md:text-[28px]">Everything you need to master a writing system</h2>
			</div>
			<div class="mt-14 grid grid-cols-1 gap-6 md:grid-cols-2">
				{#each features as feature (feature.title)}
					<div class="rounded-[20px] border border-[#E5E4E1] bg-[var(--card)] p-7 shadow-[var(--shadow-card)]">
						<div class="flex h-12 w-12 items-center justify-center rounded-xl {feature.iconBg}">
							<feature.icon size={22} strokeWidth={2} class={feature.iconColour} />
						</div>
						<h3 class="mt-4 text-[18px] font-bold text-[var(--foreground)]">{feature.title}</h3>
						<p class="mt-2 text-[14px] leading-[1.5] text-[var(--text-tertiary)]">{feature.description}</p>
					</div>
				{/each}
			</div>
		</section>

		<!-- Final CTA -->
		<section class="w-full bg-[var(--accent-green)] px-20 py-[100px] max-md:px-6 max-md:py-16">
			<div class="mx-auto flex max-w-7xl flex-col items-center text-center">
				<h2 class="max-w-[700px] text-[44px] font-bold leading-tight text-white max-md:text-[32px]">Start reading a new script today</h2>
				<p class="mt-5 max-w-[500px] text-[18px] leading-[1.5] text-white/80">
					Free to use. No account required to begin. Jump in and start learning your first characters in minutes.
				</p>
				<a href={isLoggedIn ? dashboardHref : "/auth/login"} class="mt-8 flex items-center gap-2 rounded-[var(--radius-pill)] bg-white px-7 py-4 text-[17px] font-semibold text-[var(--accent-green)] no-underline transition-opacity hover:opacity-90">
					{isLoggedIn ? "Go to dashboard" : "Start learning free"}
					<ArrowRight size={18} />
				</a>
			</div>
		</section>

		<!-- Footer -->
		<footer class="w-full bg-[var(--tile)] px-20 py-16 max-md:px-6">
			<div class="mx-auto max-w-7xl">
				<div class="grid grid-cols-1 gap-12 md:grid-cols-4">
					<div>
						<span class="text-[22px] font-bold text-[var(--foreground)]">glyf</span>
						<p class="mt-3 text-[14px] leading-[1.5] text-[var(--text-tertiary)]">Learn to read & write any script, anywhere.</p>
					</div>
					{#each Object.entries(footerLinks) as [heading, links] (heading)}
						<div>
							<h4 class="text-[13px] font-semibold tracking-[1px] text-[var(--text-foreground)] uppercase">{heading}</h4>
							<ul class="mt-4 flex flex-col gap-3">
								{#each links as item (item.label)}
									<li><a target={item.label == 'Documentation' ? '_blank' : '_self'} href={item.link} class="text-[14px] text-[var(--text-tertiary)] no-underline transition-colors hover:text-[var(--foreground)]">{item.label}</a></li>
								{/each}
							</ul>
						</div>
					{/each}
				</div>
				<div class="mt-12 border-t border-white/10 pt-8 flex flex-col items-center gap-2 md:flex-row md:justify-between">
					<span class="text-[13px] text-[var(--text-foreground)]">&copy; {new Date().getFullYear()} glyf. All rights reserved.</span>
					<span class="text-[13px] text-[var(--text-foreground)]">Made with care for learners everywhere</span>
				</div>
			</div>
		</footer>
	</div>
