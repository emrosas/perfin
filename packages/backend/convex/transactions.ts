import schema from "./schema";
import { aggregateMonthlyTransactionsByUser } from "./schema";
import { mutation, MutationCtx, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { v } from "convex/values";
import { authComponent } from "./auth";
import type { User } from "better-auth";

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
    userId: string
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

    const id = await ctx.db.insert("transactions", {
      ...args,
      amount: normalizedAmount,
      userId: args.userId
    })

    await ctx.db.patch("accounts", args.accountId, {
      balance: account.balance + normalizedAmount
    })

    const doc = await ctx.db.get(id)
    await aggregateMonthlyTransactionsByUser.insert(ctx, doc!)
    return id;
}

export const applyTransaction = mutation({
  args: {
    amount: schema.tables.transactions.validator.fields.amount,
    description: schema.tables.transactions.validator.fields.description,
    category: schema.tables.transactions.validator.fields.category,
    date: schema.tables.transactions.validator.fields.date,
    accountId: schema.tables.transactions.validator.fields.accountId,
  },
  handler: async (ctx, {amount, description, category, date, accountId}) => {

    const user = await authComponent.getAuthUser(ctx);
    return await createTransaction(ctx, {
      amount,
      description,
      category,
      date,
      accountId,
      userId: user._id
    })
  }
})

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
