<script lang="ts">
	import { useQuery, useConvexClient } from 'convex-svelte';
	import { api } from '@perfin/backend/convex/_generated/api';
	import { getUserAccounts } from '../../../context';
	import AccountCard from '$components/accountCard.svelte';
	import { EXPENSE_CATEGORIES, CATEGORY_MAP } from '$lib/categories';
	import UtensilsIcon from '@lucide/svelte/icons/utensils';
	import ZapIcon from '@lucide/svelte/icons/zap';
	import StarIcon from '@lucide/svelte/icons/star';
	import HomeIcon from '@lucide/svelte/icons/home';
	import CarIcon from '@lucide/svelte/icons/car';
	import HeartIcon from '@lucide/svelte/icons/heart';
	import ShoppingCartIcon from '@lucide/svelte/icons/shopping-cart';
	import GraduationCapIcon from '@lucide/svelte/icons/graduation-cap';
	import CreditCardIcon from '@lucide/svelte/icons/credit-card';
	import Grid2x2Icon from '@lucide/svelte/icons/grid-2x2';

	const CATEGORY_ICONS: Record<string, any> = {
		utensils: UtensilsIcon,
		zap: ZapIcon,
		star: StarIcon,
		home: HomeIcon,
		car: CarIcon,
		heart: HeartIcon,
		'shopping-cart': ShoppingCartIcon,
		'graduation-cap': GraduationCapIcon,
		'credit-card': CreditCardIcon,
		'grid-2x2': Grid2x2Icon
	};

	const client = useConvexClient();
	const currentUserAccounts = getUserAccounts();

	function getCurrentMonth(): string {
		const now = new Date();
		return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
	}

	function getMonthBounds(month: string) {
		const [year, m] = month.split('-').map(Number);
		const start = `${year}-${String(m).padStart(2, '0')}-01`;
		const lastDay = new Date(year, m, 0).getDate();
		const end = `${year}-${String(m).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
		return { start, end };
	}

	const currentMonth = getCurrentMonth();
	const { start, end } = getMonthBounds(currentMonth);

	const budgets = useQuery(api.categoryBudgets.getBudgets, () => ({ month: currentMonth }));
	const spending = useQuery(api.categoryBudgets.getCategorySpending, () => ({
		monthStart: start,
		monthEnd: end
	}));

	const budgetMap = $derived(
		Object.fromEntries((budgets.data ?? []).map((b) => [b.category, b.budget]))
	);

	const categoriesWithBudgets = $derived(
		EXPENSE_CATEGORIES.filter((cat) => budgetMap[cat.key] !== undefined)
	);

	const unbudgetedCategories = $derived(
		EXPENSE_CATEGORIES.filter((cat) => budgetMap[cat.key] === undefined)
	);

	// Dialog state
	type DialogStep = 'closed' | 'pick' | 'budget';
	let dialogStep = $state<DialogStep>('closed');
	let selectedCategoryKey = $state<string | null>(null);
	let budgetInput = $state('');
	let saving = $state(false);
	let saveError = $state('');

	const selectedCategoryDef = $derived(
		selectedCategoryKey ? CATEGORY_MAP[selectedCategoryKey] : null
	);

	function openPicker() {
		if (unbudgetedCategories.length === 0) return;
		dialogStep = 'pick';
		selectedCategoryKey = null;
		budgetInput = '';
		saveError = '';
	}

	function pickCategory(key: string) {
		selectedCategoryKey = key;
		budgetInput = '';
		saveError = '';
		dialogStep = 'budget';
	}

	function editExisting(key: string) {
		selectedCategoryKey = key;
		budgetInput = String(budgetMap[key] ?? '');
		saveError = '';
		dialogStep = 'budget';
	}

	function closeDialog() {
		dialogStep = 'closed';
		selectedCategoryKey = null;
		budgetInput = '';
		saveError = '';
	}

	async function saveBudget() {
		if (!selectedCategoryKey) return;
		const amount = parseFloat(budgetInput);
		if (isNaN(amount) || amount <= 0) {
			saveError = 'Enter an amount greater than 0';
			return;
		}
		saving = true;
		saveError = '';
		try {
			await client.mutation(api.categoryBudgets.setBudget, {
				category: selectedCategoryKey,
				budget: amount,
				month: currentMonth
			});
			closeDialog();
		} catch (err) {
			saveError = err instanceof Error ? err.message : 'Something went wrong';
		} finally {
			saving = false;
		}
	}

	const isExistingBudget = $derived(
		selectedCategoryKey !== null && budgetMap[selectedCategoryKey] !== undefined
	);

	const balanceFmt = new Intl.NumberFormat('en-US', {
		style: 'currency',
		currency: 'USD',
		minimumFractionDigits: 2,
		maximumFractionDigits: 2
	});
</script>

<div class="px-8 pt-16 pb-12">
	<!-- Categories -->
	<section class="mb-10">
		<div class="mb-4 flex items-center justify-between">
			<h2 class="text-dark text-2xl font-bold">Categories</h2>
			<button
				type="button"
				onclick={openPicker}
				disabled={unbudgetedCategories.length === 0}
				class="text-brand disabled:text-brand/30 transition-colors"
				aria-label="Add category budget"
			>
				<svg class="size-7" viewBox="0 0 24 24" fill="currentColor">
					<path
						fill-rule="evenodd"
						d="M12 2a10 10 0 100 20A10 10 0 0012 2zm1 11h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H8a1 1 0 110-2h3V8a1 1 0 112 0v3z"
						clip-rule="evenodd"
					/>
				</svg>
			</button>
		</div>

		{#if budgets.isLoading || spending.isLoading}
			<ul class="flex flex-col gap-3">
				{#each Array(3) as _, i (i)}
					<li class="skeleton h-16 w-full rounded-2xl"></li>
				{/each}
			</ul>
		{:else if categoriesWithBudgets.length === 0}
			<p class="text-dark/40 py-6 text-center text-sm">
				No budgets set. Tap + to add a category budget.
			</p>
		{:else}
			<ul class="bg-card flex flex-col divide-y divide-[rgba(146,141,191,0.1)] rounded-2xl border border-[rgba(146,141,191,0.12)] px-6">
				{#each categoriesWithBudgets as cat (cat.key)}
					{@const spent = spending.data?.[cat.key] ?? 0}
					{@const budget = budgetMap[cat.key] ?? 0}
					{@const progress = budget > 0 ? Math.min(spent / budget, 1) : 0}
					{@const isOver = spent > budget && budget > 0}
					{@const Icon = CATEGORY_ICONS[cat.icon]}
					<li>
						<button
							type="button"
							onclick={() => editExisting(cat.key)}
							class="flex w-full items-center gap-3 py-4 text-left"
						>
							<div class="bg-muted flex size-11 shrink-0 items-center justify-center rounded-xl">
								<Icon class="text-dark size-5" />
							</div>
							<div class="flex flex-1 flex-col gap-1.5">
								<div class="flex items-center justify-between">
									<span class="text-dark text-sm font-medium">{cat.label}</span>
									<span
										class="font-mono text-sm tabular-nums {isOver
											? 'text-red-500'
											: 'text-dark'}"
									>
										{balanceFmt.format(spent)}
									</span>
								</div>
								<div class="bg-muted h-1 w-full overflow-hidden rounded-full">
									<div
										class="h-1 rounded-full transition-all {isOver
											? 'bg-red-500'
											: 'bg-brand'}"
										style="width: {progress * 100}%"
									></div>
								</div>
								<div class="flex items-center justify-between">
									{#if isOver}
										<span class="text-xs font-medium text-red-500">Over budget!</span>
									{:else}
										<span></span>
									{/if}
									<span class="font-mono text-xs text-[#9ca3af] tabular-nums">
										{balanceFmt.format(budget)}
									</span>
								</div>
							</div>
						</button>
					</li>
				{/each}
			</ul>
		{/if}
	</section>

	<!-- Accounts -->
	<section>
		<div class="mb-4 flex items-center justify-between">
			<h2 class="text-dark text-2xl font-bold">Accounts</h2>
			<a href="/accounts/new" class="text-brand transition-colors" aria-label="New account">
				<svg class="size-7" viewBox="0 0 24 24" fill="currentColor">
					<path
						fill-rule="evenodd"
						d="M12 2a10 10 0 100 20A10 10 0 0012 2zm1 11h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H8a1 1 0 110-2h3V8a1 1 0 112 0v3z"
						clip-rule="evenodd"
					/>
				</svg>
			</a>
		</div>

		{#if currentUserAccounts.isLoading}
			<ul class="flex flex-col gap-3">
				{#each Array(3) as _, i (i)}
					<li class="skeleton h-[72px] w-full rounded-2xl"></li>
				{/each}
			</ul>
		{:else if !currentUserAccounts.data || currentUserAccounts.data.length === 0}
			<p class="text-dark/40 py-6 text-center text-sm">
				No accounts yet. Tap + to create one.
			</p>
		{:else}
			<ul class="flex flex-col gap-3">
				{#each currentUserAccounts.data as account (account._id)}
					<li>
						<AccountCard
							name={account.name}
							balance={account.balance}
							color={account.color ?? '#3E3BF1'}
							type={account.type ?? 'card'}
							href="/accounts/{account._id}"
						/>
					</li>
				{/each}
			</ul>
		{/if}
	</section>
</div>

<!-- Budget Dialog Overlay -->
{#if dialogStep !== 'closed'}
	<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
	<div
		role="presentation"
		class="fixed inset-0 z-50 flex items-start justify-center bg-black/35 px-6 pt-32"
		onclick={(e) => { if (e.target === e.currentTarget) closeDialog(); }}
	>
		{#if dialogStep === 'pick'}
			<div class="bg-card w-full max-w-md rounded-2xl p-6 shadow-xl">
				<h3 class="text-dark mb-4 text-center text-lg font-bold">Add Category Budget</h3>
				<ul class="flex max-h-80 flex-col overflow-y-auto">
					{#each unbudgetedCategories as cat (cat.key)}
						{@const Icon = CATEGORY_ICONS[cat.icon]}
						<li>
							<button
								type="button"
								onclick={() => pickCategory(cat.key)}
								class="hover:bg-muted flex w-full items-center gap-3 rounded-xl px-3 py-3.5 text-left transition-colors"
							>
								<div class="bg-muted flex size-10 shrink-0 items-center justify-center rounded-xl">
									<Icon class="text-dark size-5" />
								</div>
								<span class="text-dark text-base font-medium">{cat.label}</span>
								<svg class="text-dark/25 ml-auto size-5" viewBox="0 0 20 20" fill="currentColor">
									<path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" />
								</svg>
							</button>
						</li>
					{/each}
				</ul>
			</div>
		{:else if dialogStep === 'budget' && selectedCategoryDef}
			{@const Icon = CATEGORY_ICONS[selectedCategoryDef.icon]}
			<div class="bg-card w-full max-w-md rounded-2xl p-6 shadow-xl">
				<div class="mb-5 flex flex-col items-center gap-2">
					<div class="bg-muted flex size-14 items-center justify-center rounded-2xl">
						<Icon class="text-dark size-7" />
					</div>
					<p class="text-dark text-lg font-bold">{selectedCategoryDef.label}</p>
					<p class="text-dark/50 text-sm">Set a monthly budget</p>
				</div>

				<label class="mb-4 flex flex-col gap-2">
					<span class="text-dark text-sm font-medium">Budget Amount</span>
					<input
						type="number"
						min="0"
						step="0.01"
						placeholder="0.00"
						bind:value={budgetInput}
						class="bg-muted text-dark placeholder:text-dark/30 w-full rounded-lg px-4 py-3 font-mono text-base outline-none focus:ring-2 focus:ring-brand/30"
					/>
				</label>

				{#if saveError}
					<p class="mb-3 text-sm text-red-500">{saveError}</p>
				{/if}

				<button
					type="button"
					onclick={saveBudget}
					disabled={saving}
					class="bg-brand hover:bg-brand/90 flex w-full items-center justify-center rounded-xl py-3.5 text-base font-semibold text-white transition-colors disabled:opacity-60"
				>
					{saving ? 'Saving…' : 'Save Budget'}
				</button>

				{#if !isExistingBudget}
					<button
						type="button"
						onclick={() => (dialogStep = 'pick')}
						class="text-brand mt-3 w-full py-2 text-sm font-medium"
					>
						Choose a different category
					</button>
				{/if}
			</div>
		{/if}
	</div>
{/if}
