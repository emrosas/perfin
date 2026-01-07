<script lang="ts">
	import { useQuery } from 'convex-svelte';
	import { api } from '@perfin/backend/convex/_generated/api';
	import { setUserAccounts } from '../../context';

	import BottomNavbar from '../../components/bottomNavbar.svelte';
	const { children } = $props();

	const currentUserAccounts = useQuery(api.accounts.getCurrentUserAccounts);
	setUserAccounts(currentUserAccounts);
</script>

<main class="grow overflow-scroll">
	{@render children()}
</main>
<BottomNavbar />
