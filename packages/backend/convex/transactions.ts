import schema from "./schema";
import { aggregateMonthlyTransactionsByUser } from "./schema";
import { mutation, MutationCtx, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { v } from "convex/values";
import { authComponent } from "./auth";
import type { User } from "better-auth";

export const getById = query({
  args: { id: v.id("transactions") },
  handler: async (ctx, { id }) => {
    const user = await authComponent.getAuthUser(ctx);
    const doc = await ctx.db.get(id);
    if (!doc || doc.userId !== user._id) return null;
    return doc;
  },
});

export const listByAccount = query({
  args: {
    accountId: v.id("accounts"),
  },
  handler: async (ctx, { accountId }) => {
    const user = await authComponent.getAuthUser(ctx);

    const account = await ctx.db.get(accountId);
    if (!account || account.userId !== user._id) {
      throw new Error("Account not found");
    }

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
    monthEnd: v.string()
  },
  handler: async (ctx, {monthStart, monthEnd}) => {
    const user = await authComponent.getAuthUser(ctx);


    const page = await aggregateMonthlyTransactionsByUser.paginate(ctx, {
      bounds: {
        lower: {key: monthStart, inclusive: true},
        upper: {key: monthEnd, inclusive: true}
      },
      namespace: user._id,
      order: "desc",
      pageSize: 100
    })
    const transactions = await Promise.all(page.page.map((doc) => ctx.db.get(doc.id)))
    return transactions
  },
});

export const updateAccountBalance = mutation({
  args: {
    id: v.id("accounts"),
    balance: v.number()
  },
  handler: async (ctx, {id, balance}) => {
    const user = await authComponent.getAuthUser(ctx);
    const account = await ctx.db.get(id);

    if (!account) {
      throw new Error("Account not found");
    }

    const difference = balance - account.balance;

    if (difference === 0) {
      return balance;
    }

    const today = new Date().toISOString().split('T')[0];
    const category = difference > 0 ? "income" : "expense";

    return await createTransaction(ctx, {
      amount: difference,
      category,
      description: "Balance adjustment",
      date: today,
      accountId: id,
      userId: user._id
    });
  }
});

async function createTransaction(
  ctx: MutationCtx,
  args: {
    amount: number,
    description: string,
    category: "income" | "expense",
    date: string,
    accountId: Id<"accounts">
    userId: string,
    expenseCategory?: string,
  }
) {
    if (args.amount === 0) {
      throw new Error("Amount must be greater than zero");
    }

    const account = await ctx.db.get(args.accountId)

    if (account === null) {
      throw new Error("Account not found");
    }

    const normalizedAmount = args.category === "income" ? Math.abs(args.amount) : -Math.abs(args.amount);

    const insertDoc: any = {
      amount: normalizedAmount,
      category: args.category,
      description: args.description,
      date: args.date,
      accountId: args.accountId,
      userId: args.userId,
    };
    if (args.expenseCategory) {
      insertDoc.expenseCategory = args.expenseCategory;
    }
    const id = await ctx.db.insert("transactions", insertDoc)

    await ctx.db.patch("accounts", args.accountId, {
      balance: account.balance + normalizedAmount
    })

    const doc = await ctx.db.get(id)
    await aggregateMonthlyTransactionsByUser.insert(ctx, doc!)
    return id;
}

export const applyTransfer = mutation({
  args: {
    amount: v.number(),
    description: v.string(),
    date: v.string(),
    fromAccountId: v.id("accounts"),
    toAccountId: v.id("accounts"),
  },
  handler: async (ctx, { amount, description, date, fromAccountId, toAccountId }) => {
    const user = await authComponent.getAuthUser(ctx);

    if (fromAccountId === toAccountId) {
      throw new Error("From and to accounts must be different");
    }
    if (amount <= 0) {
      throw new Error("Amount must be greater than zero");
    }

    const fromAccount = await ctx.db.get(fromAccountId);
    const toAccount = await ctx.db.get(toAccountId);
    if (!fromAccount || fromAccount.userId !== user._id) throw new Error("From account not found");
    if (!toAccount || toAccount.userId !== user._id) throw new Error("To account not found");

    // Debit source
    await ctx.db.patch("accounts", fromAccountId, { balance: fromAccount.balance - amount });
    // Credit destination
    await ctx.db.patch("accounts", toAccountId, { balance: toAccount.balance + amount });

    // Single transaction record; accountId = destination
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
  handler: async (ctx, {amount, description, category, date, accountId, expenseCategory}) => {

    const user = await authComponent.getAuthUser(ctx);
    return await createTransaction(ctx, {
      amount,
      description,
      category,
      date,
      accountId,
      userId: user._id,
      expenseCategory: category === "expense" ? expenseCategory : undefined,
    })
  }
})

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
    const user = await authComponent.getAuthUser(ctx);
    const existing = await ctx.db.get(id);

    if (!existing) {
      throw new Error("Transaction not found");
    }

    if (existing.userId !== user._id) {
      throw new Error("Not authorized");
    }

    // Reverse old transaction's effect on old account
    const oldAccount = await ctx.db.get(existing.accountId);
    if (!oldAccount) {
      throw new Error("Old account not found");
    }
    await ctx.db.patch("accounts", existing.accountId, {
      balance: oldAccount.balance - existing.amount,
    });

    // Remove old aggregate entry
    await aggregateMonthlyTransactionsByUser.deleteIfExists(ctx, existing);

    // Compute new normalized amount
    const normalizedAmount = category === "income" ? Math.abs(amount) : -Math.abs(amount);

    // Apply new transaction's effect on (possibly different) account
    const newAccount = existing.accountId === accountId
      ? { ...oldAccount, balance: oldAccount.balance - existing.amount }
      : await ctx.db.get(accountId);

    if (!newAccount) {
      throw new Error("New account not found");
    }
    await ctx.db.patch("accounts", accountId, {
      balance: newAccount.balance + normalizedAmount,
    });

    // Update the transaction document
    await ctx.db.patch("transactions", id, {
      amount: normalizedAmount,
      description,
      category,
      date,
      accountId,
      expenseCategory: category === "expense" ? expenseCategory : undefined,
    });

    // Re-insert aggregate entry with updated data
    const updated = await ctx.db.get(id);
    await aggregateMonthlyTransactionsByUser.insert(ctx, updated!);

    return id;
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
    const user = await authComponent.getAuthUser(ctx);
    const existing = await ctx.db.get(id);
    if (!existing || existing.userId !== user._id) throw new Error("Transaction not found");
    if (existing.category !== "transfer") throw new Error("Not a transfer transaction");
    if (fromAccountId === toAccountId) throw new Error("Accounts must be different");
    if (amount <= 0) throw new Error("Amount must be greater than zero");

    const oldFromId = existing.fromAccountId as Id<"accounts">;
    const oldToId = existing.accountId;

    // Reverse original transfer
    const oldFrom = await ctx.db.get(oldFromId);
    const oldTo = await ctx.db.get(oldToId);
    if (!oldFrom || !oldTo) throw new Error("Original accounts not found");
    await ctx.db.patch("accounts", oldFromId, { balance: oldFrom.balance + existing.amount });
    await ctx.db.patch("accounts", oldToId, { balance: oldTo.balance - existing.amount });

    // Remove old aggregate entry
    await aggregateMonthlyTransactionsByUser.deleteIfExists(ctx, existing);

    // Apply new transfer
    const newFrom = oldFromId === fromAccountId
      ? { ...oldFrom, balance: oldFrom.balance + existing.amount }
      : await ctx.db.get(fromAccountId);
    const newTo = oldToId === toAccountId
      ? { ...oldTo, balance: oldTo.balance - existing.amount }
      : await ctx.db.get(toAccountId);
    if (!newFrom || !newTo) throw new Error("New accounts not found");

    await ctx.db.patch("accounts", fromAccountId, { balance: newFrom.balance - amount });
    await ctx.db.patch("accounts", toAccountId, { balance: newTo.balance + amount });

    await ctx.db.patch("transactions", id, {
      amount,
      description,
      date,
      accountId: toAccountId,
      fromAccountId,
    });

    const updated = await ctx.db.get(id);
    await aggregateMonthlyTransactionsByUser.insert(ctx, updated!);
    return id;
  },
});

export const deleteTransaction = mutation({
  args: { id: v.id("transactions") },
  handler: async (ctx, {id}) => {

    const transaction = await ctx.db.get(id)

    if (transaction === null) {
      throw new Error("Transaction not found");
    }

    await ctx.db.delete("transactions", id);
    await aggregateMonthlyTransactionsByUser.deleteIfExists(ctx, transaction)

    const account = await ctx.db.get(transaction.accountId)

    if (account === null) {
      throw new Error("Account not found");
    }

    await ctx.db.patch("accounts", transaction.accountId, {
      balance: account.balance - transaction.amount
    })

    return id;
  }
})
