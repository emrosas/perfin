<script lang="ts">
	import OverviewIcon from './icons/overview.svelte';
	import AddTransaction from './addTransaction.svelte';
</script>

<div class="flex items-center justify-between gap-4 border-t border-light-alt p-4">
	<menu class="flex">
		<li>
			<a href="/" class="flex flex-col items-center text-xs text-dark/50">
				<OverviewIcon class="size-8 text-dark" />
				Home
			</a>
		</li>
	</menu>
	<AddTransaction />
</div>
