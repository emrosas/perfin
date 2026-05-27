# Use `ConvexError` with structured codes for auth failures

Auth failures throw `ConvexError({ code: "UNAUTHENTICATED" | "FORBIDDEN" })` rather than plain `Error` strings. `ConvexError` data survives the Convex network boundary intact, so the frontend can inspect `err.data.code` and route to the right behavior (redirect to login vs. show an access-denied message) without pattern-matching error strings.

Two codes are in use:

- `UNAUTHENTICATED` — no valid session. Thrown by `requireAuth(ctx)`. Frontend should redirect to `/`.
- `FORBIDDEN` — valid session but the resource belongs to a different user. Thrown inline in mutation handlers after an ownership check. Frontend should show an error message, not redirect.

All other errors (validation failures, not-found, business rule violations) use plain `throw new Error(...)` — these are surfaced to the user as generic error messages and do not need structured handling.
