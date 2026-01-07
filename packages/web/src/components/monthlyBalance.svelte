<script lang="ts">
	import { getUserAccounts } from '../context';

	const currentUserAccounts = getUserAccounts();
</script>

<div class="border-light-alt flex flex-col gap-1 border-y px-4 pt-24 pb-12">
	{#if currentUserAccounts.isLoading}
		<h2 class="skeleton bg-clip-text text-5xl font-semibold text-transparent">$0</h2>
		<span class="text-xs opacity-50">Loading Balance...</span>
	{:else if currentUserAccounts.error}
		<p>Error: {currentUserAccounts.error.toString()}</p>
	{:else}
		<h2 class="text-5xl font-semibold">
			{currentUserAccounts?.data
				?.reduce((acc, account) => acc + account.balance, 0)
				.toLocaleString('en-US', {
					style: 'currency',
					currency: 'USD',
					maximumFractionDigits: 0
				})}
		</h2>
		<span class="text-xs">Current Balance</span>
	{/if}
</div>
