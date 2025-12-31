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
    date: v.string()
  })
})

export const aggregateMonthlyBalanceByUser = new TableAggregate<{
  Key: string;
  DataModel: DataModel;
  TableName: "transactions";
}>(components.aggregateMonthlyBalanceByUser, {
  sortKey: (doc) => doc.date,
  sumValue: (doc) => doc.amount,
})
