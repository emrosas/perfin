import schema from "./schema";
import {  aggregateMonthlyBalanceByUser } from "./schema";
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const getTransactions = query({
  args: {},
  handler: async (ctx) => {
    const transactions = await ctx.db.query("transactions").collect();
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
  args: { transaction: schema.tables.transactions.validator },
  handler: async (ctx, {transaction}) => {
    if (transaction.amount === 0) {
      throw new Error("Amount must be greater than zero");
    }
    const id = await ctx.db.insert("transactions", {
      ...transaction,
      amount: transaction.category === "income" ? Math.abs(transaction.amount) : -Math.abs(transaction.amount),
    })
    const doc = await ctx.db.get(id)
    await  aggregateMonthlyBalanceByUser.insert(ctx, doc!)
    return id;
  }
})

export const deleteTransaction = mutation({
  args: { id: v.id("transactions") },
  handler: async (ctx, {id}) => {
    const doc = await ctx.db.get(id)
    await aggregateMonthlyBalanceByUser.deleteIfExists(ctx, doc!)
    await ctx.db.delete("transactions", id);
    return id;
  }
})
