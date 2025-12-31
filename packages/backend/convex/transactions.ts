import schema from "./schema";
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const getTransactions = query({
  args: {},
  handler: async (ctx) => {
    const transactions = await ctx.db.query("transactions").collect();
    return transactions
  },
});

export const createTransaction = mutation({
  args: { transaction: schema.tables.transactions.validator },
  handler: async (ctx, {transaction}) => {
    if (transaction.amount <= 0) {
      throw new Error("Amount must be greater than zero");
    }
    return await ctx.db.insert("transactions", {
      ...transaction
    })
  }
})

export const deleteTransaction = mutation({
  args: { id: v.id("transactions") },
  handler: async (ctx, {id}) => {
    await ctx.db.delete("transactions", id);
    return id;
  }
})
