<script lang="ts">
	import { goto } from '$app/navigation';
	import { useConvexClient } from 'convex-svelte';
	import { api } from '@perfin/backend/convex/_generated/api';
	import type { Id } from '@perfin/backend/convex/_generated/dataModel';
	import TransactionForm from '$components/transactionForm.svelte';

	const client = useConvexClient();

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
			await client.mutation(api.transactions.applyTransfer, {
				amount,
				description,
				date,
				fromAccountId: fromAccountId!,
				toAccountId: accountId
			});
		} else {
			await client.mutation(api.transactions.applyTransaction, {
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
</script>

<TransactionForm title="New Transaction" formId="new-transaction-form" onSubmit={handleSubmit} />
