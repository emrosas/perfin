<script lang="ts">
	import { page } from '$app/state';
	import { useQuery } from 'convex-svelte';
	import { api } from '@perfin/backend/convex/_generated/api';
	import { getUserAccounts } from '../../../../context';
	import { getCategoryLabel } from '$lib/categories';
	import { getCardStyleFromHex } from '$lib/accountColors';
	import type { Id } from '@perfin/backend/convex/_generated/dataModel';
	import CardIcon from '$components/icons/card.svelte';
	import BagIcon from '$components/icons/bag.svelte';
	import TransactionRow from '$components/transactionRow.svelte';

	const currentUserAccounts = getUserAccounts();

	const accountId = $derived(page.params.id as Id<'accounts'>);

	const account = $derived(currentUserAccounts.data?.find((a) => a._id === accountId));
	const color = $derived(account?.color ?? '#3E3BF1');
	const type = $derived(account?.type ?? 'card');
	const cardStyle = $derived(getCardStyleFromHex(color));

	const transactions = useQuery(api.transactions.listByAccount, () => ({ accountId }));

	const balanceFmt = new Intl.NumberFormat('en-US', {
		style: 'currency',
		currency: 'USD',
		minimumFractionDigits: 0,
		maximumFractionDigits: 0
	});

	const dateFmt = new Intl.DateTimeFormat('en-US', {
		day: '2-digit',
		month: 'short',
		year: 'numeric',
		timeZone: 'UTC'
	});
</script>

{#if currentUserAccounts.isLoading}
	<div class="px-8 pt-16">
		<div class="skeleton h-8 w-48 rounded-lg"></div>
	</div>
{:else if !account}
	<div class="px-8 pt-16">
		<p class="text-dark/50">Account not found.</p>
		<a href="/accounts" class="mt-4 inline-block text-sm text-brand underline">← Back</a>
	</div>
{:else}
	<div class="px-4 pt-16 pb-12 md:px-8">
		<a
			href="/accounts"
			class="mb-6 inline-flex items-center gap-1 text-dark/50 transition-colors hover:text-dark"
		>
			<svg class="size-5" viewBox="0 0 24 24" fill="currentColor">
				<path
					fill-rule="evenodd"
					d="M15.707 4.293a1 1 0 010 1.414L9.414 12l6.293 6.293a1 1 0 01-1.414 1.414l-7-7a1 1 0 010-1.414l7-7a1 1 0 011.414 0z"
					clip-rule="evenodd"
				/>
			</svg>
			Back
		</a>

		<!-- Account hero -->
		<div class="mb-6 flex flex-col items-center gap-3">
			<div
				class="flex size-20 items-center justify-center rounded-2xl"
				style="background-color: {cardStyle.iconBg};"
			>
				{#if type === 'physical'}
					<BagIcon class="size-12 text-white" />
				{:else}
					<CardIcon class="size-12 text-white" />
				{/if}
			</div>

			<div class="flex flex-col items-center gap-1">
				<p class="text-2xl font-bold text-dark">{account.name}</p>
				<p class="text-5xl font-bold text-dark tabular-nums">
					{balanceFmt.format(account.balance)}
				</p>
			</div>

			<a
				href="/accounts/{accountId}/edit"
				class="flex items-center gap-2 rounded-xl bg-muted px-6 py-3 text-sm font-medium transition-colors hover:bg-muted/80"
			>
				<svg class="size-4" viewBox="0 0 20 20" fill="currentColor">
					<path
						d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"
					/>
				</svg>
				<span class="text-dark">Edit</span>
			</a>
		</div>

		<!-- Transactions -->
		<section>
			<h2 class="mb-4 text-xl font-bold text-dark">Transactions</h2>

			{#if transactions.isLoading}
				<ul class="flex flex-col gap-3">
					{#each Array(4) as _, i (i)}
						<li class="skeleton h-[72px] w-full rounded-2xl"></li>
					{/each}
				</ul>
			{:else if !transactions.data || transactions.data.length === 0}
				<p class="py-12 text-center text-sm text-dark/40">No transactions for this account.</p>
			{:else}
				<ul class="flex flex-col gap-3">
					{#each transactions.data as tx (tx?._id)}
						{#if tx}
							<li>
								<TransactionRow
									href="/transactions/{tx._id}"
									category={tx.category as 'income' | 'expense' | 'transfer'}
									description={tx.description}
									categoryLabel={tx.category === 'income'
										? 'General'
										: tx.category === 'transfer'
											? 'Transfer'
											: getCategoryLabel((tx as any).expenseCategory)}
									date={dateFmt.format(new Date(tx.date))}
									accountName={account.name}
									amount={tx.amount}
								/>
							</li>
						{/if}
					{/each}
				</ul>
			{/if}
		</section>
	</div>
{/if}
