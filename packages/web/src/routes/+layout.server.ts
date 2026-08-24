import type { LayoutServerLoad } from './$types';

// Mirrors the token the hook resolved, so SSR auth state can't disagree with
// the route guards in $lib/server/auth.
export const load: LayoutServerLoad = async ({ locals }) => {
	return { authState: { isAuthenticated: !!locals.token } };
};
