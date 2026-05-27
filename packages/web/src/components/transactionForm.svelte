<script lang="ts">
	import { untrack } from 'svelte';
	import type { Id } from '@perfin/backend/convex/_generated/dataModel';
	import { getCategoryLabel, EXPENSE_CATEGORIES } from '$lib/categories';
	import { getUserAccounts } from '../context';

	import IncomeIcon from './icons/income.svelte';
	import ExpenseIcon from './icons/expense.svelte';
	import TransferIcon from './icons/transfer.svelte';
	import TransactionRow from './transactionRow.svelte';

	type Category = 'income' | 'expense' | 'transfer';

	type InitialData = {
		category: Category;
		description: string;
		amount: number;
		date: string;
		accountId: Id<'accounts'>;
		fromAccountId?: Id<'accounts'>;
		expenseCategory?: string;
	};

	type FormValues = {
		category: Category;
		description: string;
		amount: number;
		date: string;
		accountId: Id<'accounts'>;
		fromAccountId: Id<'accounts'> | undefined;
		expenseCategory: string | undefined;
	};

	let {
		title,
		formId = 'transaction-form',
		initialData,
		onSubmit,
		onDelete
	}: {
		title: string;
		formId?: string;
		initialData?: InitialData;
		onSubmit: (values: FormValues) => Promise<void>;
		onDelete?: () => Promise<void>;
	} = $props();

	const currentUserAccounts = getUserAccounts();

	// untrack: initialData is intentionally read once at mount — the form owns its
	// own state after initialization and does not react to prop changes.
	let category = $state<Category>(untrack(() => initialData?.category ?? 'income'));
	let description = $state(untrack(() => initialData?.description ?? ''));
	let amount = $state<number | ''>(untrack(() => initialData?.amount ?? ''));
	let date = $state(untrack(() => initialData?.date ?? ''));
	let accountId = $state<Id<'accounts'> | ''>(untrack(() => initialData?.accountId ?? ''));
	let fromAccountId = $state<Id<'accounts'> | ''>(untrack(() => initialData?.fromAccountId ?? ''));
	let expenseCategory = $state(untrack(() => initialData?.expenseCategory ?? 'miscellaneous'));
	let status = $state<'idle' | 'loading' | 'error'>('idle');
	let errorMsg = $state('');

	const previewAccount = $derived(
		currentUserAccounts.data?.find((a) => a._id === (accountId || undefined))
	);
	const previewFromAccount = $derived(
		currentUserAccounts.data?.find((a) => a._id === (fromAccountId || undefined))
	);
	const previewAccountLabel = $derived.by(() => {
		if (category === 'transfer') {
			return `${previewFromAccount?.name ?? '—'} → ${previewAccount?.name ?? '—'}`;
		}
		return previewAccount?.name ?? '—';
	});
	const previewDate = $derived.by(() => {
		if (!date) return '—';
		return new Intl.DateTimeFormat('en-US', {
			day: '2-digit',
			month: 'short',
			year: 'numeric',
			timeZone: 'UTC'
		}).format(new Date(date));
	});
	const previewCategoryLabel = $derived.by(() => {
		if (category === 'income') return 'General';
		if (category === 'transfer') return 'Transfer';
		return getCategoryLabel(expenseCategory);
	});
	const previewAmount = $derived(typeof amount === 'number' ? amount : 0);

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		if (status === 'loading') return;
		status = 'loading';
		errorMsg = '';

		try {
			const amt = typeof amount === 'number' ? amount : parseFloat(String(amount));
			if (!amt || amt <= 0) throw new Error('Amount must be greater than zero');
			if (!date) throw new Error('Please select a date');

			if (category === 'transfer') {
				if (!fromAccountId) throw new Error('Please select a source account');
				if (!accountId) throw new Error('Please select a destination account');
				if (fromAccountId === accountId) throw new Error('Accounts must be different');
			} else {
				if (!accountId) throw new Error('Please select an account');
			}

			const defaultDescription =
				category === 'transfer' ? 'Transfer' : category === 'income' ? 'Income' : 'Expense';

			await onSubmit({
				category,
				description: description || defaultDescription,
				amount: amt,
				date,
				accountId: accountId as Id<'accounts'>,
				fromAccountId: fromAccountId ? (fromAccountId as Id<'accounts'>) : undefined,
				expenseCategory: category === 'expense' ? expenseCategory : undefined
			});
		} catch (err) {
			errorMsg = err instanceof Error ? err.message : 'Something went wrong';
			status = 'error';
		} finally {
			if (status === 'loading') status = 'idle';
		}
	}

	async function handleDelete() {
		if (!onDelete || status === 'loading') return;
		status = 'loading';
		errorMsg = '';
		try {
			await onDelete();
		} catch (err) {
			errorMsg = err instanceof Error ? err.message : 'Delete failed';
			status = 'error';
		} finally {
			if (status === 'loading') status = 'idle';
		}
	}
</script>

<form id={formId} onsubmit={handleSubmit} class="px-8 pt-16 pb-12 flex flex-col gap-8">
	<div class="flex items-center justify-between">
		<h1 class="text-dark text-3xl font-bold">{title}</h1>
		{#if onDelete}
			<button
				type="button"
				onclick={handleDelete}
				disabled={status === 'loading'}
				class="text-sm text-red-400 transition-colors hover:text-red-600 disabled:opacity-50"
			>
				Delete transaction
			</button>
		{/if}
	</div>

	<!-- Live preview row -->
	<div class="pointer-events-none">
		<TransactionRow
			{category}
			description={description || 'New Transaction'}
			categoryLabel={previewCategoryLabel}
			date={previewDate}
			accountName={previewAccountLabel}
			amount={previewAmount}
		/>
	</div>

	<!-- Type selector -->
	<fieldset class="flex flex-col gap-2">
		<legend class="text-dark mb-3 text-sm font-medium">Transaction Type</legend>
		<div class="bg-muted flex rounded-xl p-1">
			{#each [
				{ value: 'income', label: 'Income', Icon: IncomeIcon, color: 'text-brand' },
				{ value: 'expense', label: 'Expense', Icon: ExpenseIcon, color: 'text-[#FF4540]' },
				{ value: 'transfer', label: 'Transfer', Icon: TransferIcon, color: 'text-[#84C600]' }
			] as tab (tab.value)}
				<label
					class="flex flex-1 cursor-pointer items-center justify-center rounded-lg font-medium transition-all
						gap-1.5 px-2 py-2 text-sm md:gap-2 md:px-4 md:py-3 md:text-base
						{category === tab.value ? 'bg-card shadow-sm text-dark' : 'text-dark/40 hover:text-dark'}"
				>
					<input
						type="radio"
						name="category"
						value={tab.value}
						bind:group={category}
						class="sr-only"
					/>
					<tab.Icon class="size-4 md:size-6 {tab.color}" />
					{tab.label}
				</label>
			{/each}
		</div>
	</fieldset>

	<!-- Fields grid -->
	<div class="grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-x-8 md:gap-y-6">
		<!-- Title -->
		<label class="flex flex-col gap-2">
			<span class="text-dark text-sm font-medium">Title</span>
			<div class="relative">
				<input
					type="text"
					placeholder="Transaction title"
					bind:value={description}
					class="bg-muted text-dark placeholder:text-dark/30 w-full rounded-lg px-4 py-3 pr-10 font-mono text-base outline-none focus:ring-2 focus:ring-brand/30"
				/>
				{#if description}
					<button
						type="button"
						onclick={() => (description = '')}
						class="text-dark/30 hover:text-dark/60 absolute top-1/2 right-3 -translate-y-1/2 text-lg leading-none"
					>
						×
					</button>
				{/if}
			</div>
		</label>

		<!-- Amount -->
		<label class="flex flex-col gap-2">
			<span class="text-dark text-sm font-medium">Amount</span>
			<input
				type="number"
				min="0"
				step="0.01"
				placeholder="0.00"
				bind:value={amount}
				class="bg-muted text-dark placeholder:text-dark/30 w-full rounded-lg px-4 py-3 font-mono text-base outline-none focus:ring-2 focus:ring-brand/30"
			/>
		</label>

		<!-- Date -->
		<label class="flex flex-col gap-2">
			<span class="text-dark text-sm font-medium">Date</span>
			<input
				type="date"
				bind:value={date}
				class="bg-muted text-dark placeholder:text-dark/30 w-full rounded-lg px-4 py-3 font-mono text-base outline-none focus:ring-2 focus:ring-brand/30"
			/>
		</label>

		{#if category === 'transfer'}
			<!-- From Account -->
			<label class="flex flex-col gap-2">
				<span class="text-dark text-sm font-medium">From Account</span>
				<select
					bind:value={fromAccountId}
					class="bg-muted text-dark w-full rounded-lg px-4 py-3 text-base outline-none focus:ring-2 focus:ring-brand/30"
				>
					<option value="">Select Account</option>
					{#each currentUserAccounts.data ?? [] as account (account._id)}
						<option value={account._id}>{account.name}</option>
					{/each}
				</select>
			</label>

			<!-- To Account -->
			<label class="flex flex-col gap-2">
				<span class="text-dark text-sm font-medium">To Account</span>
				<select
					bind:value={accountId}
					class="bg-muted text-dark w-full rounded-lg px-4 py-3 text-base outline-none focus:ring-2 focus:ring-brand/30"
				>
					<option value="">Select Account</option>
					{#each (currentUserAccounts.data ?? []).filter((a) => a._id !== fromAccountId) as account (account._id)}
						<option value={account._id}>{account.name}</option>
					{/each}
				</select>
			</label>
		{:else}
			<!-- Account -->
			<label class="flex flex-col gap-2">
				<span class="text-dark text-sm font-medium">Account</span>
				<select
					bind:value={accountId}
					class="bg-muted text-dark w-full rounded-lg px-4 py-3 text-base outline-none focus:ring-2 focus:ring-brand/30"
				>
					<option value="">Select Account</option>
					{#each currentUserAccounts.data ?? [] as account (account._id)}
						<option value={account._id}>{account.name}</option>
					{/each}
				</select>
			</label>

			{#if category === 'expense'}
				<!-- Expense Category -->
				<label class="flex flex-col gap-2">
					<span class="text-dark text-sm font-medium">Category</span>
					<select
						bind:value={expenseCategory}
						class="bg-muted text-dark w-full rounded-lg px-4 py-3 text-base outline-none focus:ring-2 focus:ring-brand/30"
					>
						{#each EXPENSE_CATEGORIES as cat (cat.key)}
							<option value={cat.key}>{cat.label}</option>
						{/each}
					</select>
				</label>
			{/if}
		{/if}
	</div>

	{#if errorMsg}
		<p class="text-sm text-red-500">{errorMsg}</p>
	{/if}
</form>
