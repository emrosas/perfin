<script lang="ts">
	import { useConvexClient, useQuery } from 'convex-svelte';
	import { api } from '@perfin/backend/convex/_generated/api';
	import type { Id } from '@perfin/backend/convex/_generated/dataModel';

	const client = useConvexClient();

	const monthlyTransactions = useQuery(api.transactions.listMonthlyTransactions, {
		monthStart: new Date('2025-12-01').toISOString().split('T')[0],
		monthEnd: new Date('2025-12-31').toISOString().split('T')[0]
	});

	async function handleDeleteTransaction(transactionId: Id<'transactions'>) {
		await client.mutation(api.transactions.deleteTransaction, { id: transactionId });
	}

	const fmt = new Intl.DateTimeFormat('es-MX', {
		month: 'short',
		day: 'numeric',
		timeZone: 'UTC'
	});
</script>

{#snippet skeletonTransaction()}
	<li
		class="border-light-alt grid grid-cols-[auto_1fr_auto] items-center gap-4 rounded-md border p-2"
	>
		<div class="skeleton flex size-12 flex-col items-center justify-center rounded-xs"></div>
		<div class="flex flex-col justify-center gap-2">
			<div class="skeleton h-4 w-24"></div>
			<div class="skeleton h-2 w-12"></div>
		</div>
		<div class="skeleton h-8 w-16"></div>
	</li>
{/snippet}

<div class="p-4">
	{#if monthlyTransactions.isLoading}
		<h3 class="text-lg font-medium opacity-50">Getting Transactions...</h3>
		<ul class="mt-2 flex flex-col gap-2">
			{@render skeletonTransaction()}
			{@render skeletonTransaction()}
			{@render skeletonTransaction()}
			{@render skeletonTransaction()}
			{@render skeletonTransaction()}
		</ul>
	{:else}
		<h3 class="text-lg font-medium">My Transactions</h3>
		<ul class="mt-2 flex flex-col gap-2">
			{#each monthlyTransactions.data as transaction (transaction?._id)}
				{#if transaction}
					<li
						class="group border-light-alt relative grid grid-cols-[auto_1fr_auto] items-center gap-4 rounded-md border p-2"
					>
						<div
							class="flex size-12 flex-col items-center justify-center rounded-xs bg-muted-foreground"
						></div>
						<div class="flex flex-col justify-center">
							<h4 class="font-medium capitalize">{transaction.description}</h4>
							<div>
								<span class="text-dark-alt text-xs capitalize">
									{fmt.format(new Date(transaction.date))}
								</span>
								<span class="font-light text-muted-foreground">|</span>
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
						<button
							onclick={() => handleDeleteTransaction(transaction._id)}
							class="absolute top-0 right-0 ml-auto cursor-pointer rounded-tr-sm bg-red-100 px-1.5 text-[8px] text-red-800 transition hover:bg-red-200"
							>X</button
						>
					</li>
				{/if}
			{/each}
		</ul>
	{/if}
</div>
