import { ConvexError } from "convex/values";
import { authComponent } from "./auth";
import type { QueryCtx, MutationCtx } from "./_generated/server";

type AuthUser = Awaited<ReturnType<typeof authComponent.getAuthUser>>;

/**
 * Resolves the authenticated user for the current request. Throws
 * `ConvexError({ code: "UNAUTHENTICATED" })` if no valid session exists.
 *
 * Call at the top of any query or mutation that requires a logged-in user.
 * For handlers that should return `null` rather than throw when unauthenticated
 * (e.g. layout queries), use `authComponent.getAuthUser` directly with a try/catch.
 */
export async function requireAuth(ctx: QueryCtx | MutationCtx): Promise<AuthUser> {
  try {
    return await authComponent.getAuthUser(ctx);
  } catch {
    throw new ConvexError({ code: "UNAUTHENTICATED" });
  }
}
