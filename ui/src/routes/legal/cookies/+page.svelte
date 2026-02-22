<div class="flex min-h-screen flex-col bg-[var(--background)]">
	<header class="flex w-full items-center justify-between px-20 py-5 max-md:px-6">
		<a href="/" class="text-[28px] font-bold text-[var(--foreground)] no-underline">glyf</a>
	</header>

	<main class="mx-auto w-4/5 self-center py-16 max-md:w-full max-md:px-6">
		<h1 class="text-[40px] font-bold tracking-tight text-[var(--foreground)] max-md:text-[28px]">Cookie Policy</h1>
		<p class="mt-2 text-[14px] text-[var(--text-tertiary)]">Last updated: 21 February 2026</p>

		<p class="mt-8 mb-4 text-[15px] leading-[1.6] text-[var(--text-tertiary)]">
			This page explains what data Glyf stores in your browser, why, and how you can control it. We keep this as simple as possible: there are only two categories — essential local storage that the app cannot function without, and optional analytics that you can turn on or off at any time.
		</p>

		<h2 class="mt-10 mb-3 text-[20px] font-bold text-[var(--foreground)]">1. Essential local storage (always on)</h2>
		<p class="mb-4 text-[15px] leading-[1.6] text-[var(--text-tertiary)]">
			Glyf uses your browser's <code class="rounded bg-[var(--tile)] px-1.5 py-0.5 text-[14px] text-[var(--foreground)]">localStorage</code> to store data that is necessary for the app to work:
		</p>
		<ul class="mb-4 flex flex-col gap-2 pl-6 text-[15px] leading-[1.6] text-[var(--text-tertiary)] list-disc">
			<li><strong class="text-[var(--foreground)]">Offline support</strong> — your lesson data and progress are stored locally so the app works without a network connection.</li>
			<li><strong class="text-[var(--foreground)]">Progress synchronisation</strong> — local storage acts as a write-ahead buffer, ensuring your progress is never lost if a sync is interrupted.</li>
			<li><strong class="text-[var(--foreground)]">Preferences</strong> — settings such as your chosen theme or notification preferences are stored locally so they persist between sessions.</li>
		</ul>
		<p class="mb-4 text-[15px] leading-[1.6] text-[var(--text-tertiary)]">
			This storage is strictly necessary for the Service to function. Under GDPR, strictly necessary storage does not require your consent, so there is no opt-out for this category. If you clear your browser's site data, these values will be removed — the app will still work but your local preferences and any unsynced progress will be lost.
		</p>

		<h2 class="mt-10 mb-3 text-[20px] font-bold text-[var(--foreground)]">2. Analytics — PostHog (optional, opt-in)</h2>
		<p class="mb-4 text-[15px] leading-[1.6] text-[var(--text-tertiary)]">
			With your consent, we use <strong class="text-[var(--foreground)]">PostHog</strong> to collect anonymised usage analytics. PostHog helps us understand how people use Glyf so we can improve the product. Examples of what is tracked: which features you use, how long sessions last, and which pages you visit.
		</p>
		<p class="mb-4 text-[15px] leading-[1.6] text-[var(--text-tertiary)]">
			PostHog is configured to use its <strong class="text-[var(--foreground)]">EU-region servers</strong>, so your analytics data is stored and processed entirely within Europe and never transferred outside the EEA.
		</p>
		<p class="mb-4 text-[15px] leading-[1.6] text-[var(--text-tertiary)]">
			Analytics data is:
		</p>
		<ul class="mb-4 flex flex-col gap-2 pl-6 text-[15px] leading-[1.6] text-[var(--text-tertiary)] list-disc">
			<li>anonymised — not linked to your name or email address</li>
			<li>never used for advertising</li>
			<li>never sold or shared with third parties for their own purposes</li>
			<li>used solely to improve Glyf</li>
		</ul>

		<h2 class="mt-10 mb-3 text-[20px] font-bold text-[var(--foreground)]">3. No advertising or third-party tracking</h2>
		<p class="mb-4 text-[15px] leading-[1.6] text-[var(--text-tertiary)]">
			Glyf does not use advertising cookies, social-media tracking pixels, or any other third-party tracking technologies beyond the analytics described above. We do not display ads.
		</p>

		<h2 class="mt-10 mb-3 text-[20px] font-bold text-[var(--foreground)]">4. How to manage your preferences</h2>
		<p class="mb-4 text-[15px] leading-[1.6] text-[var(--text-tertiary)]">
			You can change your analytics consent at any time:
		</p>
		<ul class="mb-4 flex flex-col gap-2 pl-6 text-[15px] leading-[1.6] text-[var(--text-tertiary)] list-disc">
			<li><strong class="text-[var(--foreground)]">Cookie banner</strong> — the banner shown on your first visit lets you opt in or out. If you dismissed it, it will reappear if you clear your site data.</li>
			<li><strong class="text-[var(--foreground)]">Clear site storage</strong> — clearing your browser's storage for glyf.app removes all locally stored data including your analytics consent, effectively opting you out.</li>
		</ul>
		<p class="mb-4 text-[15px] leading-[1.6] text-[var(--text-tertiary)]">
			For more detail on how we handle your personal data, see our <a href="/privacy" class="text-[var(--foreground)] underline">Privacy Policy</a>.
		</p>
	</main>

	<footer class="mt-auto w-full bg-[var(--tile)] px-20 py-8 max-md:px-6">
		<div class="mx-auto w-4/5 flex flex-col items-center gap-2 md:flex-row md:justify-between max-md:w-full">
			<span class="text-[13px] text-[var(--text-tertiary)]">&copy; 2026 Bravno AB</span>
			<div class="flex items-center gap-6">
				<a href="/legal/privacy" class="text-[13px] text-[var(--text-tertiary)] no-underline transition-colors hover:text-[var(--foreground)]">Privacy</a>
				<a href="/legal/terms" class="text-[13px] text-[var(--text-tertiary)] no-underline transition-colors hover:text-[var(--foreground)]">Terms</a>
				<a href="/legal/cookies" class="text-[13px] text-[var(--text-tertiary)] no-underline transition-colors hover:text-[var(--foreground)]">Cookies</a>
			</div>
		</div>
	</footer>
</div>
