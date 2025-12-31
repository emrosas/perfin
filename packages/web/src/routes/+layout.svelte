<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import BottomNavbar from '../components/bottomNavbar.svelte';
	import MonthlyBalance from '../components/monthlyBalance.svelte';

	import { PUBLIC_CONVEX_URL } from '$env/static/public';
	import { setupConvex } from 'convex-svelte';
	const { children } = $props();
	setupConvex(PUBLIC_CONVEX_URL);
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>Perfin</title>
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>
<div class="flex h-screen flex-col">
	<MonthlyBalance />
	<main class="grow overflow-scroll">
		{@render children()}
	</main>
	<BottomNavbar />
</div>
