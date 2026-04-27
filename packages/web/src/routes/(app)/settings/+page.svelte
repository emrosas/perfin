<script lang="ts">
	import { authClient } from '$lib/authClient';
	import { Button } from '$lib/components/ui/button/index.js';

	async function signOut() {
		const result = await authClient.signOut();
		if (result.error) {
			console.error('Sign out failed:', result.error);
		} else {
			window.location.href = '/';
		}
	}
</script>

<div class="px-8 pt-16 pb-12">
	<h1 class="text-dark text-3xl font-bold">Settings</h1>
	<p class="text-dark/50 mt-2 text-sm">Manage your account preferences.</p>

	<div class="mt-12">
		<Button variant="outline" onclick={signOut}>Sign Out</Button>
	</div>
</div>
