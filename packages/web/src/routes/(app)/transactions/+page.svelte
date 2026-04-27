<script lang="ts">
	import { useQuery } from 'convex-svelte';
	import { api } from '@perfin/backend/convex/_generated/api';
	import { getUserAccounts } from '../../../context';
	import TransactionRow from '$components/transactionRow.svelte';
	import { getCategoryLabel } from '$lib/categories';

	const currentUserAccounts = getUserAccounts();

	let selectedMonth = $state(new Date());

	function getMonthRange(year: number, month: number) {
		const firstDay = new Date(year, month, 1);
		const lastDay = new Date(year, month + 1, 0);
		const fmt = (d: Date) => d.toISOString().split('T')[0];
		return { monthStart: fmt(firstDay), monthEnd: fmt(lastDay) };
	}

	const range = $derived(getMonthRange(selectedMonth.getFullYear(), selectedMonth.getMonth()));

	const monthlyTransactions = useQuery(api.transactions.listMonthlyTransactions, () => ({
		monthStart: range.monthStart,
		monthEnd: range.monthEnd
	}));

	const totalBalance = $derived(
		currentUserAccounts.data?.reduce((acc, a) => acc + a.balance, 0) ?? 0
	);

	const accountById = $derived(
		new Map((currentUserAccounts.data ?? []).map((a) => [a._id, a]))
	);

	const balanceFmt = new Intl.NumberFormat('en-US', {
		style: 'currency',
		currency: 'USD',
		maximumFractionDigits: 0
	});

	const dateFmt = new Intl.DateTimeFormat('en-US', {
		day: '2-digit',
		month: 'short',
		year: 'numeric',
		timeZone: 'UTC'
	});

	const monthFmt = new Intl.DateTimeFormat('en-US', {
		month: 'short',
		timeZone: 'UTC'
	});

	function shiftMonth(delta: number) {
		const next = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + delta, 1);
		const today = new Date();
		const isFuture =
			next.getFullYear() > today.getFullYear() ||
			(next.getFullYear() === today.getFullYear() && next.getMonth() > today.getMonth());
		if (isFuture) return;
		selectedMonth = next;
	}

	const visibleMonths = $derived.by(() => {
		const months: { key: string; label: string; offset: number; active: boolean }[] = [];
		for (let offset = -1; offset <= 1; offset++) {
			const d = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + offset, 1);
			months.push({
				key: `${d.getFullYear()}-${d.getMonth()}`,
				label: monthFmt.format(d).toUpperCase(),
				offset,
				active: offset === 0
			});
		}
		return months;
	});

	const distribution = $derived.by(() => {
		const accounts = currentUserAccounts.data ?? [];
		if (totalBalance <= 0) return [];
		return [...accounts]
			.filter((a) => a.balance > 0)
			.sort((a, b) => a.balance - b.balance)
			.map((a) => ({
				id: a._id,
				name: a.name,
				color: a.color ?? '#3E3BF1',
				fraction: a.balance / totalBalance
			}));
	});
</script>

<div class="px-8 pt-16 pb-12">
	<section class="pb-16">
		<h2 class="text-dark text-2xl font-medium">Balance</h2>
		<p class="text-dark mt-2 text-7xl font-bold tabular-nums">
			{#if currentUserAccounts.isLoading}
				<span class="opacity-30">$0</span>
			{:else}
				{balanceFmt.format(totalBalance)}
			{/if}
		</p>

		{#if distribution.length > 0}
			<div class="mt-8 flex w-full gap-1">
				{#each distribution as seg (seg.id)}
					<div class="flex flex-col gap-3" style="flex: {seg.fraction};">
						<div class="h-2 w-full rounded-full" style="background-color: {seg.color};"></div>
						<span class="text-dark truncate text-sm">{seg.name}</span>
					</div>
				{/each}
			</div>
		{/if}
	</section>

	<section>
		<div class="mb-6 flex items-center justify-between">
			<h3 class="text-dark text-3xl font-bold">Transactions</h3>
			<div class="flex items-center gap-1">
				{#each visibleMonths as month (month.key)}
					<button
						type="button"
						class="rounded-full px-3 py-1 text-sm font-medium transition-colors {month.active
							? 'bg-brand/15 text-brand'
							: 'text-dark/40 hover:text-dark'}"
						onclick={() => shiftMonth(month.offset)}
					>
						{month.label}
					</button>
				{/each}
			</div>
		</div>

		{#if monthlyTransactions.isLoading}
			<ul class="flex flex-col gap-3">
				{#each Array(4) as _, i (i)}
					<li class="skeleton h-[72px] w-full rounded-2xl"></li>
				{/each}
			</ul>
		{:else if monthlyTransactions.data && monthlyTransactions.data.length > 0}
			<ul class="flex flex-col gap-3">
				{#each monthlyTransactions.data as tx (tx?._id)}
					{#if tx}
						{@const toAccount = accountById.get(tx.accountId)}
						{@const fromAccount = tx.fromAccountId
							? accountById.get(tx.fromAccountId)
							: undefined}
						{@const accountLabel =
							tx.category === 'transfer'
								? `${fromAccount?.name ?? '?'} → ${toAccount?.name ?? '?'}`
								: (toAccount?.name ?? 'Unknown')}
						<li>
							<TransactionRow
								href="/transactions/{tx._id}"
								category={tx.category}
								description={tx.description}
								categoryLabel={tx.category === 'income'
									? 'General'
									: tx.category === 'transfer'
										? 'Transfer'
										: getCategoryLabel(tx.expenseCategory)}
								date={dateFmt.format(new Date(tx.date))}
								accountName={accountLabel}
								amount={tx.amount}
							/>
						</li>
					{/if}
				{/each}
			</ul>
		{:else}
			<p class="text-dark/40 py-12 text-center text-sm">No transactions this month.</p>
		{/if}
	</section>
</div>
