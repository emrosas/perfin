# Use `requireAuth(ctx)` inline call over a handler wrapper pattern

Convex mutation and query handlers are typed via generic inference from the `args` validator defined alongside the handler. When a wrapper function (e.g. `withAuth(handler)`) is applied at the call site, TypeScript resolves the handler's generic type parameters *before* the outer `mutation({args, handler})` context is applied — so the wrapper sees the args type as `unknown`. This causes `ctx.db.get(id)` to return a union of all table document types rather than the specific one, breaking type safety throughout the handler body.

The correct pattern for this codebase is an inline async call at the top of the handler:

```ts
handler: async (ctx, args) => {
  const user = await requireAuth(ctx); // throws ConvexError({ code: "UNAUTHENTICATED" }) if no session
  // ...
}
```

`requireAuth` lives in `convex/requireAuth.ts`. Do not reintroduce a wrapper function pattern — the limitation is in TypeScript's inference order, not in the implementation of the wrapper.

## Considered options

- **Handler wrapper** (`withAuth(async (ctx, user, args) => {...})`) — rejected: TypeScript infers `args: unknown` at the wrapper call site, losing all arg types.
- **Inject user into context** (`{ ...ctx, user }`) — same inference problem; TypeScript can't propagate the args generic through the enriched context type.
