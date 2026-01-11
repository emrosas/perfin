<script lang="ts">
	import { useConvexClient, useQuery } from 'convex-svelte';
	import { api } from '@perfin/backend/convex/_generated/api';
	import type { Id } from '@perfin/backend/convex/_generated/dataModel';

	const client = useConvexClient();

	function getMonthRange(year: number, month: number) {
		const firstDay = new Date(year, month, 1);
		const lastDay = new Date(year, month + 1, 0);

		const formatDate = (date: Date) => date.toISOString().split('T')[0];

		return {
			monthStart: formatDate(firstDay),
			monthEnd: formatDate(lastDay)
		};
	}

	let selectedMonth = $state(new Date());
	let range = $derived(getMonthRange(selectedMonth.getFullYear(), selectedMonth.getMonth()));
	// let monthStart = $derived(startingRange.monthStart);
	// let monthEnd = $state(startingRange.monthEnd);

	const monthlyTransactions = useQuery(api.transactions.listMonthlyTransactions, () => {
		return {
			monthStart: range.monthStart,
			monthEnd: range.monthEnd
		};
	});

	async function handleDeleteTransaction(transactionId: Id<'transactions'>) {
		await client.mutation(api.transactions.deleteTransaction, { id: transactionId });
	}

	const fmt = new Intl.DateTimeFormat('es-MX', {
		month: 'short',
		day: 'numeric',
		timeZone: 'UTC'
	});

	const monthFmt = new Intl.DateTimeFormat('es-MX', {
		month: 'short',
		timeZone: 'UTC'
	});

	const handleNextMonth = async () => {
		selectedMonth = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1);
	};

	const handlePreviousMonth = async () => {
		selectedMonth = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() - 1);
	};
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

<div class="p-4 pt-6">
	<div class="flex items-center justify-between gap-4">
		<h3 class="text-lg font-medium">My Transactions</h3>
		<div>
			<button onclick={handlePreviousMonth} class="inline-flex items-center">←</button>
			<h3
				class="mx-2 inline-block w-16 rounded-full bg-accent px-2 py-1 text-center text-lg leading-none font-medium capitalize"
			>
				{monthFmt.format(selectedMonth)}
			</h3>
			<button onclick={handleNextMonth} class="inline-flex items-center">→</button>
		</div>
	</div>
	{#if monthlyTransactions.isLoading}
		<ul class="mt-4 flex flex-col gap-2">
			{@render skeletonTransaction()}
			{@render skeletonTransaction()}
			{@render skeletonTransaction()}
			{@render skeletonTransaction()}
			{@render skeletonTransaction()}
		</ul>
	{:else}
		<ul class="mt-4 flex flex-col gap-2">
			{#each monthlyTransactions.data as transaction (transaction?._id)}
				{#if transaction}
					<li
						class="group border-light-alt relative grid grid-cols-[auto_1fr_auto] items-center gap-4 rounded-md border bg-card p-2"
					>
						<div
							class="flex size-12 flex-col items-center justify-center rounded-xs bg-muted-foreground"
						></div>
						<div class="flex flex-col justify-center">
							<h4 class="line-clamp-1 font-medium capitalize">{transaction.description}</h4>
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
