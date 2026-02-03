<script lang="ts">
	import { Input } from '$lib/components/ui/input';
	import Button from '$lib/components/ui/button/button.svelte';
	import { useConvexClient } from 'convex-svelte';
	import { api } from '@perfin/backend/convex/_generated/api';
	import { getUserAccounts } from '../../../context';
	import * as Select from '$lib/components/ui/select/index';
	import type { Id } from '@perfin/backend/convex/_generated/dataModel';

	let name = $state('');
	let balance = $state(0);
	let status = $state<'idle' | 'loading' | 'error'>('idle');
	let action = $state<'create' | 'update' | 'select'>('select');

	// Update account variables
	let selectedAccount = $state<Id<'accounts'> | undefined>(undefined);
	const currentUserAccounts = getUserAccounts();
	let selectedAccountBalance = $derived(
		currentUserAccounts?.data?.find((account) => account._id === selectedAccount)?.balance ?? 0
	);
	let selectTriggerContent = $derived(
		currentUserAccounts?.data?.find((account) => account._id === selectedAccount)?.name ??
			'Select Account'
	);

	function resetForms() {
		name = '';
		balance = 0;
		status = 'idle';
		action = 'select';
		selectedAccount = undefined;
	}

	const client = useConvexClient();

	async function handleCreateAccount() {
		status = 'loading';
		try {
			await client.mutation(api.accounts.createAccount, { name, balance });
			status = 'idle';
			resetForms();
		} catch {
			status = 'error';
		}
	}

	async function handleUpdateAccount() {
		status = 'loading';
		try {
			if (!selectedAccount) return;
			await client.mutation(api.transactions.updateAccountBalance, {
				id: selectedAccount,
				balance: selectedAccountBalance
			});
			status = 'idle';
			resetForms();
		} catch {
			status = 'error';
		}
	}

	const moneyFormatter = new Intl.NumberFormat('en-US', {
		style: 'currency',
		currency: 'USD',
		maximumFractionDigits: 0
	});
</script>

<div class="p-4 pt-24">
	<h1 class="text-3xl font-medium">Accounts</h1>
	{#if currentUserAccounts.isLoading}
		<div class="text-dark/50 flex flex-col items-center text-[8px]">Loading...</div>
	{:else}
		<ul class="mt-6 flex flex-col gap-4">
			{#each currentUserAccounts.data as account (account._id)}
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
<div class="p-4">
	{#if action === 'select'}
		<div class="flex gap-2">
			<Button onclick={() => (action = 'create')} class="grow">Create</Button>
			<Button onclick={() => (action = 'update')} class="grow" variant="secondary">Update</Button>
		</div>
	{/if}
	{#if action === 'create'}
		<form onsubmit={handleCreateAccount} class="flex flex-col gap-4">
			<Input
				type="text"
				placeholder="Account Name"
				bind:value={name}
				disabled={status === 'loading'}
			/>
			<Input
				type="number"
				placeholder="Initial Balance"
				bind:value={balance}
				disabled={status === 'loading'}
			/>
			<Button type="submit" disabled={status === 'loading'}>Create Account</Button>
			<Button onclick={() => (action = 'select')} disabled={status === 'loading'} variant="outline"
				>Cancel</Button
			>
		</form>
	{:else if action === 'update'}
		<form onsubmit={handleUpdateAccount} class="flex flex-col gap-4">
			<label for="account" class="flex flex-col gap-1">
				Account
				<Select.Root
					type="single"
					name="account"
					bind:value={selectedAccount}
					disabled={status === 'loading'}
				>
					<Select.Trigger>
						{selectTriggerContent}
					</Select.Trigger>
					<Select.Content>
						{#if currentUserAccounts.data}
							{#each currentUserAccounts.data as account (account._id)}
								<Select.Item value={account._id} label={account.name}>{account.name}</Select.Item>
							{/each}
						{/if}
					</Select.Content>
				</Select.Root>
			</label>
			<Input
				type="number"
				placeholder="Initial Balance"
				bind:value={selectedAccountBalance}
				disabled={status === 'loading'}
			/>
			<Button type="submit" disabled={status === 'loading'}>Update Account</Button>
			<Button onclick={() => resetForms()} disabled={status === 'loading'} variant="outline"
				>Cancel</Button
			>
		</form>
	{/if}
</div>
