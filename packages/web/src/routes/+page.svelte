<script lang="ts">
	import { authClient } from '$lib/authClient';
	import { goto } from '$app/navigation';

	let { data } = $props();

	let showSignIn = $state(true);
	let name = $state('');
	let email = $state('');
	let password = $state('');
	let status = $state<'idle' | 'loading' | 'success' | 'error'>('idle');

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
							alert(ctx.error.message);
							status = 'error';
						}
					}
				);
			} else {
				await authClient.signUp.email(
					{ name, email, password, callbackURL: '/overview' },
					{
						onSuccess: () => {
							goto('/overview');
						},
						onError: (ctx) => {
							alert(ctx.error.message);
							status = 'error';
						}
					}
				);
			}
		} catch (error) {
			console.log('Authentication error:', error);
			status = 'error';
		}
	}

	function toggleSignMode() {
		showSignIn = !showSignIn;

		name = '';
		email = '';
		password = '';
	}
</script>

<div class="p-4">
	<h1 class="mb-4 text-2xl font-medium">{showSignIn ? 'Sign In' : 'Sign Up'}</h1>
	<form onsubmit={handlePasswordSubmit} class="flex flex-col gap-4">
		{#if !showSignIn}
			<label for="name" class="flex flex-col">
				Name
				<input
					type="text"
					name="name"
					id="name"
					class="rounded-sm border border-light-alt px-2 py-1 disabled:cursor-not-allowed disabled:opacity-80"
					bind:value={name}
					disabled={status === 'loading'}
					required
				/>
			</label>
		{/if}
		<label for="email" class="flex flex-col">
			Email
			<input
				type="email"
				name="email"
				id="email"
				class="rounded-sm border border-light-alt px-2 py-1 disabled:cursor-not-allowed disabled:opacity-80"
				bind:value={email}
				disabled={status === 'loading'}
				required
			/>
		</label>
		<label for="password" class="flex flex-col">
			Password
			<input
				type="password"
				name="password"
				id="password"
				class="rounded-sm border border-light-alt px-2 py-1 disabled:cursor-not-allowed disabled:opacity-80"
				bind:value={password}
				disabled={status === 'loading'}
				required
			/>
		</label>
		<button
			type="submit"
			class="mt-2 w-full cursor-pointer rounded-sm bg-purple-200 p-2 text-purple-900 transition hover:bg-purple-300 disabled:cursor-not-allowed disabled:opacity-80"
			disabled={status === 'loading'}
		>
			{status === 'loading' ? 'Loading...' : showSignIn ? 'Sign In' : 'Sign Up'}
		</button>
	</form>
	<div class="mt-4 text-center">
		<span>{showSignIn ? "Don't have an account?" : 'Already have an account?'}</span>
		<button
			onclick={toggleSignMode}
			class="ml-2 inline cursor-pointer text-dark-alt transition-colors hover:text-brand"
		>
			{showSignIn ? 'Sign Up' : 'Sign In'}
		</button>
	</div>
</div>
