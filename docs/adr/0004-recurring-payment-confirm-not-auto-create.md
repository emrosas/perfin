# RecurringPayments require user confirmation; due state is computed, not stored

## Decision

A RecurringPayment does not automatically create Transactions. When its `nextDueDate` is today or in the past, it surfaces as a DueRecurringPayment — computed on read — and the user confirms or skips each occurrence. Confirming creates the Transaction dated the scheduled due date and advances `nextDueDate` by one month. Skipping advances `nextDueDate` without creating a Transaction.

## Why computed, not stored

Storing a separate "pending" document (e.g. a `pendingRecurringPayments` table populated by a cron job) introduces a secondary source of truth that can drift from the RecurringPayment itself. A query over `recurringPayments` where `nextDueDate <= today` produces the same result with zero additional state and no scheduled function. The derived view is always consistent.

## Why confirm, not auto-create

Auto-creating Transactions requires a reliable background job, and silently posts amounts that may be wrong (price changes, failed charges, cancelled subscriptions). Since the confirm form pre-fills the scheduled amount and lets the user adjust before posting, it handles variable charges without extra schema complexity, and keeps the user in the loop without requiring them to remember to log anything.

## Considered options

- **Auto-create via Convex scheduler** — rejected: silent errors if amount is wrong; adds operational complexity for V1 with no material UX gain, since the confirm tap is a single action.
- **Stored pending table** — rejected: redundant state; the computed approach is always correct by definition.
- **Sequential one-at-a-time prompts** — rejected in favour of a stacked card UI that surfaces all overdue items at once, letting the user work through them in one session.
