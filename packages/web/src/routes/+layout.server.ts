import type { LayoutServerLoad } from './(app)/$types';
import { createAuth } from '@perfin/backend/convex/auth';
import { getAuthState } from '@mmailaender/convex-better-auth-svelte/sveltekit';

export const load: LayoutServerLoad = async ({ cookies }) => {
	const authState = await getAuthState(createAuth, cookies);
	return { authState };
};
