import schema from "./schema";
import {  aggregateMonthlyBalanceByUser, aggregateMonthlyTransactionsByUser } from "./schema";
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { authComponent, createAuth } from "./auth";

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
      pageSize: 100
    })
    const transactions = await Promise.all(page.page.map((doc) => ctx.db.get(doc.id)))
    return transactions
  },
});

export const getMonthlyBalance = query({
  args: { monthStart: v.string(), monthEnd: v.string() },
  handler: async (ctx, { monthStart, monthEnd }) => {
    return await aggregateMonthlyBalanceByUser.sum(ctx, {
      bounds: {
        lower: {key: monthStart, inclusive: true},
        upper: {key: monthEnd, inclusive: true}
      }
    })
  }
})

export const createTransaction = mutation({
  args: {
    amount: schema.tables.transactions.validator.fields.amount,
    description: schema.tables.transactions.validator.fields.description,
    category: schema.tables.transactions.validator.fields.category,
    date: schema.tables.transactions.validator.fields.date,
  },
  handler: async (ctx, params) => {

    if (params.amount === 0) {
      throw new Error("Amount must be greater than zero");
    }

    const user = await authComponent.getAuthUser(ctx);

    const id = await ctx.db.insert("transactions", {
      ...params,
      amount: params.category === "income" ? Math.abs(params.amount) : -Math.abs(params.amount),
      userId: user._id
    })
    const doc = await ctx.db.get(id)
    await  aggregateMonthlyBalanceByUser.insert(ctx, doc!)
    await aggregateMonthlyTransactionsByUser.insert(ctx, doc!)
    return id;
  }
})

export const deleteTransaction = mutation({
  args: { id: v.id("transactions") },
  handler: async (ctx, {id}) => {
    const doc = await ctx.db.get(id)
    await aggregateMonthlyBalanceByUser.deleteIfExists(ctx, doc!)
    await aggregateMonthlyTransactionsByUser.deleteIfExists(ctx, doc!)
    await ctx.db.delete("transactions", id);
    return id;
  }
})
