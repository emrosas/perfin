<script lang="ts">
	import { useQuery } from 'convex-svelte';
	import { api } from '@perfin/backend/convex/_generated/api';

	const getMonthlyBalance = useQuery(api.transactions.getMonthlyBalance, {
		monthStart: new Date('2025-12-01').toISOString().split('T')[0],
		monthEnd: new Date('2025-12-31').toISOString().split('T')[0]
	});
</script>

{#if getMonthlyBalance.isLoading}
	<p>Getting Balance...</p>
{:else if getMonthlyBalance.error}
	<p>Error: {getMonthlyBalance.error.toString()}</p>
{:else}
	<div class="flex flex-col border-y border-slate-400 py-4">
		<h2 class="text-4xl font-semibold">{getMonthlyBalance.data}</h2>
		<span class="text-xs">Monthly Balance</span>
	</div>
{/if}
