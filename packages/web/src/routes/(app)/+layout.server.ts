import { requireLogin } from '$lib/server/auth';
import { createConvexHttpClient } from '@mmailaender/convex-better-auth-svelte/sveltekit';
import { api } from '@perfin/backend/convex/_generated/api';
import type { PageServerLoad } from '../$types';

export const load: PageServerLoad = async () => {
	const token = requireLogin();

	const client = createConvexHttpClient({ token });
	const currentUser = await client.query(api.auth.getCurrentUser, {});

	return { currentUser };
};
