<script lang="ts">
	import { Input } from '$lib/components/ui/input';
	import Button from '$lib/components/ui/button/button.svelte';
	import { useConvexClient } from 'convex-svelte';
	import { api } from '@perfin/backend/convex/_generated/api';
	import { getUserAccounts } from '../../../context';

	let name = $state('');
	let balance = $state(0);
	let status = $state<'idle' | 'loading' | 'error'>('idle');

	function resetForm() {
		name = '';
		balance = 0;
	}

	const client = useConvexClient();

	async function handleCreateAccount() {
		status = 'loading';
		try {
			await client.mutation(api.accounts.createAccount, { name, balance });
			status = 'idle';
			resetForm();
		} catch {
			status = 'error';
		}
	}

	const accounts = getUserAccounts();

	const moneyFormatter = new Intl.NumberFormat('en-US', {
		style: 'currency',
		currency: 'USD',
		maximumFractionDigits: 0
	});
</script>

<div class="p-4 pt-24">
	<h1 class="text-3xl font-medium">Accounts</h1>
	{#if accounts.isLoading}
		<div class="text-dark/50 flex flex-col items-center text-[8px]">Loading...</div>
	{:else}
		<ul class="mt-6 flex flex-col gap-4">
			{#each accounts.data as account (account._id)}
				<li class="flex items-end justify-between gap-4">
					<span class="text-lg font-medium">{account.name}</span>
					<div class="mb-2 h-px grow bg-foreground/15"></div>
					<span
						class={`${account.balance > 0 ? 'text-green-600' : 'text-red-600'} text-lg font-medium`}
						>{moneyFormatter.format(account.balance)}</span
					>
				</li>
			{/each}
		</ul>
	{/if}
</div>
<form onsubmit={handleCreateAccount} class="mt-8 flex flex-col gap-4 px-4">
	<Input type="text" placeholder="Account Name" bind:value={name} disabled={status === 'loading'} />
	<Input
		type="number"
		placeholder="Initial Balance"
		bind:value={balance}
		disabled={status === 'loading'}
	/>
	<Button type="submit" disabled={status === 'loading'}>Create Account</Button>
</form>
