<script lang="ts">
	import { useQuery } from 'convex-svelte';
	import { api } from '@perfin/backend/convex/_generated/api';
	// import type { Id } from '@perfin/backend/convex/_generated/dataModel';

	// const client = useConvexClient();
	const monthlyTransactions = useQuery(api.transactions.listMonthlyTransactions, {
		monthStart: '2025-12-01',
		monthEnd: '2025-12-31'
	});

	const fmt = new Intl.DateTimeFormat('es-MX', {
		month: 'short',
		day: 'numeric',
		timeZone: 'UTC'
	});
</script>

<main>
	{#if monthlyTransactions.isLoading}
		<p>Getting Transactions...</p>
	{:else if monthlyTransactions.error}
		<p>Error: {monthlyTransactions.error.toString()}</p>
	{:else}
		<h3 class="mx-4 mt-4 text-lg font-medium">My Transactions</h3>
		<ul class="mt-2">
			{#each monthlyTransactions.data as transaction (transaction._id)}
				<li
					class="group relative grid grid-cols-[auto_1fr_auto] items-center gap-4 border-light-alt px-4 py-4 not-last:border-b"
				>
					<div class="flex size-12 flex-col items-center justify-center rounded-sm bg-dark"></div>
					<div class="flex flex-col justify-center">
						<h4 class="font-medium capitalize">{transaction.description}</h4>
						<div>
							<span class="text-xs text-dark-alt capitalize">
								{fmt.format(new Date(transaction.date))}
							</span>
							<span class="font-light text-light-alt">|</span>
							<span class="text-xs text-green-800 capitalize">cash</span>
						</div>
					</div>
					<span
						class={`text-xl font-medium ${transaction.category === 'income' ? 'text-green-600' : 'text-red-400'}`}
						>{transaction.category === 'income' ? '+' : '-'}{Math.abs(
							transaction.amount
						).toLocaleString('en-US', {
							style: 'currency',
							currency: 'USD',
							maximumFractionDigits: 0
						})}</span
					>
					<!-- <button
						onclick={() => handleDelete(transaction._id)}
						class="absolute top-0 right-4 ml-auto cursor-pointer rounded-sm bg-red-100 px-1.5 text-xs text-red-800 transition hover:bg-red-200"
						>Delete</button
					> -->
				</li>
			{/each}
		</ul>
	{/if}
</main>
