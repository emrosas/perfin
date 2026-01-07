import schema from "./schema";
import { aggregateMonthlyTransactionsByUser } from "./schema";
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { authComponent } from "./auth";

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

// export const getMonthlyBalance = query({
//   args: { monthStart: v.string(), monthEnd: v.string() },
//   handler: async (ctx, { monthStart, monthEnd }) => {
//     const user = await authComponent.getAuthUser(ctx);

//     if (!user) {
//       return null;
//     }

//     return await aggregateMonthlyBalanceByUser.sum(ctx, {
//       bounds: {
//         lower: {key: monthStart, inclusive: true},
//         upper: {key: monthEnd, inclusive: true}
//       },
//       namespace: user._id
//     })
//   }
// })

export const createTransaction = mutation({
  args: {
    amount: schema.tables.transactions.validator.fields.amount,
    description: schema.tables.transactions.validator.fields.description,
    category: schema.tables.transactions.validator.fields.category,
    date: schema.tables.transactions.validator.fields.date,
    accountId: schema.tables.transactions.validator.fields.accountId,
  },
  handler: async (ctx, params) => {

    if (params.amount === 0) {
      throw new Error("Amount must be greater than zero");
    }

    const account = await ctx.db.get(params.accountId)

    if (account === null) {
      throw new Error("Account not found");
    }

    const user = await authComponent.getAuthUser(ctx);

    const id = await ctx.db.insert("transactions", {
      ...params,
      amount: params.category === "income" ? Math.abs(params.amount) : -Math.abs(params.amount),
      userId: user._id
    })

    await ctx.db.patch("accounts", params.accountId, {
      balance: account.balance + params.amount
    })

    const doc = await ctx.db.get(id)
    await aggregateMonthlyTransactionsByUser.insert(ctx, doc!)
    return id;
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
