import type { Handle } from '@sveltejs/kit';
import { createAuth } from '@perfin/backend/convex/auth.ts';
import { getToken } from '@mmailaender/convex-better-auth-svelte/sveltekit';

export const handle: Handle = async ({ event, resolve }) => {
	event.locals.token = await getToken(createAuth, event.cookies);

	return resolve(event);
};

// // src/hooks.server.ts
// export const handle = async ({ event, resolve }) => {
// 	const response = await resolve(event);
// 	response.headers.set('X-Robots-Tag', 'noindex, nofollow');
// 	return response;
// };
