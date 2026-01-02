<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';

	import { PUBLIC_CONVEX_URL } from '$env/static/public';
	import { setupConvex } from 'convex-svelte';
	import { createSvelteAuthClient } from '@mmailaender/convex-better-auth-svelte/svelte';
	import { authClient } from '$lib/authClient';

	const { children, data } = $props();

	setupConvex(PUBLIC_CONVEX_URL);
	createSvelteAuthClient({
		authClient,
		options: {
			expectAuth: true
		},
		getServerState: () => data.authState
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>Perfin</title>
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>

<div class="flex h-screen flex-col">
	{@render children()}
</div>
