# Perfin

A personal finance management app for tracking accounts, transactions, and budgets.

## Language

**Account**:
A financial account owned by the user. Has one of three types: `debit`, `credit`, or `physical`. Holds a running balance.
_Avoid_: Wallet, card, asset

**DebitAccount**:
An Account of type `debit`. Represents a bank or card account holding money the user owns. Balance is always positive (or zero).
_Avoid_: Card (too generic)

**CreditAccount**:
An Account of type `credit`. Represents a credit card. Balance is negative when the user carries debt (money owed to the card issuer). Carries debt-specific fields: APR, PaymentDueDay, and InterestTaxRate.
_Avoid_: Card (too generic), debt account

**PhysicalAccount**:
An Account of type `physical`. Represents cash or any physical money the user holds.
_Avoid_: Wallet, cash account

**APR** (Annual Percentage Rate):
The yearly interest rate on a CreditAccount, expressed as a percentage (e.g. `24.5` for 24.5%). Used to pre-fill interest charge calculations as `APR ÷ 12 × |balance|`.
_Avoid_: Interest rate (too vague), monthly rate

**PaymentDueDay**:
The day of the month (1–31) on which a CreditAccount's payment is due. Used to surface upcoming payment warnings.
_Avoid_: Due date (implies a full date, not just a day)

**InterestTaxRate**:
An optional per-CreditAccount decimal representing local tax applied on top of interest charges (e.g. `0.16` for Mexico's 16% IVA). Stored on the account so users with cards in multiple countries can set each card independently.
_Avoid_: VAT, tax rate (too generic)

**Transaction**:
A single financial event recorded against one or more accounts. Every transaction belongs to exactly one category.
_Avoid_: Entry, record, payment

**TransactionCategory**:
One of three values: `income`, `expense`, or `transfer`. Determines the sign of the stored amount and which accounts are affected.
_Avoid_: Type, kind, tag

**Income**:
A transaction representing money flowing into an account. Stored as a positive amount.
_Avoid_: Credit (ambiguous with accounting convention)

**Expense**:
A transaction representing money flowing out of an account. Stored as a negative amount.
_Avoid_: Debit (ambiguous with accounting convention), cost

**Transfer**:
A transaction representing movement of money between two of the user's own accounts. Stored as a positive amount on the destination account's transaction record; both accounts' balances are updated atomically.
_Avoid_: Move, internal transfer

**ExpenseCategory**:
A sub-classification of an expense transaction (e.g. food, utilities, transport). Only applies to transactions with category `expense`. Separate from `TransactionCategory`.
_Avoid_: Category (without qualifier — ambiguous with TransactionCategory)

**Balance**:
The current monetary value of an account. Updated atomically whenever a transaction affecting that account is created, edited, or deleted.
_Avoid_: Amount (reserved for the value on a transaction)

**Balance Adjustment**:
A synthetic income or expense transaction automatically created when a user manually sets an account's balance to a new value. The amount is the difference between the new and old balance.
_Avoid_: Manual entry, correction

**Budget**:
A monthly spending limit set by the user for a given ExpenseCategory.
_Avoid_: Limit, cap, allowance

**RecurringPayment**:
A user-defined template for an expense that repeats monthly on a fixed day. Stores the expected amount, the target Account, an optional ExpenseCategory, and the next due date. When confirmed by the user, it creates an Expense Transaction dated the scheduled due date and advances the next due date by one month. When skipped, the next due date advances without creating a Transaction.
_Avoid_: Subscription (too narrow — covers bills and rent too), schedule, recurring expense

**DueRecurringPayment**:
A RecurringPayment whose next due date is today or in the past. Computed on read — not a stored state. Surfaces in the Wallet page as a stacked card prompt for the user to confirm or skip.
_Avoid_: Pending payment (ambiguous with future payment intent)

## Relationships

- An **Account** holds a **Balance** and has many **Transactions**
- A **CreditAccount** carries **APR**, **PaymentDueDay**, and optionally **InterestTaxRate** — no other account type has these fields
- A **CreditAccount**'s negative **Balance** represents the amount currently owed to the card issuer
- A **RecurringPayment** targets one **Account** and, when confirmed, produces one **Transaction**
- A **DueRecurringPayment** is a derived view of a **RecurringPayment** — it is not stored separately
- A **Transaction** belongs to exactly one **Account** (or two, in the case of a **Transfer**)
- A **Transfer** has a source **Account** (`fromAccountId`) and a destination **Account** (`accountId`)
- An **Expense** transaction may have one **ExpenseCategory**
- A **Budget** targets one **ExpenseCategory** for a given calendar month

## Example dialogue

> **Dev:** "When a user moves money between two accounts, do we create two transactions?"
> **Domain expert:** "No — a **Transfer** is one transaction record on the destination account, with `fromAccountId` pointing to the source. Both account **Balances** are updated, but there's only one transaction document."

> **Dev:** "If someone edits a transaction and changes the amount, what happens to the account balance?"
> **Domain expert:** "The old amount is reversed from the old account, and the new amount is applied to the (possibly different) account. The **Balance** always reflects the sum of all transactions."

## Flagged ambiguities

- "amount" can refer to the raw user-input value or the stored signed value — resolved: **amount** on a transaction document is always the normalized signed value (positive for income/transfer, negative for expense). User-input amounts are always positive; the sign is derived from the category at write time.
