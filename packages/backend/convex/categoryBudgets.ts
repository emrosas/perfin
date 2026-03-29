import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { authComponent } from "./auth";

/**
 * Get all category budgets for a given month.
 */
export const getBudgets = query({
  args: { month: v.string() }, // "YYYY-MM"
  handler: async (ctx, { month }) => {
    const user = await authComponent.getAuthUser(ctx);
    return await ctx.db
      .query("categoryBudgets")
      .withIndex("by_user_month", (q) => q.eq("userId", user._id).eq("month", month))
      .collect();
  },
});

/**
 * Get category spending totals for a given month.
 * Returns a map of { [categoryKey]: totalSpent }.
 */
export const getCategorySpending = query({
  args: {
    monthStart: v.string(), // "YYYY-MM-DD"
    monthEnd: v.string(),
  },
  handler: async (ctx, { monthStart, monthEnd }) => {
    const user = await authComponent.getAuthUser(ctx);

    // Get all expense transactions for the month
    // We use the aggregate paginator for consistency but could also do a direct query
    const allTransactions = await ctx.db
      .query("transactions")
      .filter((q) =>
        q.and(
          q.eq(q.field("userId"), user._id),
          q.eq(q.field("category"), "expense"),
          q.gte(q.field("date"), monthStart),
          q.lte(q.field("date"), monthEnd)
        )
      )
      .collect();

    const spending: Record<string, number> = {};
    for (const tx of allTransactions) {
      const cat = tx.expenseCategory ?? "miscellaneous";
      spending[cat] = (spending[cat] ?? 0) + Math.abs(tx.amount);
    }
    return spending;
  },
});

/**
 * Set or update the budget for a category in a given month.
 */
export const setBudget = mutation({
  args: {
    category: v.string(),
    budget: v.number(),
    month: v.string(), // "YYYY-MM"
  },
  handler: async (ctx, { category, budget, month }) => {
    const user = await authComponent.getAuthUser(ctx);

    // Check if a budget already exists for this user/category/month
    const existing = await ctx.db
      .query("categoryBudgets")
      .withIndex("by_user_category_month", (q) =>
        q.eq("userId", user._id).eq("category", category).eq("month", month)
      )
      .first();

    if (existing) {
      await ctx.db.patch("categoryBudgets", existing._id, { budget });
      return existing._id;
    }

    return await ctx.db.insert("categoryBudgets", {
      userId: user._id,
      category,
      budget,
      month,
    });
  },
});

/**
 * Delete a budget for a category in a given month.
 */
export const deleteBudget = mutation({
  args: {
    category: v.string(),
    month: v.string(),
  },
  handler: async (ctx, { category, month }) => {
    const user = await authComponent.getAuthUser(ctx);

    const existing = await ctx.db
      .query("categoryBudgets")
      .withIndex("by_user_category_month", (q) =>
        q.eq("userId", user._id).eq("category", category).eq("month", month)
      )
      .first();

    if (existing) {
      await ctx.db.delete("categoryBudgets", existing._id);
    }
  },
});
