<script lang="ts">
	import IncomeIcon from '$components/icons/income.svelte';
	import ExpenseIcon from '$components/icons/expense.svelte';
	import TransferIcon from '$components/icons/transfer.svelte';

	type Props = {
		category: 'income' | 'expense' | 'transfer';
		description: string;
		categoryLabel: string;
		date: string;
		accountName: string;
		amount: number;
		href?: string;
	};

	let { category, description, categoryLabel, date, accountName, amount, href }: Props = $props();

	const rowStyle = $derived.by(() => {
		if (category === 'income')
			return 'border-color:rgba(62,59,241,0.08);background-image:linear-gradient(to right,#eef2ff,#ffffff 50%)';
		if (category === 'expense')
			return 'border-color:rgba(255,69,64,0.08);background-image:linear-gradient(to right,#fef2f2,#ffffff 50%)';
		return 'border-color:rgba(132,198,0,0.12);background-image:linear-gradient(to right,#f3ffe5,#ffffff 50%)';
	});

	const formatted = $derived.by(() => {
		const abs = `$${Math.abs(amount).toLocaleString('en-US', {
			minimumFractionDigits: 2,
			maximumFractionDigits: 2
		})}`;
		return category === 'expense' ? `-${abs}` : abs;
	});

	const amountColor = $derived(category === 'expense' ? 'text-[#FF4540]' : 'text-emerald-500');
</script>

{#snippet inner()}
	{#if category === 'income'}
		<IncomeIcon class="text-brand size-10 shrink-0" />
	{:else if category === 'expense'}
		<ExpenseIcon class="size-10 shrink-0 text-[#FF4540]" />
	{:else}
		<TransferIcon class="size-10 shrink-0 text-[#84C600]" />
	{/if}

	<span class="text-dark truncate text-lg leading-none font-medium">{description}</span>
	<span class="text-dark/50 truncate text-sm">{categoryLabel}</span>
	<span class="text-dark/50 truncate text-sm">{date}</span>
	<span class="text-dark/50 truncate text-sm">{accountName}</span>
	<span class="text-right font-mono text-base tabular-nums {amountColor}">
		{formatted}
	</span>

	{#if href}
		<svg class="text-dark/25 size-5 shrink-0 justify-self-end" viewBox="0 0 20 20" fill="currentColor">
			<path
				fill-rule="evenodd"
				d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
				clip-rule="evenodd"
			/>
		</svg>
	{/if}
{/snippet}

{#if href}
	<a
		{href}
		class="grid items-center gap-6 rounded-2xl border px-6 py-4 transition-colors hover:brightness-95"
		class:grid-cols-[40px_1fr_120px_120px_120px_140px_20px]={!!href}
		style={rowStyle}
	>
		{@render inner()}
	</a>
{:else}
	<div
		class="grid grid-cols-[40px_1fr_120px_120px_120px_140px] items-center gap-6 rounded-2xl border px-6 py-4 transition-colors"
		style={rowStyle}
	>
		{@render inner()}
	</div>
{/if}
