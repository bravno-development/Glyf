<script lang="ts">
	import { page } from "$app/state";
	import {
		LayoutDashboard,
		Languages,
		Settings,
		HelpCircle,
		LogOut,
	} from "lucide-svelte";
	import { userStore } from "$lib/stores/user";

	const learningLinks = [
		{ href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
		{ href: "/scripts", label: "Scripts", icon: Languages },
	];

	const accountLinks = [
		{ href: "/settings", label: "Settings", icon: Settings },
		{ href: "https://coda.io/d/Glyf_doNfF_A_A0f", label: "Help", icon: HelpCircle },
	];

	function isActive(href: string): boolean {
		return page.url.pathname === href;
	}

	async function handleLogout() {
		userStore.logout();
		window.location.href = "/auth/login";
	}
</script>

<aside
	class="hidden md:flex w-[256px] shrink-0 flex-col rounded-r-[var(--radius-m)] border-r border-[var(--sidebar-border)] bg-[var(--sidebar)] shadow-[var(--shadow-sidebar)] min-h-screen"
>
	<div class="flex items-center justify-between px-6 py-6">
		<a
			href="/"
			class="text-[22px] font-bold text-[var(--foreground)] no-underline"
		>
			glyf
		</a>
	</div>

	<nav class="flex flex-1 flex-col gap-6 px-4 pt-2">
		<div>
			<p
				class="mb-2 p-2 text-[14px] font-semibold tracking-[1.5px] uppercase text-[var(--sidebar-foreground)]"
			>
				Learning
			</p>
			<ul class="flex flex-col gap-0.5">
				{#each learningLinks as link (link.label)}
					<li>
						<a
							href={link.href}
							class="flex items-center gap-3 rounded-[var(--radius-m)] py-3 pl-6 pr-4 text-[14px] font-medium no-underline transition-colors
								{isActive(link.href)
								? 'bg-[var(--sidebar-accent)] text-[var(--sidebar-accent-foreground)]'
								: 'text-[var(--sidebar-foreground)] hover:bg-[var(--sidebar-accent)] hover:text-[var(--sidebar-accent-foreground)]'}"
						>
							<link.icon size={18} strokeWidth={1.5} />
							{link.label}
						</a>
					</li>
				{/each}
			</ul>
		</div>

		<div>
			<p
				class="mb-2 p-2 text-[14px] font-semibold tracking-[1.5px] uppercase text-[var(--sidebar-foreground)]"
			>
				Account
			</p>
			<ul class="flex flex-col gap-0.5">
				{#each accountLinks as link (link.label)}
					<li>
						<a
							href={link.href}
							class="flex items-center gap-3 rounded-[var(--radius-m)] py-3 pl-6 pr-4 text-[14px] font-medium no-underline transition-colors
								{isActive(link.href)
								? 'bg-[var(--sidebar-accent)] text-[var(--sidebar-accent-foreground)]'
								: 'text-[var(--sidebar-foreground)] hover:bg-[var(--sidebar-accent)] hover:text-[var(--sidebar-accent-foreground)]'}"
						>
							<link.icon size={18} strokeWidth={1.5} />
							{link.label}
						</a>
					</li>
				{/each}
				<li>
					<button
						on:click={handleLogout}
						class="w-full flex items-center gap-3 rounded-[var(--radius-m)] py-3 pl-6 pr-4 text-[14px] font-medium transition-colors border-0 bg-transparent cursor-pointer text-[var(--sidebar-foreground)] hover:bg-[var(--sidebar-accent)] hover:text-[var(--sidebar-accent-foreground)]"
					>
						<LogOut size={18} strokeWidth={1.5} />
						Logout
					</button>
				</li>
			</ul>
		</div>
	</nav>
</aside>
