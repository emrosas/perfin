import schema from "./schema";
import { aggregateMonthlyTransactionsByUser } from "./schema";
import { mutation, MutationCtx, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { v } from "convex/values";
import { ConvexError } from "convex/values";
import { requireAuth } from "./requireAuth";
import { normalizeAmount, type TransactionCategory } from "@perfin/shared";

export const getById = query({
  args: { id: v.id("transactions") },
  handler: async (ctx, { id }) => {
    const user = await requireAuth(ctx);
    const doc = await ctx.db.get(id);
    if (!doc || doc.userId !== user._id) return null;
    return doc;
  },
});

export const listByAccount = query({
  args: { accountId: v.id("accounts") },
  handler: async (ctx, { accountId }) => {
    const user = await requireAuth(ctx);
    const account = await ctx.db.get(accountId);
    if (!account || account.userId !== user._id) throw new ConvexError({ code: "FORBIDDEN" });

    return await ctx.db
      .query("transactions")
      .withIndex("by_accountId", (q) => q.eq("accountId", accountId))
      .order("desc")
      .collect();
  },
});

export const listMonthlyTransactions = query({
  args: {
    monthStart: v.string(),
    monthEnd: v.string(),
  },
  handler: async (ctx, { monthStart, monthEnd }) => {
    const user = await requireAuth(ctx);

    const page = await aggregateMonthlyTransactionsByUser.paginate(ctx, {
      bounds: {
        lower: { key: monthStart, inclusive: true },
        upper: { key: monthEnd, inclusive: true },
      },
      namespace: user._id,
      order: "desc",
      pageSize: 100,
    });
    return Promise.all(page.page.map((doc) => ctx.db.get(doc.id)));
  },
});

export const getMonthlySummary = query({
  args: {
    monthStart: v.string(),
    monthEnd: v.string(),
  },
  handler: async (ctx, { monthStart, monthEnd }) => {
    const user = await requireAuth(ctx);

    const rows = await ctx.db
      .query("transactions")
      .withIndex("by_user_date", (q) =>
        q.eq("userId", user._id).gte("date", monthStart).lte("date", monthEnd)
      )
      .collect();

    let monthlyIncome = 0;
    let monthlyExpense = 0;
    for (const tx of rows) {
      if (tx.isAdjustment) continue;
      if (tx.category === "income") monthlyIncome += tx.amount;
      else if (tx.category === "expense") monthlyExpense += Math.abs(tx.amount);
    }
    return { monthlyIncome, monthlyExpense };
  },
});

// ─── Internal helpers ────────────────────────────────────────────────────────
//
// These own the full lifecycle of each operation: db write, balance patch, and
// aggregate sync. Public mutations are thin shells that handle auth and
// validation, then delegate here.

/**
 * Inserts an income or expense transaction, patches the account balance, and
 * syncs the monthly aggregate. The amount sign is derived from `category` —
 * the caller's sign is ignored.
 */
export async function createTransaction(
  ctx: MutationCtx,
  args: {
    amount: number;
    description: string;
    category: "income" | "expense";
    date: string;
    accountId: Id<"accounts">;
    userId: string;
    expenseCategory?: string;
    isAdjustment?: boolean;
  }
): Promise<Id<"transactions">> {
  if (args.amount === 0) throw new Error("Amount must be greater than zero");

  const account = await ctx.db.get(args.accountId);
  if (!account) throw new Error("Account not found");

  const normalizedAmount = normalizeAmount(args.amount, args.category);

  const insertDoc: any = {
    amount: normalizedAmount,
    category: args.category,
    description: args.description,
    date: args.date,
    accountId: args.accountId,
    userId: args.userId,
  };
  if (args.expenseCategory) insertDoc.expenseCategory = args.expenseCategory;
  if (args.isAdjustment) insertDoc.isAdjustment = true;

  const id = await ctx.db.insert("transactions", insertDoc);
  await ctx.db.patch("accounts", args.accountId, { balance: account.balance + normalizedAmount });

  const doc = await ctx.db.get(id);
  await aggregateMonthlyTransactionsByUser.insert(ctx, doc!);
  return id;
}

/**
 * Reverses an existing income/expense transaction's balance effect, applies
 * the updated values, and re-syncs the aggregate. Handles account changes
 * (moving a transaction to a different account).
 */
export async function patchTransaction(
  ctx: MutationCtx,
  args: {
    id: Id<"transactions">;
    amount: number;
    description: string;
    category: Exclude<TransactionCategory, "transfer">;
    date: string;
    accountId: Id<"accounts">;
    expenseCategory?: string;
  }
): Promise<Id<"transactions">> {
  const existing = await ctx.db.get(args.id);
  if (!existing) throw new Error("Transaction not found");

  const oldAccount = await ctx.db.get(existing.accountId);
  if (!oldAccount) throw new Error("Account not found");

  // Reverse old balance effect and drop from aggregate
  await ctx.db.patch("accounts", existing.accountId, {
    balance: oldAccount.balance - existing.amount,
  });
  await aggregateMonthlyTransactionsByUser.deleteIfExists(ctx, existing);

  const normalizedAmount = normalizeAmount(args.amount, args.category);

  // If accountId changed, fetch the new account; otherwise use the post-reversal balance
  const newAccount =
    existing.accountId === args.accountId
      ? { ...oldAccount, balance: oldAccount.balance - existing.amount }
      : await ctx.db.get(args.accountId);
  if (!newAccount) throw new Error("New account not found");

  await ctx.db.patch("accounts", args.accountId, {
    balance: newAccount.balance + normalizedAmount,
  });

  await ctx.db.patch("transactions", args.id, {
    amount: normalizedAmount,
    description: args.description,
    category: args.category,
    date: args.date,
    accountId: args.accountId,
    expenseCategory: args.category === "expense" ? args.expenseCategory : undefined,
  });

  const updated = await ctx.db.get(args.id);
  await aggregateMonthlyTransactionsByUser.insert(ctx, updated!);
  return args.id;
}

/**
 * Reverses an existing transfer's balance effects on both accounts, applies
 * the updated values, and re-syncs the aggregate. Handles account changes.
 */
export async function patchTransfer(
  ctx: MutationCtx,
  args: {
    id: Id<"transactions">;
    amount: number;
    description: string;
    date: string;
    fromAccountId: Id<"accounts">;
    toAccountId: Id<"accounts">;
  }
): Promise<Id<"transactions">> {
  const existing = await ctx.db.get(args.id);
  if (!existing) throw new Error("Transaction not found");

  const oldFromId = existing.fromAccountId as Id<"accounts">;
  const oldToId = existing.accountId;

  const oldFrom = await ctx.db.get(oldFromId);
  const oldTo = await ctx.db.get(oldToId);
  if (!oldFrom || !oldTo) throw new Error("Original accounts not found");

  // Reverse original transfer and drop from aggregate
  await ctx.db.patch("accounts", oldFromId, { balance: oldFrom.balance + existing.amount });
  await ctx.db.patch("accounts", oldToId, { balance: oldTo.balance - existing.amount });
  await aggregateMonthlyTransactionsByUser.deleteIfExists(ctx, existing);

  // If account IDs changed, fetch fresh; otherwise use post-reversal balances
  const newFrom =
    oldFromId === args.fromAccountId
      ? { ...oldFrom, balance: oldFrom.balance + existing.amount }
      : await ctx.db.get(args.fromAccountId);
  const newTo =
    oldToId === args.toAccountId
      ? { ...oldTo, balance: oldTo.balance - existing.amount }
      : await ctx.db.get(args.toAccountId);
  if (!newFrom || !newTo) throw new Error("New accounts not found");

  await ctx.db.patch("accounts", args.fromAccountId, { balance: newFrom.balance - args.amount });
  await ctx.db.patch("accounts", args.toAccountId, { balance: newTo.balance + args.amount });

  await ctx.db.patch("transactions", args.id, {
    amount: args.amount,
    description: args.description,
    date: args.date,
    accountId: args.toAccountId,
    fromAccountId: args.fromAccountId,
  });

  const updated = await ctx.db.get(args.id);
  await aggregateMonthlyTransactionsByUser.insert(ctx, updated!);
  return args.id;
}

/**
 * Deletes a transaction, reverses its balance effect on all affected accounts,
 * and removes it from the aggregate. Handles both regular transactions and
 * transfers (which affect two accounts).
 */
export async function removeTransaction(
  ctx: MutationCtx,
  id: Id<"transactions">
): Promise<Id<"transactions">> {
  const transaction = await ctx.db.get(id);
  if (!transaction) throw new Error("Transaction not found");

  await aggregateMonthlyTransactionsByUser.deleteIfExists(ctx, transaction);
  await ctx.db.delete("transactions", id);

  // Reverse destination (or regular) account balance
  const account = await ctx.db.get(transaction.accountId);
  if (!account) throw new Error("Account not found");
  await ctx.db.patch("accounts", transaction.accountId, {
    balance: account.balance - transaction.amount,
  });

  // For transfers, also reverse the source account's debit
  if (transaction.category === "transfer" && transaction.fromAccountId) {
    const fromAccount = await ctx.db.get(transaction.fromAccountId as Id<"accounts">);
    if (!fromAccount) throw new Error("Source account not found");
    await ctx.db.patch("accounts", transaction.fromAccountId as Id<"accounts">, {
      balance: fromAccount.balance + transaction.amount,
    });
  }

  return id;
}

// ─── Public mutations ─────────────────────────────────────────────────────────
//
// Auth and validation only — all business logic lives in the helpers above.

export const updateAccountBalance = mutation({
  args: {
    id: v.id("accounts"),
    balance: v.number(),
  },
  handler: async (ctx, { id, balance }) => {
    const user = await requireAuth(ctx);
    const account = await ctx.db.get(id);
    if (!account) throw new Error("Account not found");
    if (account.userId !== user._id) throw new ConvexError({ code: "FORBIDDEN" });

    const difference = balance - account.balance;
    if (difference === 0) return balance;

    const today = new Date().toISOString().split("T")[0];
    const category = difference > 0 ? "income" : "expense";

    return createTransaction(ctx, {
      amount: difference,
      category,
      description: "Balance adjustment",
      date: today,
      accountId: id,
      userId: user._id,
      isAdjustment: true,
    });
  },
});

export const applyTransfer = mutation({
  args: {
    amount: v.number(),
    description: v.string(),
    date: v.string(),
    fromAccountId: v.id("accounts"),
    toAccountId: v.id("accounts"),
  },
  handler: async (ctx, { amount, description, date, fromAccountId, toAccountId }) => {
    const user = await requireAuth(ctx);
    if (fromAccountId === toAccountId) throw new Error("From and to accounts must be different");
    if (amount <= 0) throw new Error("Amount must be greater than zero");

    const fromAccount = await ctx.db.get(fromAccountId);
    const toAccount = await ctx.db.get(toAccountId);
    if (!fromAccount || fromAccount.userId !== user._id) throw new ConvexError({ code: "FORBIDDEN" });
    if (!toAccount || toAccount.userId !== user._id) throw new ConvexError({ code: "FORBIDDEN" });

    await ctx.db.patch("accounts", fromAccountId, { balance: fromAccount.balance - amount });
    await ctx.db.patch("accounts", toAccountId, { balance: toAccount.balance + amount });

    const id = await ctx.db.insert("transactions", {
      amount,
      category: "transfer",
      description,
      date,
      accountId: toAccountId,
      fromAccountId,
      userId: user._id,
    });

    const doc = await ctx.db.get(id);
    await aggregateMonthlyTransactionsByUser.insert(ctx, doc!);
    return id;
  },
});

export const applyTransaction = mutation({
  args: {
    amount: schema.tables.transactions.validator.fields.amount,
    description: schema.tables.transactions.validator.fields.description,
    category: v.union(v.literal("income"), v.literal("expense")),
    date: schema.tables.transactions.validator.fields.date,
    accountId: schema.tables.transactions.validator.fields.accountId,
    expenseCategory: v.optional(v.string()),
  },
  handler: async (ctx, { amount, description, category, date, accountId, expenseCategory }) => {
    const user = await requireAuth(ctx);
    return createTransaction(ctx, {
      amount,
      description,
      category,
      date,
      accountId,
      userId: user._id,
      expenseCategory: category === "expense" ? expenseCategory : undefined,
    });
  },
});

export const updateTransaction = mutation({
  args: {
    id: v.id("transactions"),
    amount: schema.tables.transactions.validator.fields.amount,
    description: schema.tables.transactions.validator.fields.description,
    category: schema.tables.transactions.validator.fields.category,
    date: schema.tables.transactions.validator.fields.date,
    accountId: schema.tables.transactions.validator.fields.accountId,
    expenseCategory: v.optional(v.string()),
  },
  handler: async (ctx, { id, amount, description, category, date, accountId, expenseCategory }) => {
    const user = await requireAuth(ctx);
    const existing = await ctx.db.get(id);
    if (!existing || existing.userId !== user._id) throw new ConvexError({ code: "FORBIDDEN" });
    return patchTransaction(ctx, {
      id,
      amount,
      description,
      category: category as Exclude<TransactionCategory, "transfer">,
      date,
      accountId,
      expenseCategory,
    });
  },
});

export const updateTransfer = mutation({
  args: {
    id: v.id("transactions"),
    amount: v.number(),
    description: v.string(),
    date: v.string(),
    fromAccountId: v.id("accounts"),
    toAccountId: v.id("accounts"),
  },
  handler: async (ctx, { id, amount, description, date, fromAccountId, toAccountId }) => {
    const user = await requireAuth(ctx);
    const existing = await ctx.db.get(id);
    if (!existing || existing.userId !== user._id) throw new ConvexError({ code: "FORBIDDEN" });
    if (existing.category !== "transfer") throw new Error("Not a transfer transaction");
    if (fromAccountId === toAccountId) throw new Error("Accounts must be different");
    if (amount <= 0) throw new Error("Amount must be greater than zero");
    return patchTransfer(ctx, { id, amount, description, date, fromAccountId, toAccountId });
  },
});

export const deleteTransaction = mutation({
  args: { id: v.id("transactions") },
  handler: async (ctx, { id }) => {
    const user = await requireAuth(ctx);
    const existing = await ctx.db.get(id);
    if (!existing || existing.userId !== user._id) throw new ConvexError({ code: "FORBIDDEN" });
    return removeTransaction(ctx, id);
  },
});
