<script lang="ts">
	import { getUserAccounts } from '../context';

	const currentUserAccounts = getUserAccounts();
	const totalBalance = $derived(
		currentUserAccounts.data?.reduce((acc, account) => acc + account.balance, 0)
	);
</script>

{#snippet balanceIndicator(balance: number, account: string)}
	{#if balance > 0}
		<div class="group inline-flex flex-col gap-1 overflow-clip" style={`flex-basis: ${balance}%;`}>
			<div class="h-1 w-full rounded-full group-odd:bg-secondary group-even:bg-primary"></div>
			<span
				class="shrink-0 text-[10px] text-nowrap group-odd:text-secondary group-even:text-primary"
				>{account}</span
			>
		</div>
	{/if}
{/snippet}

<div class="border-light-alt flex flex-col gap-1 border-y bg-card px-4 pt-24 pb-6">
	{#if currentUserAccounts.isLoading}
		<h2 class="skeleton bg-clip-text text-5xl font-semibold text-transparent">$0</h2>
		<span class="mb-2 text-xs opacity-50">Loading Balance...</span>
		<div class="inline-flex flex-1 flex-col gap-1">
			<div class="skeleton h-1 w-full rounded-full"></div>
			<span class="text-[10px] opacity-50">Account</span>
		</div>
	{:else if currentUserAccounts.error}
		<p>Error: {currentUserAccounts.error.toString()}</p>
	{:else if currentUserAccounts}
		<h2 class="text-5xl font-semibold">
			{totalBalance?.toLocaleString('en-US', {
				style: 'currency',
				currency: 'USD',
				maximumFractionDigits: 0
			})}
		</h2>
		<span class="mb-2 text-xs">Current Balance</span>
		<div class="flex gap-0.5">
			{#each currentUserAccounts.data as account (account._id)}
				{@render balanceIndicator(account.balance, account.name)}
			{/each}
		</div>
	{/if}
</div>
