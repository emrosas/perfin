# Split account type into `debit`, `credit`, and `physical`

The original schema modelled account type as `"card" | "physical"`. Debt-tracking for credit cards requires storing APR, PaymentDueDay, and InterestTaxRate — fields that are meaningless on a debit or cash account. Gating these fields by subtype (e.g. a `cardKind: "debit" | "credit"` field inside `type: "card"`) would scatter the conditional logic across the codebase and leave the schema ambiguous about what constitutes a debt-carrying account.

Promoting the distinction to first-class account types (`"debit" | "credit" | "physical"`) makes the contract explicit: only `credit` accounts carry debt fields. UI, validation, and backend logic can branch on a single field without secondary checks.

## Considered options

- **`type: "card" | "physical"` + `cardKind: "debit" | "credit"`** — rejected: two fields to check everywhere, `cardKind` is undefined on `physical` accounts, and the schema doesn't prevent a `physical` account from accidentally carrying debt fields.
- **`isDebt: boolean` flag** — rejected: doesn't distinguish debit from credit cards at the type level; `physical` accounts could still be flagged as debt, which conflates a cash wallet with a credit card.
- **`type: "debit" | "credit" | "physical"`** — chosen: single discriminant, debt fields are naturally scoped to `credit`, existing `"physical"` semantic is preserved unchanged.

Existing `"card"` accounts in the database should be migrated to `"debit"` by default unless the user has configured APR (in which case they are `"credit"`). Since APR did not exist before this change, all existing accounts migrate to `"debit"`.
