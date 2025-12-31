<script lang="ts">
	import { useConvexClient } from 'convex-svelte';
	import { api } from '@perfin/backend/convex/_generated/api';

	let amount = $state(0);
	let category = $state<'income' | 'expense'>('income');
	let date = $state(new Date().toISOString().split('T')[0]);

	function resetForm() {
		amount = 0;
		category = 'income';
		date = new Date().toISOString().split('T')[0];
	}

	const convexClient = useConvexClient();

	async function handleSubmit(event: Event) {
		event.preventDefault();
		try {
			if (amount <= 0) {
				throw new Error('Amount must be greater than zero');
			}
			const id = await convexClient.mutation(api.transactions.createTransaction, {
				transaction: {
					amount,
					category,
					date
				}
			});
			alert(`Transaction with ID ${id} created!`);
			resetForm();
		} catch (error) {
			alert(`Error creating transaction: ${error}`);
		}
	}
</script>

<div class="border border-slate-400 p-4">
	<h2 class="mb-2 text-lg font-medium">Add Transaction</h2>
	<form onsubmit={handleSubmit} class="grid grid-cols-3 gap-2 gap-y-4">
		<label for="amount" class="flex flex-col gap-1">
			Amount
			<input
				class="min-h-12 border border-slate-400 px-2 py-1"
				type="number"
				id="amount"
				bind:value={amount}
			/>
		</label>
		<label for="category" class="flex flex-col gap-1">
			Category
			<select
				class="min-h-12 border border-slate-400 px-2 py-1"
				id="category"
				bind:value={category}
			>
				<option value="income">Income</option>
				<option value="expense">Expense</option>
			</select>
		</label>
		<label for="date" class="flex flex-col gap-1">
			Date
			<input
				class="min-h-12 border border-slate-400 px-2 py-1"
				type="date"
				id="date"
				bind:value={date}
			/>
		</label>
		<button
			type="submit"
			class="col-span-3 cursor-pointer rounded-sm bg-blue-200 p-2 text-blue-900 transition hover:bg-blue-300"
			>Create Transaction</button
		>
	</form>
</div>
