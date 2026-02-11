<script lang="ts">
	import { page } from "$app/state";
	import {
		LayoutDashboard,
		PenTool,
		Languages,
		BarChart3,
		Settings,
	} from "lucide-svelte";

	const learningLinks = [
		{ href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
		{ href: "/learn", label: "Practice", icon: PenTool },
		{ href: "/learn", label: "Scripts", icon: Languages },
		{ href: "/dashboard", label: "Statistics", icon: BarChart3 },
	];

	const accountLinks = [
		{ href: "/settings", label: "Settings", icon: Settings },
	];

	function isActive(href: string): boolean {
		return page.url.pathname === href;
	}
</script>

<aside
	class="flex w-[240px] shrink-0 flex-col border-r border-[var(--sidebar-border)] bg-[var(--sidebar)] min-h-screen"
	style="box-shadow: var(--shadow-sidebar);"
>
	<div class="px-6 py-6">
		<a
			href="/"
			class="text-[22px] font-bold text-[var(--foreground)] no-underline"
		>
			glyf
		</a>
	</div>

	<nav class="flex flex-1 flex-col gap-6 px-3 pt-2">
		<div>
			<p
				class="mb-2 px-3 text-[11px] font-semibold tracking-[1.5px] uppercase text-[var(--sidebar-foreground)]"
			>
				Learning
			</p>
			<ul class="flex flex-col gap-0.5">
				{#each learningLinks as link (link.label)}
					<li>
						<a
							href={link.href}
							class="flex items-center gap-3 rounded-lg px-3 py-2 text-[14px] font-medium no-underline transition-colors
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
				class="mb-2 px-3 text-[11px] font-semibold tracking-[1.5px] uppercase text-[var(--sidebar-foreground)]"
			>
				Account
			</p>
			<ul class="flex flex-col gap-0.5">
				{#each accountLinks as link (link.label)}
					<li>
						<a
							href={link.href}
							class="flex items-center gap-3 rounded-lg px-3 py-2 text-[14px] font-medium no-underline transition-colors
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
