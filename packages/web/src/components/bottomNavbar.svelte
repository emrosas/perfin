<script lang="ts">
	import OverviewIcon from './icons/overview.svelte';
	import AccountIcon from './icons/account.svelte';
	import ExitIcon from './icons/exit.svelte';
	import AddTransaction from './addTransaction.svelte';
	import { authClient } from '$lib/authClient';

	async function signOut() {
		const result = await authClient.signOut();
		if (result.error) {
			console.error('Sign out failed:', result.error);
		} else {
			window.location.href = '/';
		}
	}
</script>

<div class="border-light-alt flex items-center justify-between gap-4 border-t bg-card p-4">
	<menu class="flex grow gap-4">
		<li>
			<a href="/overview" class="text-dark/50 flex flex-col items-center text-[8px]">
				<OverviewIcon class="text-dark size-6" />
				Overview
			</a>
		</li>
		<li>
			<a href="/accounts" class="text-dark/50 flex flex-col items-center text-[8px]">
				<AccountIcon class="text-dark size-6" />
				Accounts
			</a>
		</li>
		<li>
			<button
				onclick={signOut}
				class="text-dark/50 flex cursor-pointer flex-col items-center text-[8px]"
			>
				<ExitIcon class="text-dark size-6" />
				Sign Out
			</button>
		</li>
	</menu>
	<AddTransaction />
</div>
