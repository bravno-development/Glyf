<script lang="ts">
	import { page } from "$app/state";
	import { LayoutDashboard, PenTool, Languages, Settings } from "lucide-svelte";

	const navLinks = [
		{ href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
		{ href: "/learn", label: "Practice", icon: PenTool },
		{ href: "/scripts", label: "Scripts", icon: Languages },
		{ href: "/settings", label: "Settings", icon: Settings },
	];

	function isActive(href: string): boolean {
		const path = page.url.pathname;
		if (href === "/dashboard") return path === "/dashboard";
		if (href === "/learn") return path === "/learn" || path.startsWith("/learn/");
		if (href === "/scripts") return path === "/scripts" || path.startsWith("/scripts/");
		if (href === "/settings") return path === "/settings";
		return path === href;
	}
</script>

<nav
	class="fixed bottom-0 left-0 right-0 z-50 flex h-[84px] items-center justify-around border-t border-[var(--sidebar-border)] bg-[var(--card)] shadow-[0_-1px_8px_-2px_rgba(16,24,40,0.08)] pb-[env(safe-area-inset-bottom)] md:hidden"
	role="navigation"
	aria-label="Main navigation"
>
	{#each navLinks as link (link.href)}
		<a
			href={link.href}
			class="flex flex-col items-center justify-center gap-1 rounded-[var(--radius-m)] px-4 py-2 text-[12px] font-medium no-underline transition-colors min-w-0 flex-1
				{isActive(link.href)
				? 'text-[var(--sidebar-accent-foreground)] bg-[var(--sidebar-accent)]'
				: 'text-[var(--sidebar-foreground)] hover:bg-[var(--sidebar-accent)] hover:text-[var(--sidebar-accent-foreground)]'}"
		>
			<link.icon size={22} strokeWidth={1.5} class="shrink-0" />
			<span class="truncate">{link.label}</span>
		</a>
	{/each}
</nav>
