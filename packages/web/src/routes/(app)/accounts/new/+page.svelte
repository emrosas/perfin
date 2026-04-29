<script lang="ts">
	import { goto } from '$app/navigation';
	import { useConvexClient } from 'convex-svelte';
	import { api } from '@perfin/backend/convex/_generated/api';
	import {
		ACCENT_COLORS,
		DEFAULT_ACCOUNT_COLOR,
		DEFAULT_ACCOUNT_TYPE,
		getCardStyleFromHex
	} from '$lib/accountColors';
	import CardIcon from '$components/icons/card.svelte';
	import BagIcon from '$components/icons/bag.svelte';
	import AccountCard from '$components/accountCard.svelte';

	const client = useConvexClient();

	let name = $state('New Account');
	let balance = $state<number | ''>('');
	let type = $state<'card' | 'physical'>(DEFAULT_ACCOUNT_TYPE);
	let color = $state(DEFAULT_ACCOUNT_COLOR);
	let status = $state<'idle' | 'loading' | 'error'>('idle');
	let errorMsg = $state('');

	const parsedBalance = $derived(
		typeof balance === 'number' ? balance : parseFloat(String(balance)) || 0
	);

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		if (status === 'loading') return;
		if (!name.trim()) {
			errorMsg = 'Please enter an account name';
			return;
		}
		status = 'loading';
		errorMsg = '';
		try {
			await client.mutation(api.accounts.createAccount, {
				name: name.trim(),
				balance: parsedBalance,
				type,
				color
			});
			goto('/accounts');
		} catch (err) {
			errorMsg = err instanceof Error ? err.message : 'Something went wrong';
			status = 'error';
		} finally {
			if (status === 'loading') status = 'idle';
		}
	}
</script>

<div class="px-4 pt-16 pb-12 md:px-8">
	<div class="mx-auto max-w-lg">
		<div class="mb-6 flex items-center gap-4">
			<a
				href="/accounts"
				aria-label="Back to accounts"
				class="text-dark/50 transition-colors hover:text-dark"
			>
				<svg class="size-6" viewBox="0 0 24 24" fill="currentColor">
					<path
						fill-rule="evenodd"
						d="M15.707 4.293a1 1 0 010 1.414L9.414 12l6.293 6.293a1 1 0 01-1.414 1.414l-7-7a1 1 0 010-1.414l7-7a1 1 0 011.414 0z"
						clip-rule="evenodd"
					/>
				</svg>
			</a>
			<h1 class="text-2xl font-bold text-dark">New Account</h1>
		</div>

		<!-- Live preview -->
		<div class="pointer-events-none mb-6">
			<AccountCard name={name || 'New Account'} balance={parsedBalance} {color} {type} />
		</div>

		<form id="new-account-form" onsubmit={handleSubmit} class="flex flex-col gap-6">
			<!-- Type selector -->
			<fieldset>
				<legend class="mb-3 text-sm font-medium text-dark">Account Type</legend>
				<div class="flex rounded-xl bg-muted p-1">
					<label
						class="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg px-4 py-3 text-base font-medium transition-all
							{type === 'card' ? 'bg-card text-dark shadow-sm' : 'text-dark/40 hover:text-dark'}"
					>
						<input type="radio" name="type" value="card" bind:group={type} class="sr-only" />
						<CardIcon class="size-5 {type === 'card' ? 'text-brand' : ''}" />
						Card
					</label>
					<label
						class="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg px-4 py-3 text-base font-medium transition-all
							{type === 'physical' ? 'bg-card text-dark shadow-sm' : 'text-dark/40 hover:text-dark'}"
					>
						<input type="radio" name="type" value="physical" bind:group={type} class="sr-only" />
						<BagIcon class="size-5 {type === 'physical' ? 'text-brand' : ''}" />
						Physical
					</label>
				</div>
			</fieldset>

			<!-- Color picker -->
			<div>
				<p class="mb-3 text-sm font-medium text-dark">Color</p>
				<div class="flex flex-wrap gap-3">
					{#each ACCENT_COLORS as c (c)}
						<button
							type="button"
							onclick={() => (color = c)}
							class="size-8 rounded-full transition-all"
							style="background-color: {c}; {color === c
								? `box-shadow: 0 0 0 3px white, 0 0 0 5px ${c};`
								: ''}"
							aria-label="Select color {c}"
						></button>
					{/each}
				</div>
			</div>

			<!-- Title -->
			<label class="flex flex-col gap-2">
				<span class="text-sm font-medium text-dark">Title</span>
				<div class="relative">
					<input
						type="text"
						placeholder="New Account"
						bind:value={name}
						class="w-full rounded-lg bg-muted px-4 py-3 pr-10 font-mono text-base text-dark outline-none placeholder:text-dark/30 focus:ring-2 focus:ring-brand/30"
					/>
					{#if name}
						<button
							type="button"
							onclick={() => (name = '')}
							class="absolute top-1/2 right-3 -translate-y-1/2 text-lg leading-none text-dark/30 hover:text-dark/60"
							>×</button
						>
					{/if}
				</div>
			</label>

			<!-- Starting balance -->
			<label class="flex flex-col gap-2">
				<span class="text-sm font-medium text-dark">Starting Balance</span>
				<input
					type="number"
					min="0"
					step="0.01"
					placeholder="0.00"
					bind:value={balance}
					class="w-full rounded-lg bg-muted px-4 py-3 font-mono text-base text-dark outline-none placeholder:text-dark/30 focus:ring-2 focus:ring-brand/30"
				/>
			</label>

			{#if errorMsg}
				<p class="text-sm text-red-500">{errorMsg}</p>
			{/if}

			<button
				type="submit"
				disabled={status === 'loading'}
				class="mt-2 flex w-full items-center justify-center rounded-xl bg-brand py-4 text-base font-semibold text-white transition-colors hover:bg-brand/90 disabled:opacity-60"
			>
				{status === 'loading' ? 'Creating…' : 'Create Account'}
			</button>
		</form>
	</div>
</div>
