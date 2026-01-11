import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { authComponent } from "./auth";

export const getCurrentUserAccounts = query({
  handler: async (ctx) => {
    const user = await authComponent.getAuthUser(ctx);

    if (!user) {
      return null;
    }

    return await ctx.db.query("accounts").withIndex("by_userId", (q) => q.eq("userId", user._id)).collect()
  }
})

export const createAccount = mutation({
  args: {
    name: v.string(),
    balance: v.number()
  },
  handler: async (ctx, {name, balance}) => {
    const user = await authComponent.getAuthUser(ctx)

    return await ctx.db.insert("accounts", {
      userId: user._id,
      name,
      balance
    })
  }
})
