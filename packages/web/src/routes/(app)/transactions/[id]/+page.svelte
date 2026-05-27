<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { useQuery, useConvexClient } from 'convex-svelte';
	import { api } from '@perfin/backend/convex/_generated/api';
	import type { Id } from '@perfin/backend/convex/_generated/dataModel';
	import TransactionForm from '$components/transactionForm.svelte';

	const client = useConvexClient();
	const txId = $derived(page.params.id as Id<'transactions'>);
	const txQuery = useQuery(api.transactions.getById, () => ({ id: txId }));

	const initialData = $derived.by(() => {
		const tx = txQuery.data;
		if (!tx) return undefined;
		return {
			category: tx.category as 'income' | 'expense' | 'transfer',
			description: tx.description,
			amount: Math.abs(tx.amount),
			date: tx.date,
			accountId: tx.accountId,
			fromAccountId: tx.fromAccountId as Id<'accounts'> | undefined,
			expenseCategory: tx.expenseCategory
		};
	});

	async function handleSubmit({
		category,
		description,
		amount,
		date,
		accountId,
		fromAccountId,
		expenseCategory
	}: {
		category: 'income' | 'expense' | 'transfer';
		description: string;
		amount: number;
		date: string;
		accountId: Id<'accounts'>;
		fromAccountId: Id<'accounts'> | undefined;
		expenseCategory: string | undefined;
	}) {
		if (category === 'transfer') {
			await client.mutation(api.transactions.updateTransfer, {
				id: txId,
				amount,
				description,
				date,
				fromAccountId: fromAccountId!,
				toAccountId: accountId
			});
		} else {
			await client.mutation(api.transactions.updateTransaction, {
				id: txId,
				amount,
				description,
				category,
				date,
				accountId,
				expenseCategory
			});
		}
		goto('/transactions');
	}

	async function handleDelete() {
		await client.mutation(api.transactions.deleteTransaction, { id: txId });
		goto('/transactions');
	}
</script>

{#if txQuery.isLoading}
	<div class="px-8 pt-16">
		<div class="skeleton h-8 w-48 rounded-lg"></div>
		<div class="skeleton mt-6 h-[72px] w-full rounded-2xl"></div>
	</div>
{:else if !txQuery.data}
	<div class="px-8 pt-16">
		<p class="text-dark/50">Transaction not found.</p>
		<a href="/transactions" class="text-brand mt-4 inline-block text-sm underline">← Back</a>
	</div>
{:else}
	<TransactionForm
		title="Edit Transaction"
		formId="edit-transaction-form"
		{initialData}
		onSubmit={handleSubmit}
		onDelete={handleDelete}
	/>
{/if}
