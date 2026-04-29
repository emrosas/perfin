<script lang="ts">
	import { useQuery } from 'convex-svelte';
	import { api } from '@perfin/backend/convex/_generated/api';
	import { setUserAccounts } from '../../context';
	import Sidebar from '$components/sidebar/sidebar.svelte';
	import BottomNav from '$components/bottomNav.svelte';
	import type { LayoutProps } from './$types';

	const { children }: LayoutProps = $props();

	const currentUserAccounts = useQuery(api.accounts.getCurrentUserAccounts);
	setUserAccounts(currentUserAccounts);
</script>

<div class="flex h-screen w-full overflow-hidden bg-background">
	<div class="hidden md:contents">
		<Sidebar />
	</div>
	<main class="flex-1 overflow-y-auto pb-24 md:pb-0">
		{@render children()}
	</main>
	<div class="md:hidden">
		<BottomNav />
	</div>
</div>
