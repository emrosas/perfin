import { v } from "convex/values";
import { ConvexError } from "convex/values";
import { query, mutation } from "./_generated/server";
import { authComponent } from "./auth";
import { requireAuth } from "./requireAuth";
import { createTransaction } from "./transactions";

export const getCurrentUserAccounts = query({
  handler: async (ctx) => {
    let user;
    try {
      user = await authComponent.getAuthUser(ctx);
    } catch {
      return null;
    }

    if (!user) return null;

    return await ctx.db
      .query("accounts")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .collect();
  },
});

export const createAccount = mutation({
  args: {
    name: v.string(),
    balance: v.number(),
    type: v.optional(v.union(v.literal("card"), v.literal("physical"))),
    color: v.optional(v.string()),
  },
  handler: async (ctx, { name, balance, type, color }) => {
    const user = await requireAuth(ctx);

    return await ctx.db.insert("accounts", {
      userId: user._id,
      name,
      balance,
      type: type ?? "card",
      color: color ?? "#3E3BF1",
    });
  },
});

export const updateAccount = mutation({
  args: {
    id: v.id("accounts"),
    name: v.optional(v.string()),
    type: v.optional(v.union(v.literal("card"), v.literal("physical"))),
    color: v.optional(v.string()),
    balance: v.optional(v.number()),
  },
  handler: async (ctx, { id, name, type, color, balance }) => {
    const user = await requireAuth(ctx);
    const account = await ctx.db.get(id);
    if (!account) throw new Error("Account not found");
    if (account.userId !== user._id) throw new ConvexError({ code: "FORBIDDEN" });

    const patch: Record<string, unknown> = {};
    if (name !== undefined) patch.name = name;
    if (type !== undefined) patch.type = type;
    if (color !== undefined) patch.color = color;

    // Handle balance change — createTransaction owns the insert, balance patch, and aggregate sync
    if (balance !== undefined && balance !== account.balance) {
      const difference = balance - account.balance;
      const today = new Date().toISOString().split("T")[0];
      const category = difference > 0 ? "income" : "expense";

      await createTransaction(ctx, {
        amount: difference,
        category,
        description: "Balance adjustment",
        date: today,
        accountId: id,
        userId: user._id,
      });
    }

    if (Object.keys(patch).length > 0) {
      await ctx.db.patch("accounts", id, patch);
    }

    return id;
  },
});
