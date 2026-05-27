<script lang="ts">
	import { goto } from '$app/navigation';
	import { useConvexClient } from 'convex-svelte';
	import { api } from '@perfin/backend/convex/_generated/api';
	import { getUserAccounts } from '../../../../context';
	import { EXPENSE_CATEGORIES } from '$lib/categories';

	const client = useConvexClient();
	const currentUserAccounts = getUserAccounts();

	let name = $state('');
	let amount = $state<number | ''>('');
	let accountId = $state('');
	let expenseCategory = $state('subscriptions');
	let dayOfMonth = $state<number | ''>('');
	let status = $state<'idle' | 'loading' | 'error'>('idle');
	let errorMsg = $state('');

	const parsedAmount = $derived(
		typeof amount === 'number' ? amount : parseFloat(String(amount)) || 0
	);
	const parsedDay = $derived(
		typeof dayOfMonth === 'number' ? dayOfMonth : parseInt(String(dayOfMonth)) || 0
	);

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		if (status === 'loading') return;
		if (!name.trim()) { errorMsg = 'Please enter a name'; return; }
		if (parsedAmount <= 0) { errorMsg = 'Please enter an amount'; return; }
		if (!accountId) { errorMsg = 'Please select an account'; return; }
		if (parsedDay < 1 || parsedDay > 31) { errorMsg = 'Day of month must be between 1 and 31'; return; }

		status = 'loading';
		errorMsg = '';
		try {
			await client.mutation(api.recurringPayments.create, {
				name: name.trim(),
				amount: parsedAmount,
				accountId: accountId as any,
				expenseCategory: expenseCategory || undefined,
				dayOfMonth: parsedDay,
			});
			goto('/accounts');
		} catch (err) {
			errorMsg = err instanceof Error ? err.message : 'Something went wrong';
			status = 'error';
		} finally {
			if (status === 'loading') status = 'idle';
		}
	}
</script>

<div class="px-4 pt-16 pb-12 md:px-8">
	<div class="mx-auto max-w-lg">
		<div class="mb-6 flex items-center gap-4">
			<a href="/accounts" aria-label="Back" class="text-dark/50 transition-colors hover:text-dark">
				<svg class="size-6" viewBox="0 0 24 24" fill="currentColor">
					<path fill-rule="evenodd" d="M15.707 4.293a1 1 0 010 1.414L9.414 12l6.293 6.293a1 1 0 01-1.414 1.414l-7-7a1 1 0 010-1.414l7-7a1 1 0 011.414 0z" clip-rule="evenodd" />
				</svg>
			</a>
			<h1 class="text-2xl font-bold text-dark">New Recurring Payment</h1>
		</div>

		<form onsubmit={handleSubmit} class="flex flex-col gap-6">
			<label class="flex flex-col gap-2">
				<span class="text-sm font-medium text-dark">Name</span>
				<input
					type="text"
					placeholder="e.g. Spotify"
					bind:value={name}
					class="w-full rounded-lg bg-muted px-4 py-3 font-mono text-base text-dark outline-none placeholder:text-dark/30 focus:ring-2 focus:ring-brand/30"
				/>
			</label>

			<label class="flex flex-col gap-2">
				<span class="text-sm font-medium text-dark">Amount</span>
				<input
					type="number"
					min="0"
					step="0.01"
					placeholder="0.00"
					bind:value={amount}
					class="w-full rounded-lg bg-muted px-4 py-3 font-mono text-base text-dark outline-none placeholder:text-dark/30 focus:ring-2 focus:ring-brand/30"
				/>
			</label>

			<label class="flex flex-col gap-2">
				<span class="text-sm font-medium text-dark">Charged to</span>
				{#if currentUserAccounts.isLoading}
					<div class="skeleton h-12 w-full rounded-lg"></div>
				{:else}
					<select
						bind:value={accountId}
						class="w-full rounded-lg bg-muted px-4 py-3 text-base text-dark outline-none focus:ring-2 focus:ring-brand/30"
					>
						<option value="">Select account</option>
						{#each currentUserAccounts.data ?? [] as acc (acc._id)}
							<option value={acc._id}>{acc.name}</option>
						{/each}
					</select>
				{/if}
			</label>

			<label class="flex flex-col gap-2">
				<span class="text-sm font-medium text-dark">Category</span>
				<select
					bind:value={expenseCategory}
					class="w-full rounded-lg bg-muted px-4 py-3 text-base text-dark outline-none focus:ring-2 focus:ring-brand/30"
				>
					{#each EXPENSE_CATEGORIES as cat (cat.key)}
						<option value={cat.key}>{cat.label}</option>
					{/each}
				</select>
			</label>

			<label class="flex flex-col gap-2">
				<span class="text-sm font-medium text-dark">Day of month</span>
				<input
					type="number"
					min="1"
					max="31"
					step="1"
					placeholder="e.g. 15"
					bind:value={dayOfMonth}
					class="w-full rounded-lg bg-muted px-4 py-3 font-mono text-base text-dark outline-none placeholder:text-dark/30 focus:ring-2 focus:ring-brand/30"
				/>
				<p class="text-xs text-dark/40">The day this payment is charged each month.</p>
			</label>

			{#if errorMsg}
				<p class="text-sm text-red-500">{errorMsg}</p>
			{/if}

			<button
				type="submit"
				disabled={status === 'loading'}
				class="mt-2 flex w-full items-center justify-center rounded-xl bg-brand py-4 text-base font-semibold text-white transition-colors hover:bg-brand/90 disabled:opacity-60"
			>
				{status === 'loading' ? 'Creating…' : 'Create Recurring Payment'}
			</button>
		</form>
	</div>
</div>
