<script lang="ts">
	import AddIcon from './icons/add.svelte';
	import CalendarIcon from '@lucide/svelte/icons/calendar';
	import { Button, buttonVariants } from '$lib/components/ui/button/index';
	import * as Dialog from '$lib/components/ui/dialog/index';
	import { Input } from '$lib/components/ui/input/index';
	import { Calendar } from '$lib/components/ui/calendar/index';
	import * as Popover from '$lib/components/ui/popover/index';
	import { cn } from '$lib/utils';
	import { type DateValue, DateFormatter, getLocalTimeZone } from '@internationalized/date';

	import { useConvexClient } from 'convex-svelte';
	import { api } from '@perfin/backend/convex/_generated/api';

	let open = $state(false);
	let status = $state<'idle' | 'loading' | 'error'>('idle');
	let amount = $state(0);
	let category = $state<'income' | 'expense'>('income');
	let description = $state('');
	let date = $state<DateValue>();

	const df = new DateFormatter('en-EN', {
		year: 'numeric',
		month: '2-digit',
		day: '2-digit'
	});

	function resetForm() {
		open = false;
		amount = 0;
		category = 'income';
		description = '';
		date = undefined;
	}

	const convexClient = useConvexClient();

	async function handleSubmit(event: Event) {
		event.preventDefault();
		status = 'loading';

		try {
			if (amount === 0) {
				status = 'error';
				console.error('Amount must be greater than zero');
				return;
			}
			if (date === undefined) {
				console.error('Date is undefined');
				return;
			}
			await convexClient.mutation(api.transactions.createTransaction, {
				amount: Math.abs(amount as number),
				category,
				description,
				date: date?.toDate(getLocalTimeZone()).toISOString().split('T')[0]
			});
			resetForm();
			status = 'idle';
		} catch (error) {
			status = 'error';
			alert(`Error creating transaction: ${error}`);
		}
	}
</script>

<Dialog.Root bind:open>
	<Dialog.Trigger
		type="button"
		class="grid size-12 cursor-pointer place-items-center rounded-full bg-secondary text-secondary-foreground transition hover:bg-primary"
		aria-label="Create Transaction"><AddIcon class="size-6 transition" /></Dialog.Trigger
	>
	<Dialog.Content class="sm:max-w-2xl">
		<form onsubmit={handleSubmit}>
			<Dialog.Header>
				<Dialog.Title>Create Transaction</Dialog.Title>
				<Dialog.Description>Enter the details of your transaction.</Dialog.Description>
			</Dialog.Header>
			<div class="my-4 grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] items-end gap-2">
				<div class="grid grid-cols-2 gap-1 rounded-md bg-muted p-1 font-medium">
					<div>
						<input
							type="radio"
							id="income"
							name="category"
							value="income"
							class="peer hidden"
							disabled={status === 'loading'}
							bind:group={category}
						/>
						<label
							for="income"
							class="flex flex-col gap-1 rounded-sm p-2 text-center text-accent-foreground/50 transition peer-checked:bg-card peer-checked:text-primary peer-disabled:opacity-50"
						>
							Income
						</label>
					</div>
					<div>
						<input
							type="radio"
							id="expense"
							name="category"
							value="expense"
							class="peer hidden"
							disabled={status === 'loading'}
							bind:group={category}
						/>
						<label
							for="expense"
							class="flex flex-col gap-1 rounded-sm p-2 text-center text-accent-foreground/50 transition peer-checked:bg-card peer-checked:text-primary peer-disabled:opacity-50"
						>
							Expense
						</label>
					</div>
				</div>
				<label for="amount" class="flex flex-col gap-1">
					Amount
					<Input
						type="number"
						id="amount"
						bind:value={amount}
						required
						disabled={status === 'loading'}
					/>
				</label>
				<label for="description" class="flex flex-col gap-1">
					Description
					<Input
						type="text"
						id="description"
						bind:value={description}
						required
						disabled={status === 'loading'}
					/>
				</label>
				<label for="date" class="flex flex-col gap-1">
					Date
					<!-- <Input type="date" id="date" bind:value={date} required disabled={status === 'loading'} /> -->
				</label>
				<Popover.Root>
					<Popover.Trigger>
						{#snippet child({ props })}
							<Button
								variant="outline"
								class={cn('justify-start text-start font-normal', !date && 'text-muted-foreground')}
								{...props}
							>
								<CalendarIcon class="me-2 size-4" />
								{date ? df.format(date.toDate(getLocalTimeZone())) : 'Select a date'}
							</Button>
						{/snippet}
					</Popover.Trigger>
					<Popover.Content class="w-auto p-0">
						<Calendar bind:value={date} type="single" initialFocus captionLayout="dropdown" />
					</Popover.Content>
				</Popover.Root>
			</div>
			<Dialog.Footer>
				<Dialog.Close class={buttonVariants({ variant: 'outline' })}>Cancel</Dialog.Close>
				<Button type="submit" variant="secondary" disabled={status === 'loading'}
					>Create Transaction</Button
				>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>
