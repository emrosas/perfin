<script lang="ts">
	import CardIcon from '$components/icons/card.svelte';
	import BagIcon from '$components/icons/bag.svelte';
	import { getCardStyleFromHex } from '$lib/accountColors';

	type Props = {
		name: string;
		balance: number;
		color?: string;
		type?: 'card' | 'physical';
		href?: string;
	};

	let { name, balance, color = '#3E3BF1', type = 'card', href }: Props = $props();

	const style = $derived(getCardStyleFromHex(color));

	const balanceFmt = new Intl.NumberFormat('en-US', {
		style: 'currency',
		currency: 'USD',
		maximumFractionDigits: 0
	});

	const cardStyle = $derived(
		`background-image: linear-gradient(to right, ${style.gradientColors[0]}, ${style.gradientColors[1]}); border-color: ${style.borderColor};`
	);
</script>

{#snippet inner()}
	<div class="flex items-center gap-4">
		<div
			class="flex size-12 shrink-0 items-center justify-center rounded-xl"
			style="background-color: {style.iconBg};"
		>
			{#if type === 'physical'}
				<BagIcon class="size-7 text-white" />
			{:else}
				<CardIcon class="size-7 text-white" />
			{/if}
		</div>

		<div class="flex flex-1 items-center justify-between gap-4">
			<span class="text-dark text-base font-medium">{name}</span>
			<span class="font-mono text-base font-semibold tabular-nums" style="color: {style.amountColor};">
				{balanceFmt.format(balance)}
			</span>
		</div>

		{#if href}
			<svg class="text-dark/25 size-5 shrink-0" viewBox="0 0 20 20" fill="currentColor">
				<path
					fill-rule="evenodd"
					d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
					clip-rule="evenodd"
				/>
			</svg>
		{/if}
	</div>
{/snippet}

{#if href}
	<a {href} class="block rounded-2xl border px-6 py-4 transition-colors hover:brightness-95" style={cardStyle}>
		{@render inner()}
	</a>
{:else}
	<div class="rounded-2xl border px-6 py-4" style={cardStyle}>
		{@render inner()}
	</div>
{/if}
