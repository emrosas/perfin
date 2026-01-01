<script lang="ts">
	import BottomNavbar from '../../components/bottomNavbar.svelte';
	import MonthlyBalance from '../../components/monthlyBalance.svelte';

	const { children } = $props();
</script>

<MonthlyBalance />
<main class="grow overflow-scroll">
	{@render children()}
</main>
<BottomNavbar />
