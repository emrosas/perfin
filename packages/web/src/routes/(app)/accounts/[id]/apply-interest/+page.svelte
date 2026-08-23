<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { useConvexClient } from 'convex-svelte';
	import { api } from '@perfin/backend/convex/_generated/api';
	import { getUserAccounts } from '../../../../../context';
	import { EXPENSE_CATEGORIES } from '$lib/categories';
	import type { Id } from '@perfin/backend/convex/_generated/dataModel';

	const client = useConvexClient();
	const currentUserAccounts = getUserAccounts();

	const accountId = $derived(page.params.id as Id<'accounts'>);
	const account = $derived(currentUserAccounts.data?.find((a) => a._id === accountId));
	const acc = $derived(account as any);

	const prefilledAmount = $derived(() => {
		if (!acc) return 0;
		const balance = Math.abs(acc.balance ?? 0);
		const apr = (acc.apr ?? 0) as number;
		const taxRate = (acc.interestTaxRate ?? 0) as number;
		const base = balance * (apr / 100 / 12);
		return parseFloat((base * (1 + taxRate)).toFixed(2));
	});

	let amount = $state<number | ''>('');
	let description = $state('Interest charge');
	let expenseCategory = $state('miscellaneous');
	let initialised = $state(false);
	let status = $state<'idle' | 'loading' | 'error'>('idle');
	let errorMsg = $state('');

	$effect(() => {
		if (acc && !initialised) {
			amount = prefilledAmount();
			initialised = true;
		}
	});

	const parsedAmount = $derived(
		typeof amount === 'number' ? amount : parseFloat(String(amount)) || 0
	);

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		if (status === 'loading') return;
		if (parsedAmount <= 0) {
			errorMsg = 'Amount must be greater than zero';
			return;
		}
		status = 'loading';
		errorMsg = '';
		try {
			const today = new Date().toISOString().split('T')[0];
			await client.mutation(api.transactions.applyTransaction, {
				amount: parsedAmount,
				description: description.trim() || 'Interest charge',
				category: 'expense',
				date: today,
				accountId,
				expenseCategory,
			});
			goto(`/accounts/${accountId}`);
		} catch (err) {
			errorMsg = err instanceof Error ? err.message : 'Something went wrong';
			status = 'error';
		} finally {
			if (status === 'loading') status = 'idle';
		}
	}
</script>

{#if currentUserAccounts.isLoading}
	<div class="px-8 pt-16">
		<div class="skeleton h-8 w-48 rounded-lg"></div>
	</div>
{:else if !account || (account as any).type !== 'credit'}
	<div class="px-8 pt-16">
		<p class="text-dark/50">Account not found.</p>
		<a href="/accounts" class="mt-4 inline-block text-sm text-brand underline">← Back</a>
	</div>
{:else}
	<div class="px-4 pt-16 pb-12 md:px-8">
		<div class="mx-auto max-w-lg">
			<div class="mb-6 flex items-center gap-4">
				<a
					href="/accounts/{accountId}"
					aria-label="Back to account"
					class="text-dark/50 transition-colors hover:text-dark"
				>
					<svg class="size-6" viewBox="0 0 24 24" fill="currentColor">
						<path
							fill-rule="evenodd"
							d="M15.707 4.293a1 1 0 010 1.414L9.414 12l6.293 6.293a1 1 0 01-1.414 1.414l-7-7a1 1 0 010-1.414l7-7a1 1 0 011.414 0z"
							clip-rule="evenodd"
						/>
					</svg>
				</a>
				<div>
					<h1 class="text-2xl font-bold text-dark">Apply Interest</h1>
					<p class="text-sm text-dark/50">{account.name}</p>
				</div>
			</div>

			<!-- Calculation note -->
			{#if acc.apr}
				<div class="mb-6 rounded-xl bg-muted/60 p-4 text-sm text-dark/60">
					<p>
						Pre-filled: <span class="font-mono font-semibold text-dark">{acc.apr}% APR ÷ 12</span>
						× <span class="font-mono font-semibold text-dark">{Math.abs(acc.balance ?? 0).toLocaleString('en-US', { style: 'currency', currency: 'USD' })} balance</span>
						{#if acc.interestTaxRate}
							× <span class="font-mono font-semibold text-dark">(1 + {(acc.interestTaxRate * 100).toFixed(0)}% tax)</span>
						{/if}
					</p>
					<p class="mt-1 text-dark/40">Adjust the amount to match your actual statement.</p>
				</div>
			{/if}

			<form onsubmit={handleSubmit} class="flex flex-col gap-6">
				<label class="flex flex-col gap-2">
					<span class="text-sm font-medium text-dark">Amount</span>
					<input
						type="number"
						min="0"
						step="0.01"
						placeholder="0.00"
						bind:value={amount}
						class="field w-full rounded-lg bg-muted px-4 py-3 font-mono text-base text-dark outline-none placeholder:text-dark/30 focus:ring-2 focus:ring-brand/30"
					/>
				</label>

				<label class="flex flex-col gap-2">
					<span class="text-sm font-medium text-dark">Description</span>
					<input
						type="text"
						bind:value={description}
						class="field w-full rounded-lg bg-muted px-4 py-3 font-mono text-base text-dark outline-none placeholder:text-dark/30 focus:ring-2 focus:ring-brand/30"
					/>
				</label>

				<label class="flex flex-col gap-2">
					<span class="text-sm font-medium text-dark">Category</span>
					<select
						bind:value={expenseCategory}
						class="field w-full rounded-lg bg-muted px-4 py-3 text-base text-dark outline-none focus:ring-2 focus:ring-brand/30"
					>
						{#each EXPENSE_CATEGORIES as cat (cat.key)}
							<option value={cat.key}>{cat.label}</option>
						{/each}
					</select>
				</label>

				{#if errorMsg}
					<p class="text-sm text-red-500">{errorMsg}</p>
				{/if}

				<button
					type="submit"
					disabled={status === 'loading'}
					class="mt-2 flex w-full items-center justify-center rounded-xl bg-brand py-4 text-base font-semibold text-white transition-colors hover:bg-brand/90 disabled:opacity-60"
				>
					{status === 'loading' ? 'Applying…' : 'Apply Interest Charge'}
				</button>
			</form>
		</div>
	</div>
{/if}
