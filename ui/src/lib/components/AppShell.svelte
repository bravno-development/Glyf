<script lang="ts">
	import Sidebar from "$lib/components/Sidebar.svelte";
	import BottomNav from "$lib/components/BottomNav.svelte";

	let { children } = $props();
</script>

<div class="flex min-h-screen">
	<!-- Desktop: Sidebar on left -->
	<Sidebar />

	<!-- Main content: full width on mobile with bottom padding for tab bar, flex-1 on desktop -->
	<div
		class="flex flex-1 flex-col overflow-y-auto pb-[calc(84px+env(safe-area-inset-bottom))] md:pb-0"
	>
		{@render children()}
	</div>

	<!-- Mobile: Bottom nav (visible below md) -->
	<BottomNav />
</div>
