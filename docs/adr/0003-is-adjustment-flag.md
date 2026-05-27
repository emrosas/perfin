# Flag Balance Adjustments with `isAdjustment` instead of matching on description

Balance Adjustments are synthetic `Income` / `Expense` transactions auto-created by `updateAccountBalance` when the user manually overrides an account's balance. They reconcile state — they are not real money flowing in or out. Aggregations like `monthlyIncome` / `monthlyExpense` must exclude them, otherwise opening an account with an existing balance (e.g. a credit card with prior debt) inflates that month's "money out" by the debt amount.

The only existing marker is the literal description string `"Balance adjustment"`, set in `updateAccountBalance`. Filtering on it works but is fragile: any rename, translation, or stray manual transaction with the same description silently breaks the filter, and the breakage is invisible (the aggregate just becomes wrong).

We add `isAdjustment: v.optional(v.boolean())` to the `transactions` schema. `updateAccountBalance` sets it to `true` on the synthetic row. Aggregation queries filter out rows where `isAdjustment === true`. The field is optional so existing rows (including historical adjustments) remain valid without backfill — those historical adjustments will leak into aggregates until they age out of the user's view, which is acceptable.

## Considered options

- **String match on `description === "Balance adjustment"`** — rejected: fragile to renames, translations, and accidental collisions. Filter correctness is invisible to the type system.
- **Backfill `isAdjustment = true` on existing rows by string-matching once** — rejected for now: not worth the migration ceremony for a personal-scale app. Can be done later if the historical leakage becomes a real problem.
- **Separate `balanceAdjustments` table** — rejected: Balance Adjustments need to participate in the same monthly aggregate and transaction list as regular income/expense; splitting tables would duplicate query paths.
