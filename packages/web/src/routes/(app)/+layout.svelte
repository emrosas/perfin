<script lang="ts">
	import { useQuery } from 'convex-svelte';
	import { api } from '@perfin/backend/convex/_generated/api';
	import { setUserAccounts } from '../../context';
	import Sidebar from '$components/sidebar/sidebar.svelte';
	import type { LayoutProps } from './$types';

	const { children }: LayoutProps = $props();

	const currentUserAccounts = useQuery(api.accounts.getCurrentUserAccounts);
	setUserAccounts(currentUserAccounts);
</script>

<div class="flex h-screen w-full overflow-hidden bg-background">
	<Sidebar />
	<main class="flex-1 overflow-y-auto">
		{@render children()}
	</main>
</div>
