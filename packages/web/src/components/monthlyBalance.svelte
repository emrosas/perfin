<script lang="ts">
	import { useQuery } from 'convex-svelte';
	import { api } from '@perfin/backend/convex/_generated/api';

	const getMonthlyBalance = useQuery(api.transactions.getMonthlyBalance, {
		monthStart: new Date('2025-12-01').toISOString().split('T')[0],
		monthEnd: new Date('2025-12-31').toISOString().split('T')[0]
	});
</script>

<div class="flex flex-col gap-1 border-y border-light-alt px-4 py-8">
	{#if getMonthlyBalance.isLoading}
		<h2 class="skeleton bg-clip-text text-5xl font-semibold text-transparent">$0</h2>
		<span class="text-xs opacity-50">Loading Balance...</span>
	{:else if getMonthlyBalance.error}
		<p>Error: {getMonthlyBalance.error.toString()}</p>
	{:else}
		<h2 class="text-5xl font-semibold">
			{getMonthlyBalance?.data?.toLocaleString('en-US', {
				style: 'currency',
				currency: 'USD',
				maximumFractionDigits: 0
			})}
		</h2>
		<span class="text-xs">Current Balance</span>
	{/if}
</div>
