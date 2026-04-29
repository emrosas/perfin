<script lang="ts">
	import { page } from '$app/state';
	import HomeIcon from '$components/icons/home.svelte';
	import WalletIcon from '$components/icons/wallet.svelte';
	import SettingsIcon from '$components/icons/settings.svelte';
	import PlusIcon from '$components/icons/plus.svelte';

	const isNewTransaction = $derived(page.url.pathname === '/transactions/new');
	const isEditTransaction = $derived(
		/^\/transactions\/[^/]+$/.test(page.url.pathname) && !isNewTransaction
	);
	const isTransactionForm = $derived(isNewTransaction || isEditTransaction);

	const links = [
		{ href: '/transactions', label: 'Transactions', icon: 'home' },
		{ href: '/accounts', label: 'Accounts', icon: 'wallet' },
		{ href: '/settings', label: 'Settings', icon: 'settings' },
	] as const;

	function isActive(href: string) {
		if (href === '/transactions') return page.url.pathname.startsWith('/transactions');
		return page.url.pathname.startsWith(href);
	}
</script>

<div
	class="fixed right-0 bottom-0 left-0 flex flex-col items-stretch pt-5 pb-4"
	style="background: linear-gradient(to top, var(--color-background) 60%, transparent)"
>
	<div class="flex items-center justify-center gap-4 px-4">
		<!-- Pill tab bar -->
		<div class="flex flex-1 items-center gap-2 rounded-full bg-[#E2E2E9] p-2">
			{#each links as link}
				{@const active = isActive(link.href) && !isTransactionForm}
				<a
					href={link.href}
					aria-label={link.label}
					class="flex flex-1 items-center justify-center rounded-full transition-colors"
					class:bg-brand={active}
					class:h-12={true}
				>
					{#if link.icon === 'home'}
						<HomeIcon class="size-6 {active ? 'text-white' : 'text-dark'}" />
					{:else if link.icon === 'wallet'}
						<WalletIcon class="size-6 {active ? 'text-white' : 'text-dark'}" />
					{:else}
						<SettingsIcon class="size-6 {active ? 'text-white' : 'text-dark'}" />
					{/if}
				</a>
			{/each}
		</div>

		<!-- FAB -->
		{#if isTransactionForm}
			<button
				type="submit"
				form={isNewTransaction ? 'new-transaction-form' : 'edit-transaction-form'}
				class="bg-brand flex size-16 shrink-0 cursor-pointer items-center justify-center rounded-full text-white transition-opacity active:opacity-70"
			>
				<svg class="size-7" viewBox="0 0 20 20" fill="currentColor">
					<path
						fill-rule="evenodd"
						d="M16.704 5.293a1 1 0 00-1.414 0L8 12.586 4.71 9.293a1 1 0 00-1.42 1.414l4 4a1 1 0 001.414 0l8-8a1 1 0 000-1.414z"
						clip-rule="evenodd"
					/>
				</svg>
			</button>
		{:else}
			<a
				href="/transactions/new"
				class="bg-brand flex size-16 shrink-0 items-center justify-center rounded-full text-white transition-opacity active:opacity-70"
			>
				<PlusIcon class="size-8" />
			</a>
		{/if}
	</div>
</div>
