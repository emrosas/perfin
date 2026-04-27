<script lang="ts">
	import { page } from '$app/state';
	import logo from '$lib/assets/logo.png';
	import HomeIcon from '$components/icons/home.svelte';
	import WalletIcon from '$components/icons/wallet.svelte';
	import SettingsIcon from '$components/icons/settings.svelte';
	import PlusIcon from '$components/icons/plus.svelte';
	import NavLink from './navLink.svelte';

	const isNewTransaction = $derived(page.url.pathname === '/transactions/new');
	const isEditTransaction = $derived(
		/^\/transactions\/[^/]+$/.test(page.url.pathname) && !isNewTransaction
	);
</script>

<aside
	class="flex w-80 shrink-0 flex-col gap-20 border-r border-[rgba(146,141,191,0.12)] bg-card px-8 pt-16 pb-8 shadow-[0_6px_16px_rgba(0,0,0,0.12)]"
>
	<a href="/transactions" class="flex items-center gap-2">
		<img src={logo} alt="Perfin" class="h-12 w-auto" />
		<span class="text-dark text-3xl leading-none font-bold tracking-tight">Perfin</span>
	</a>

	<nav class="flex flex-1 flex-col gap-6">
		{#snippet homeIcon({ class: cls }: { class: string })}
			<HomeIcon class={cls} />
		{/snippet}
		{#snippet walletIcon({ class: cls }: { class: string })}
			<WalletIcon class={cls} />
		{/snippet}
		{#snippet settingsIcon({ class: cls }: { class: string })}
			<SettingsIcon class={cls} />
		{/snippet}

		<NavLink href="/transactions" label="Transactions" icon={homeIcon} />
		<NavLink href="/accounts" label="Accounts" icon={walletIcon} />
		<NavLink href="/settings" label="Settings" icon={settingsIcon} />
	</nav>

	{#if isNewTransaction}
		<button
			type="submit"
			form="new-transaction-form"
			class="bg-brand hover:bg-brand/90 flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg p-4 text-base font-medium text-white transition-colors"
		>
			<svg class="size-5" viewBox="0 0 20 20" fill="currentColor">
				<path fill-rule="evenodd" d="M16.704 5.293a1 1 0 00-1.414 0L8 12.586 4.71 9.293a1 1 0 00-1.42 1.414l4 4a1 1 0 001.414 0l8-8a1 1 0 000-1.414z" clip-rule="evenodd" />
			</svg>
			Apply Transaction
		</button>
	{:else if isEditTransaction}
		<button
			type="submit"
			form="edit-transaction-form"
			class="bg-brand hover:bg-brand/90 flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg p-4 text-base font-medium text-white transition-colors"
		>
			<svg class="size-5" viewBox="0 0 20 20" fill="currentColor">
				<path fill-rule="evenodd" d="M16.704 5.293a1 1 0 00-1.414 0L8 12.586 4.71 9.293a1 1 0 00-1.42 1.414l4 4a1 1 0 001.414 0l8-8a1 1 0 000-1.414z" clip-rule="evenodd" />
			</svg>
			Save Changes
		</button>
	{:else}
		<a
			href="/transactions/new"
			class="bg-brand hover:bg-brand/90 flex w-full items-center justify-center gap-1 rounded-lg p-4 text-base font-medium text-white transition-colors"
		>
			<PlusIcon class="size-8" />
			Create Transaction
		</a>
	{/if}
</aside>
