<script lang="ts">
	import { useQuery, useConvexClient } from 'convex-svelte';
	import { api } from '@perfin/backend/convex/_generated/api';
	import AddTransaction from '../components/addTransaction.svelte';
	import type { Id } from '@perfin/backend/convex/_generated/dataModel';

	const client = useConvexClient();
	const listTransactions = useQuery(api.transactions.getTransactions);
	const getMonthlyBalance = useQuery(api.transactions.getMonthlyBalance, {
		monthStart: new Date('2025-12-01').toISOString().split('T')[0],
		monthEnd: new Date('2025-12-31').toISOString().split('T')[0]
	});

	async function handleDelete(transactionId: Id<'transactions'>) {
		await client.mutation(api.transactions.deleteTransaction, { id: transactionId });
	}
</script>

<div class="p-4">
	<h1 class="mb-4 text-2xl font-semibold">Perfin</h1>
	<AddTransaction />
	{#if getMonthlyBalance.isLoading}
		<p>Getting Balance...</p>
	{:else if getMonthlyBalance.error}
		<p>Error: {getMonthlyBalance.error.toString()}</p>
	{:else}
		<p>Monthly Balance: {getMonthlyBalance.data}</p>
	{/if}
	{#if listTransactions.isLoading}
		<p>Getting Transactions...</p>
	{:else if listTransactions.error}
		<p>Error: {listTransactions.error.toString()}</p>
	{:else}
		<ul class="mt-4">
			{#each listTransactions.data as transaction (transaction._id)}
				<li class="flex items-center">
					{#if transaction.category === 'income'}
						<div class="text-lg font-semibold text-amber-500">
							<span>+ {transaction.amount}</span>
						</div>
					{:else}
						<div class="text-lg font-semibold text-red-400">
							<span>- {Math.abs(transaction.amount)}</span>
						</div>
					{/if}
					<span class="ml-4">{new Date(transaction.date).toLocaleDateString()}</span>
					<button
						onclick={() => handleDelete(transaction._id)}
						class="ml-auto cursor-pointer rounded-sm bg-red-100 px-2 text-red-800 transition hover:bg-red-200"
						>Delete</button
					>
				</li>
			{/each}
		</ul>
	{/if}
</div>
