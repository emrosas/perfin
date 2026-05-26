/**
 * The three categories a transaction can belong to.
 *
 * - `"income"` — money coming in; stored as a positive amount.
 * - `"expense"` — money going out; stored as a negative amount.
 * - `"transfer"` — movement between accounts; always stored as a positive
 *   amount on the destination account's transaction record.
 */
export type TransactionCategory = "income" | "expense" | "transfer";

/**
 * Normalizes a transaction amount based on its category.
 *
 * Income amounts are stored as positive numbers; expense amounts are stored
 * as negative numbers. The input sign is ignored — the category alone
 * determines the sign of the result.
 *
 * Transfers carry a positive amount by convention and are not handled here.
 * Use `applyTransfer` on the backend for transfer transactions.
 *
 * @param amount - The raw amount. The absolute value is taken before signing.
 * @param category - `"income"` or `"expense"`. Passing `"transfer"` is a type error.
 * @returns The signed amount ready to persist.
 *
 * @example
 * normalizeAmount(50, "income")  // → 50
 * normalizeAmount(50, "expense") // → -50
 * normalizeAmount(-50, "income") // → 50  (sign is ignored)
 */
export function normalizeAmount(
  amount: number,
  category: Exclude<TransactionCategory, "transfer">,
): number {
  return category === "income" ? Math.abs(amount) : -Math.abs(amount);
}

/**
 * Normalizes a balance difference into a signed transaction amount.
 *
 * Use when creating a balance-adjustment transaction from the delta between
 * a new and an old balance. A positive difference (balance increased) maps
 * to income; a negative difference (balance decreased) maps to expense.
 *
 * Callers are responsible for guarding against a zero difference — a
 * zero-amount transaction is meaningless and should not be persisted.
 *
 * @param difference - `newBalance - oldBalance`.
 * @returns The signed amount ready to persist.
 *
 * @example
 * normalizeBalanceDifference(100)  // → 100  (income)
 * normalizeBalanceDifference(-40)  // → -40  (expense)
 */
export function normalizeBalanceDifference(difference: number): number {
  return normalizeAmount(Math.abs(difference), difference >= 0 ? "income" : "expense");
}
