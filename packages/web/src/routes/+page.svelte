<script lang="ts">
	import { useQuery } from 'convex-svelte';
	import { api } from '@perfin/backend/convex/_generated/api';
	import AddTransaction from '../components/addTransaction.svelte';
	import MonthlyBalance from '../components/monthlyBalance.svelte';
	// import type { Id } from '@perfin/backend/convex/_generated/dataModel';

	// const client = useConvexClient();
	const listTransactions = useQuery(api.transactions.getTransactions);

	// async function handleDelete(transactionId: Id<'transactions'>) {
	// 	await client.mutation(api.transactions.deleteTransaction, { id: transactionId });
	// }
</script>

<main>
	<h1
		class="mx-4 my-4 mb-4 bg-linear-to-tr from-brand to-brand-alt bg-clip-text text-2xl font-semibold text-transparent"
	>
		Perfin
	</h1>
	<AddTransaction />
	<MonthlyBalance />
	{#if listTransactions.isLoading}
		<p>Getting Transactions...</p>
	{:else if listTransactions.error}
		<p>Error: {listTransactions.error.toString()}</p>
	{:else}
		<h3 class="mx-4 mt-4 text-lg font-medium">My Transactions</h3>
		<ul class="mt-2">
			{#each listTransactions.data as transaction (transaction._id)}
				<li
					class="group relative grid grid-cols-[auto_1fr_auto] items-center gap-4 border-b border-light-alt px-4 py-4"
				>
					<div class="flex size-12 flex-col items-center justify-center rounded-sm bg-dark"></div>
					<div class="flex flex-col justify-center">
						<h4 class="font-medium capitalize">{transaction.description}</h4>
						<span class="text-xs text-dark-alt capitalize"
							>{new Date(transaction.date).toLocaleDateString('es-MX', {
								month: 'short',
								day: 'numeric'
							})}</span
						>
					</div>
					<span
						class={`text-xl font-medium ${transaction.category === 'income' ? 'text-green-600' : 'text-red-400'}`}
						>{transaction.category === 'income' ? '+' : '-'}{Math.abs(transaction.amount)}</span
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
