import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { ConvexError } from "convex/values";
import { requireAuth } from "./requireAuth";
import { createTransaction } from "./transactions";

function advanceByOneMonth(dateStr: string): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  const next = new Date(year, month, day); // month is already 1-based, so month is next month's index
  // Clamp to actual month-end
  const lastDay = new Date(year, month + 1, 0).getDate();
  next.setDate(Math.min(day, lastDay));
  return next.toISOString().split("T")[0];
}

function nextOccurrence(dayOfMonth: number, from: string): string {
  const today = new Date(from);
  const year = today.getFullYear();
  const month = today.getMonth();
  const lastDayOfMonth = new Date(year, month + 1, 0).getDate();
  const clampedDay = Math.min(dayOfMonth, lastDayOfMonth);

  if (today.getDate() <= clampedDay) {
    return `${String(year)}-${String(month + 1).padStart(2, "0")}-${String(clampedDay).padStart(2, "0")}`;
  }
  // Next month
  const nextMonth = month + 1;
  const nextYear = nextMonth > 11 ? year + 1 : year;
  const nm = nextMonth % 12;
  const lastDayNext = new Date(nextYear, nm + 1, 0).getDate();
  const d = Math.min(dayOfMonth, lastDayNext);
  return `${String(nextYear)}-${String(nm + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

export const list = query({
  handler: async (ctx) => {
    const user = await requireAuth(ctx);
    return await ctx.db
      .query("recurringPayments")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .order("asc")
      .collect();
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    amount: v.number(),
    accountId: v.id("accounts"),
    expenseCategory: v.optional(v.string()),
    dayOfMonth: v.number(),
  },
  handler: async (ctx, { name, amount, accountId, expenseCategory, dayOfMonth }) => {
    const user = await requireAuth(ctx);
    if (amount <= 0) throw new Error("Amount must be greater than zero");
    if (dayOfMonth < 1 || dayOfMonth > 31) throw new Error("Day of month must be between 1 and 31");

    const account = await ctx.db.get(accountId);
    if (!account || account.userId !== user._id) throw new ConvexError({ code: "FORBIDDEN" });

    const today = new Date().toISOString().split("T")[0];
    const nextDueDate = nextOccurrence(dayOfMonth, today);

    return await ctx.db.insert("recurringPayments", {
      name,
      amount,
      accountId,
      expenseCategory,
      dayOfMonth,
      nextDueDate,
      userId: user._id,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("recurringPayments"),
    name: v.optional(v.string()),
    amount: v.optional(v.number()),
    accountId: v.optional(v.id("accounts")),
    expenseCategory: v.optional(v.string()),
    dayOfMonth: v.optional(v.number()),
  },
  handler: async (ctx, { id, name, amount, accountId, expenseCategory, dayOfMonth }) => {
    const user = await requireAuth(ctx);
    const existing = await ctx.db.get(id);
    if (!existing || existing.userId !== user._id) throw new ConvexError({ code: "FORBIDDEN" });

    if (amount !== undefined && amount <= 0) throw new Error("Amount must be greater than zero");
    if (dayOfMonth !== undefined && (dayOfMonth < 1 || dayOfMonth > 31))
      throw new Error("Day of month must be between 1 and 31");

    if (accountId !== undefined) {
      const account = await ctx.db.get(accountId);
      if (!account || account.userId !== user._id) throw new ConvexError({ code: "FORBIDDEN" });
    }

    const patch: Partial<{
      name: string;
      amount: number;
      accountId: typeof accountId;
      expenseCategory: string | undefined;
      dayOfMonth: number;
      nextDueDate: string;
    }> = {};
    if (name !== undefined) patch.name = name;
    if (amount !== undefined) patch.amount = amount;
    if (accountId !== undefined) patch.accountId = accountId;
    if (expenseCategory !== undefined) patch.expenseCategory = expenseCategory;
    if (dayOfMonth !== undefined) {
      patch.dayOfMonth = dayOfMonth;
      const today = new Date().toISOString().split("T")[0];
      patch.nextDueDate = nextOccurrence(dayOfMonth, today);
    }

    await ctx.db.patch("recurringPayments", id, patch);
    return id;
  },
});

export const remove = mutation({
  args: { id: v.id("recurringPayments") },
  handler: async (ctx, { id }) => {
    const user = await requireAuth(ctx);
    const existing = await ctx.db.get(id);
    if (!existing || existing.userId !== user._id) throw new ConvexError({ code: "FORBIDDEN" });
    await ctx.db.delete("recurringPayments", id);
    return id;
  },
});

export const confirm = mutation({
  args: { id: v.id("recurringPayments") },
  handler: async (ctx, { id }) => {
    const user = await requireAuth(ctx);
    const rp = await ctx.db.get(id);
    if (!rp || rp.userId !== user._id) throw new ConvexError({ code: "FORBIDDEN" });

    await createTransaction(ctx, {
      amount: rp.amount,
      category: "expense",
      description: rp.name,
      date: rp.nextDueDate,
      accountId: rp.accountId,
      userId: user._id,
      expenseCategory: rp.expenseCategory,
    });

    await ctx.db.patch("recurringPayments", id, {
      nextDueDate: advanceByOneMonth(rp.nextDueDate),
    });

    return id;
  },
});

export const skip = mutation({
  args: { id: v.id("recurringPayments") },
  handler: async (ctx, { id }) => {
    const user = await requireAuth(ctx);
    const rp = await ctx.db.get(id);
    if (!rp || rp.userId !== user._id) throw new ConvexError({ code: "FORBIDDEN" });

    await ctx.db.patch("recurringPayments", id, {
      nextDueDate: advanceByOneMonth(rp.nextDueDate),
    });

    return id;
  },
});
