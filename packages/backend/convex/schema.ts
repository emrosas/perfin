import { TableAggregate } from "@convex-dev/aggregate";
import {components} from "./_generated/api";
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { DataModel } from "./_generated/dataModel";

export default defineSchema({
  transactions: defineTable({
    amount: v.number(),
    category: v.union(v.literal("income"), v.literal("expense")),
    description: v.string(),
    date: v.string(),
    accountId: v.id("accounts"),
    userId: v.string(),
    expenseCategory: v.optional(v.string()),
  }).index("by_accountId", ["accountId"]),
  accounts: defineTable({
    name: v.string(),
    balance: v.number(),
    userId: v.string(),
    type: v.optional(v.union(v.literal("card"), v.literal("physical"))),
    color: v.optional(v.string()),
  }).index("by_userId", ["userId"]),
  categoryBudgets: defineTable({
    userId: v.string(),
    category: v.string(),
    budget: v.number(),
    month: v.string(), // "YYYY-MM"
  })
    .index("by_user_month", ["userId", "month"])
    .index("by_user_category_month", ["userId", "category", "month"]),
})


// export const aggregateMonthlyBalanceByUser = new TableAggregate<{
//   Namespace: string;
//   Key: string;
//   DataModel: DataModel;
//   TableName: "transactions";
// }>(components.aggregateMonthlyBalanceByUser, {
//   sortKey: (doc) => doc.date,
//   sumValue: (doc) => doc.amount,
//   namespace: (doc) => doc.userId
// })

export const aggregateMonthlyTransactionsByUser = new TableAggregate<{
  Namespace: string;
  Key: string;
  DataModel: DataModel;
  TableName: "transactions";
}>(components.aggregateMonthlyTransactionsByUser, {
  sortKey: (doc) => doc.date,
  sumValue: (doc) => doc.amount,
  namespace: (doc) => doc.userId
})
