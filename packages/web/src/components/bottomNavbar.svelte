<script lang="ts">
	import OverviewIcon from './icons/overview.svelte';
	import ExitIcon from './icons/exit.svelte';
	import AddTransaction from './addTransaction.svelte';
	import { authClient } from '$lib/authClient';
	import { goto } from '$app/navigation';

	async function signOut() {
		const result = await authClient.signOut();
		if (result.error) {
			console.error('Sign out failed:', result.error);
		} else {
			goto('/');
		}
	}
</script>

<div class="flex items-center justify-between gap-4 border-t border-light-alt p-4">
	<menu class="flex grow gap-4">
		<li>
			<a href="/overview" class="flex flex-col items-center text-[8px] text-dark/50">
				<OverviewIcon class="size-6 text-dark" />
				Overview
			</a>
		</li>
		<li>
			<button onclick={signOut} class="flex flex-col items-center text-[8px] text-dark/50">
				<ExitIcon class="size-6 text-dark" />
				Sign Out
			</button>
		</li>
	</menu>
	<AddTransaction />
</div>
