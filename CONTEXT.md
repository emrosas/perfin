# Perfin

A personal finance management app for tracking accounts, transactions, and budgets.

## Language

**Account**:
A financial account owned by the user (e.g. a bank account, credit card, or cash wallet). Holds a running balance.
_Avoid_: Wallet, card, asset

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

## Relationships

- An **Account** holds a **Balance** and has many **Transactions**
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
