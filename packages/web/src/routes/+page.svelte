<script lang="ts">
	import { authClient } from '$lib/authClient';

	import logo from '$lib/assets/logo.png';

	import { Input } from '$lib/components/ui/input/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { useConvexClient } from 'convex-svelte';
	import { api } from '@perfin/backend/convex/_generated/api.js';

	let { data } = $props();

	let showSignIn = $state(true);
	let name = $state('');
	let email = $state('');
	let password = $state('');
	let status = $state<'idle' | 'loading' | 'success' | 'error'>('idle');
	let error = $state('');

	const client = useConvexClient();

	async function handlePasswordSubmit(event: Event) {
		event.preventDefault();
		status = 'loading';

		try {
			if (showSignIn) {
				await authClient.signIn.email(
					{
						email,
						password,
						callbackURL: '/overview'
					},
					{
						onError: (ctx) => {
							error = ctx.error.message;
							status = 'error';
						}
					}
				);
			} else {
				await authClient.signUp.email(
					{ name, email, password, callbackURL: '/overview' },
					{
						onSuccess: (ctx) => {
							client.mutation(api.auth.createCashAccount, { userId: ctx.data.user.id }).then(() => {
								window.location.href = '/overview';
							});
						},
						onError: (ctx) => {
							error = ctx.error.message;
							status = 'error';
						}
					}
				);
			}
		} catch (err) {
			console.log('Authentication error:', err);
			status = 'error';
			error = 'An unexpected error occurred';
		}
	}

	function toggleSignMode() {
		showSignIn = !showSignIn;

		name = '';
		email = '';
		password = '';
	}
</script>

<div class="p-6 pt-24">
	<div class="mb-12 flex flex-col items-center">
		<img src={logo} alt="Perfin Logo" class="h-auto w-24" />
		<h1 class="mt-3 mb-2 text-6xl font-bold">Perfin</h1>
		<p class="text-xs">Manage your personal finances without all the complexity.</p>
	</div>
	<form onsubmit={handlePasswordSubmit} class="flex flex-col gap-6">
		<div class="flex flex-col gap-5">
			{#if !showSignIn}
				<label for="name" class="flex flex-col gap-1">
					Name
					<Input
						class="bg-input"
						type="text"
						name="name"
						bind:value={name}
						disabled={status === 'loading'}
						required
					/>
				</label>
			{/if}
			<label for="email" class="flex flex-col gap-1">
				Email
				<Input
					class="bg-input"
					type="email"
					name="email"
					bind:value={email}
					disabled={status === 'loading'}
					required
				/>
			</label>
			<label for="password" class="flex flex-col gap-1">
				Password
				<Input
					class="bg-input"
					type="password"
					name="password"
					bind:value={password}
					disabled={status === 'loading'}
					required
				/>
			</label>
		</div>
		<Button type="submit" disabled={status === 'loading'}
			>{status === 'loading' ? 'Loading...' : showSignIn ? 'Sign In' : 'Sign Up'}</Button
		>
	</form>
	<div class="mt-4 text-center">
		<span>{showSignIn ? "Don't have an account?" : 'Already have an account?'}</span>
		<button
			onclick={toggleSignMode}
			class="ml-2 inline cursor-pointer text-secondary transition-colors hover:text-primary"
		>
			{showSignIn ? 'Sign Up' : 'Sign In'}
		</button>
	</div>
	{#if error}
		<p class="mt-6 text-center text-red-500">{error}</p>
	{/if}
</div>
