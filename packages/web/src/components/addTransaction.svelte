<script lang="ts">
	import { useConvexClient } from 'convex-svelte';
	import { api } from '@perfin/backend/convex/_generated/api';

	let dialog: HTMLDialogElement;

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
			if (amount === 0) {
				throw new Error('Amount must be greater than zero');
			}
			const id = await convexClient.mutation(api.transactions.createTransaction, {
				transaction: {
					amount: Math.abs(amount),
					category,
					date
				}
			});
			alert(`Transaction with ID ${id} created!`);
			dialog.close();
			resetForm();
		} catch (error) {
			alert(`Error creating transaction: ${error}`);
		}
	}
</script>

<dialog
	bind:this={dialog}
	closedby="any"
	class="fixed top-1/2 left-1/2 m-0 w-2xl max-w-screen -translate-1/2"
>
	<div class="border border-slate-400 p-4">
		<h2 class="mb-2 text-lg font-medium">Add Transaction</h2>
		<form onsubmit={handleSubmit}>
			<div class="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-2">
				<label for="amount" class="flex flex-col gap-1">
					Amount
					<input
						class="min-h-12 border border-slate-400 px-2 py-1"
						type="number"
						id="amount"
						bind:value={amount}
						required
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
						required
					/>
				</label>
			</div>
			<button
				type="submit"
				class="mt-4 w-full cursor-pointer rounded-sm bg-purple-200 p-2 text-purple-900 transition hover:bg-purple-300"
				>Create Transaction</button
			>
		</form>
	</div>
</dialog>
<button
	aria-label="Add Transaction"
	onclick={() => dialog.showModal()}
	class="fixed right-4 bottom-4 flex size-12 cursor-pointer items-center justify-center rounded-full bg-slate-800 text-xl leading-0 text-white transition hover:bg-black"
	>+</button
>
