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
    type: v.optional(v.union(v.literal("debit"), v.literal("credit"), v.literal("physical"))),
    color: v.optional(v.string()),
    apr: v.optional(v.number()),
    paymentDueDay: v.optional(v.number()),
    interestTaxRate: v.optional(v.number()),
    creditLimit: v.optional(v.number()),
  },
  handler: async (ctx, { name, balance, type, color, apr, paymentDueDay, interestTaxRate, creditLimit }) => {
    const user = await requireAuth(ctx);

    const resolvedType = type ?? "debit";
    const isCredit = resolvedType === "credit";
    // Credit balances represent debt: always store as negative (user inputs amount owed as positive)
    const storedBalance = isCredit ? -Math.abs(balance) : balance;

    return await ctx.db.insert("accounts", {
      userId: user._id,
      name,
      balance: storedBalance,
      type: resolvedType,
      color: color ?? "#3E3BF1",
      apr: isCredit ? apr : undefined,
      paymentDueDay: isCredit ? paymentDueDay : undefined,
      interestTaxRate: isCredit ? interestTaxRate : undefined,
      creditLimit: isCredit ? creditLimit : undefined,
    });
  },
});

export const migrateCardToDebit = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await requireAuth(ctx);
    const accounts = await ctx.db
      .query("accounts")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .collect();
    for (const account of accounts) {
      if (account.type === "card") {
        await ctx.db.patch("accounts", account._id, { type: "debit" });
      }
    }
  },
});

export const updateAccount = mutation({
  args: {
    id: v.id("accounts"),
    name: v.optional(v.string()),
    type: v.optional(v.union(v.literal("debit"), v.literal("credit"), v.literal("physical"))),
    color: v.optional(v.string()),
    balance: v.optional(v.number()),
    apr: v.optional(v.number()),
    paymentDueDay: v.optional(v.number()),
    interestTaxRate: v.optional(v.number()),
    creditLimit: v.optional(v.number()),
  },
  handler: async (ctx, { id, name, type, color, balance, apr, paymentDueDay, interestTaxRate, creditLimit }) => {
    const user = await requireAuth(ctx);
    const account = await ctx.db.get(id);
    if (!account) throw new Error("Account not found");
    if (account.userId !== user._id) throw new ConvexError({ code: "FORBIDDEN" });

    const resolvedType = type ?? account.type;
    const isCredit = resolvedType === "credit";

    const patch: Record<string, unknown> = {};
    if (name !== undefined) patch.name = name;
    if (type !== undefined) patch.type = type;
    if (color !== undefined) patch.color = color;
    if (isCredit) {
      if (apr !== undefined) patch.apr = apr;
      if (paymentDueDay !== undefined) patch.paymentDueDay = paymentDueDay;
      if (interestTaxRate !== undefined) patch.interestTaxRate = interestTaxRate;
      if (creditLimit !== undefined) patch.creditLimit = creditLimit;
    } else {
      patch.apr = undefined;
      patch.paymentDueDay = undefined;
      patch.interestTaxRate = undefined;
      patch.creditLimit = undefined;
    }

    // Credit accounts: set balance directly — adjusting recorded debt is not a financial event.
    // Debit/physical accounts: create a Balance Adjustment transaction to keep history in sync.
    if (balance !== undefined) {
      const newBalance = isCredit ? -Math.abs(balance) : balance;
      if (newBalance !== account.balance) {
        if (isCredit) {
          patch.balance = newBalance;
        } else {
          const difference = newBalance - account.balance;
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
      }
    }

    if (Object.keys(patch).length > 0) {
      await ctx.db.patch("accounts", id, patch);
    }

    return id;
  },
});
