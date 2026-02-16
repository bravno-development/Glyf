<script lang="ts">
	import { page } from "$app/state";
	import {
		LayoutDashboard,
		PenTool,
		Languages,
		BarChart3,
		Settings,
		PanelLeft,
	} from "lucide-svelte";

	const learningLinks = [
		{ href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
		{ href: "/learn", label: "Practice", icon: PenTool },
		{ href: "/scripts", label: "Scripts", icon: Languages },
	];

	const accountLinks = [
		{ href: "/settings", label: "Settings", icon: Settings },
	];

	function isActive(href: string): boolean {
		return page.url.pathname === href;
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
		<button
			type="button"
			class="flex size-9 items-center justify-center rounded-[var(--radius-pill)] text-[var(--sidebar-foreground)] transition-colors hover:bg-[var(--sidebar-accent)] hover:text-[var(--sidebar-accent-foreground)]"
			aria-label="Toggle sidebar"
		>
			<PanelLeft size={20} strokeWidth={1.5} />
		</button>
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
			</ul>
		</div>
	</nav>
</aside>
