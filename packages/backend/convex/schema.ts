import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  transactions: defineTable({
    amount: v.number(),
    category: v.union(v.literal("income"), v.literal("expense")),
    date: v.string()
  })
})
