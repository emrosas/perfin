<script lang="ts">
	import { getUserAccounts } from '../context';

	const currentUserAccounts = getUserAccounts();
</script>

<div class="border-light-alt flex flex-col gap-1 border-y bg-card px-4 pt-24 pb-6">
	{#if currentUserAccounts.isLoading}
		<h2 class="skeleton bg-clip-text text-5xl font-semibold text-transparent">$0</h2>
		<span class="mt-1 text-xs opacity-50">Loading Balance...</span>
		<div class="skeleton mt-2 h-1 w-full rounded-full"></div>
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
		<span class="mt-1 text-xs">Current Balance</span>
		<div class="mt-2">
			<div>
				<div class="h-1 w-full rounded-full bg-green-800"></div>
				<span class="text-[10px] text-green-800">Cash</span>
			</div>
		</div>
	{/if}
</div>
