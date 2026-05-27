<script lang="ts">
	import { useConvexClient } from 'convex-svelte';
	import { api } from '@perfin/backend/convex/_generated/api';
	import type { Id } from '@perfin/backend/convex/_generated/dataModel';

	type RecurringPayment = {
		_id: Id<'recurringPayments'>;
		name: string;
		amount: number;
		accountId: Id<'accounts'>;
		nextDueDate: string;
		expenseCategory?: string;
	};

	type Account = {
		_id: Id<'accounts'>;
		name: string;
	};

	type Props = {
		duePayments: RecurringPayment[];
		accounts: Account[];
	};

	let { duePayments, accounts }: Props = $props();

	const client = useConvexClient();

	let acting = $state<Id<'recurringPayments'> | null>(null);

	const today = new Date().toISOString().split('T')[0];

	const amountFmt = new Intl.NumberFormat('en-US', {
		style: 'currency',
		currency: 'USD',
		minimumFractionDigits: 2,
		maximumFractionDigits: 2
	});

	const dateFmt = new Intl.DateTimeFormat('en-US', {
		month: 'short',
		day: 'numeric',
		timeZone: 'UTC'
	});

	function accountName(id: Id<'accounts'>): string {
		return accounts.find((a) => a._id === id)?.name ?? '—';
	}

	function isOverdue(dateStr: string): boolean {
		return dateStr < today;
	}

	async function handleConfirm(id: Id<'recurringPayments'>) {
		if (acting) return;
		acting = id;
		try {
			await client.mutation(api.recurringPayments.confirm, { id });
		} finally {
			acting = null;
		}
	}

	async function handleSkip(id: Id<'recurringPayments'>) {
		if (acting) return;
		acting = id;
		try {
			await client.mutation(api.recurringPayments.skip, { id });
		} finally {
			acting = null;
		}
	}
</script>

{#if duePayments.length > 0}
	{@const front = duePayments[0]}
	<section class="mb-8">
		<h2 class="mb-3 text-sm font-semibold uppercase tracking-wide text-dark/50">
			Pending Payments {#if duePayments.length > 1}<span class="text-brand">({duePayments.length})</span>{/if}
		</h2>

		<!--
			Stack layout: front card in normal flow; back strips rendered below
			with negative margin-top so they tuck under the front card and peek
			out at the bottom. Front card has highest z-index so it covers the
			overlap region. Only the strip portion below the front card is visible.
		-->
		<div>
			<!-- Front / active card -->
			<div class="relative z-[3] rounded-2xl border border-[rgba(146,141,191,0.12)] bg-card px-5 py-4 shadow-md">
				<div class="flex items-start justify-between gap-3">
					<div class="flex flex-col gap-0.5">
						<p class="text-base font-semibold text-dark">{front.name}</p>
						<p class="text-sm text-dark/50">{accountName(front.accountId)}</p>
						<p class="mt-1 text-xs font-medium {isOverdue(front.nextDueDate) ? 'text-red-500' : 'text-dark/40'}">
							{isOverdue(front.nextDueDate) ? 'Overdue · ' : 'Due '}
							{dateFmt.format(new Date(front.nextDueDate + 'T00:00:00'))}
						</p>
					</div>
					<p class="font-mono text-xl font-bold text-dark tabular-nums">
						{amountFmt.format(front.amount)}
					</p>
				</div>

				<div class="mt-4 flex gap-3">
					<button
						type="button"
						onclick={() => handleConfirm(front._id)}
						disabled={!!acting}
						class="flex flex-1 items-center justify-center rounded-xl bg-brand py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand/90 disabled:opacity-50"
					>
						{acting === front._id ? '…' : 'Paid ✓'}
					</button>
					<button
						type="button"
						onclick={() => handleSkip(front._id)}
						disabled={!!acting}
						class="flex flex-1 items-center justify-center rounded-xl bg-muted py-2.5 text-sm font-semibold text-dark transition-colors hover:bg-muted/80 disabled:opacity-50"
					>
						Skip
					</button>
				</div>
			</div>

			<!-- Back strip 1: tucks 14px under the front card, peeks 10px below -->
			{#if duePayments.length >= 2}
				<div
					class="relative z-[2] -mt-[14px] mx-3 h-6 rounded-b-2xl border border-t-0 border-[rgba(146,141,191,0.12)] bg-card/90 shadow-sm"
				></div>
			{/if}

			<!-- Back strip 2: tucks 10px under strip 1, peeks 6px below strip 1 -->
			{#if duePayments.length >= 3}
				<div
					class="relative z-[1] -mt-[10px] mx-6 h-5 rounded-b-2xl border border-t-0 border-[rgba(146,141,191,0.12)] bg-card/70 shadow-sm"
				></div>
			{/if}
		</div>

		{#if duePayments.length > 3}
			<p class="mt-3 text-center text-xs text-dark/40">
				+{duePayments.length - 3} more pending
			</p>
		{/if}
	</section>
{/if}
