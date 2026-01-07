import { query } from "./_generated/server";
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
