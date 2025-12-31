// src/hooks.server.ts
export const handle = async ({ event, resolve }) => {
	const response = await resolve(event);
	response.headers.set('X-Robots-Tag', 'noindex, nofollow');
	return response;
};
