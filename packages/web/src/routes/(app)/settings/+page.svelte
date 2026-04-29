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

<div class="px-4 pt-16 pb-12 md:px-8">
	<h1 class="text-3xl font-bold text-dark">Settings</h1>
	<p class="mt-2 text-sm text-dark/50">Manage your account preferences.</p>

	<div class="mt-12">
		<Button variant="outline" onclick={signOut}>Sign Out</Button>
	</div>
</div>
