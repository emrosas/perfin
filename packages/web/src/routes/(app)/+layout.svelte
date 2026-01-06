<script lang="ts">
	import BottomNavbar from '../../components/bottomNavbar.svelte';

	const { children } = $props();
</script>

<main class="grow overflow-scroll">
	{@render children()}
</main>
<BottomNavbar />
