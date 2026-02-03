<script lang="ts">
	import MonthlyBalance from '$components/monthlyBalance.svelte';
	import MonthlyTransactions from '$components/monthlyTransactions.svelte';
	import AddTransaction from '$components/addTransaction.svelte';
</script>

<main>
	<MonthlyBalance />
	<div class="grid grid-cols-2 gap-2 bg-foreground p-4">
		<AddTransaction />
	</div>
	<MonthlyTransactions />
</main>
