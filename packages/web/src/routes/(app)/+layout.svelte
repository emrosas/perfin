<script lang="ts">
	import { useQuery } from 'convex-svelte';
	import { api } from '@perfin/backend/convex/_generated/api';
	import { page } from '$app/state';
	import { setUserAccounts } from '../../context';

	import AccountIcon from '$components/icons/account.svelte';
	import OverviewIcon from '$components/icons/overview.svelte';
	import type { LayoutProps } from './$types';

	const { data, children }: LayoutProps = $props();

	const currentUserAccounts = useQuery(api.accounts.getCurrentUserAccounts);
	setUserAccounts(currentUserAccounts);
</script>

<main class="grow overflow-scroll">
	<div class="bg-card p-4">
		<div class="flex gap-4">
			<h1>
				<strong class="font-semibold">Hello {data.currentUser.name}!</strong> Welcome to your personal
				finance dashboard.
			</h1>
			{#if page.url.pathname === '/overview'}
				<a href="/accounts" class="size-8 rounded-sm bg-accent p-1">
					<AccountIcon class="text-dark size-full" />
				</a>
			{:else}
				<a href="/overview" class="size-8 rounded-sm bg-accent p-1">
					<OverviewIcon class="text-dark size-full" />
				</a>
			{/if}
		</div>
	</div>
	{@render children()}
</main>
