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
	<!-- Icon: spans both rows on narrow -->
	<div class="@max-[50rem]/tx:[grid-area:1/1/3/2]">
		{#if category === 'income'}
			<IncomeIcon class="size-10 shrink-0 text-brand" />
		{:else if category === 'expense'}
			<ExpenseIcon class="size-10 shrink-0 text-[#FF4540]" />
		{:else}
			<TransferIcon class="size-10 shrink-0 text-[#84C600]" />
		{/if}
	</div>

	<!-- Description: row 1 col 2 -->
	<span
		class="truncate font-medium leading-none text-dark @max-[50rem]/tx:text-base @max-[50rem]/tx:[grid-area:1/2/2/3] @min-[50rem]/tx:text-lg"
		>{description}</span
	>

	<!-- Details: col 3 on wide; row 2 cols 2–3 on narrow -->
	<div
		class="flex items-center @max-[50rem]/tx:gap-2 @max-[50rem]/tx:[grid-area:2/2/3/4] @min-[50rem]/tx:gap-6"
	>
		<span class="text-dark/50 @max-[50rem]/tx:text-xs @min-[50rem]/tx:text-sm">{categoryLabel}</span>
		<span class="hidden self-stretch bg-[#928dbf] @max-[50rem]/tx:block @max-[50rem]/tx:w-px"></span>
		<span class="text-dark/50 @max-[50rem]/tx:text-xs @min-[50rem]/tx:text-sm">{date}</span>
		<span class="hidden self-stretch bg-[#928dbf] @max-[50rem]/tx:block @max-[50rem]/tx:w-px"></span>
		<span class="text-dark/50 @max-[50rem]/tx:text-xs @min-[50rem]/tx:text-sm">{accountName}</span>
	</div>

	<!-- Amount + arrow: col 4 on wide; row 1 col 3 on narrow -->
	<div
		class="flex items-center justify-end gap-2 @max-[50rem]/tx:[grid-area:1/3/2/4]"
	>
		<span
			class="text-right font-mono tabular-nums {amountColor} @max-[50rem]/tx:text-sm @min-[50rem]/tx:text-base"
			>{formatted}</span
		>
		{#if href}
			<svg class="size-5 shrink-0 text-dark/25" viewBox="0 0 20 20" fill="currentColor">
				<path
					fill-rule="evenodd"
					d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
					clip-rule="evenodd"
				/>
			</svg>
		{/if}
	</div>
{/snippet}

{#if href}
	<div class="@container/tx">
		<a
			{href}
			class="grid items-center rounded-2xl border transition-colors hover:brightness-95
				@max-[50rem]/tx:grid-cols-[40px_1fr_auto] @max-[50rem]/tx:gap-x-3 @max-[50rem]/tx:gap-y-2 @max-[50rem]/tx:px-4 @max-[50rem]/tx:py-3.5 @max-[50rem]/tx:shadow-[0px_6px_16px_rgba(0,0,0,0.12)]
				@min-[50rem]/tx:grid-cols-[40px_1fr_1fr_auto] @min-[50rem]/tx:gap-6 @min-[50rem]/tx:px-6 @min-[50rem]/tx:py-4"
			style={rowStyle}
		>
			{@render inner()}
		</a>
	</div>
{:else}
	<div class="@container/tx">
		<div
			class="grid items-center rounded-2xl border transition-colors
				@max-[50rem]/tx:grid-cols-[40px_1fr_auto] @max-[50rem]/tx:gap-x-3 @max-[50rem]/tx:gap-y-2 @max-[50rem]/tx:px-4 @max-[50rem]/tx:py-3.5 @max-[50rem]/tx:shadow-[0px_6px_16px_rgba(0,0,0,0.12)]
				@min-[50rem]/tx:grid-cols-[40px_1fr_1fr_auto] @min-[50rem]/tx:gap-6 @min-[50rem]/tx:px-6 @min-[50rem]/tx:py-4"
			style={rowStyle}
		>
			{@render inner()}
		</div>
	</div>
{/if}
