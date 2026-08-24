import type { Handle } from '@sveltejs/kit';
import { createAuth } from '@perfin/backend/convex/auth';
import { getToken } from '@convex-dev/better-auth/utils';
import { JWT_COOKIE_NAME } from '@convex-dev/better-auth/plugins';
import { createCookieGetter } from 'better-auth/cookies';
import { PUBLIC_CONVEX_SITE_URL } from '$env/static/public';

// The Convex JWT cookie only lives 15 minutes, but the Better Auth session
// behind it lives a week. A missing JWT means "stale", not "signed out", so
// mint a fresh one off the session cookie rather than bouncing to login —
// otherwise backgrounding the app on mobile logs you out.
const createCookie = createCookieGetter(createAuth({} as never).options);
const jwtCookieName = createCookie(JWT_COOKIE_NAME).name;

// Refresh this far ahead of expiry so a token can't die mid-request.
const REFRESH_MARGIN_SECONDS = 60;

function secondsUntilExpiry(token: string): number | undefined {
	const payload = token.split('.')[1];
	if (!payload) return;
	try {
		const { exp } = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
		return typeof exp === 'number' ? exp - Math.floor(Date.now() / 1000) : undefined;
	} catch {
		return;
	}
}

export const handle: Handle = async ({ event, resolve }) => {
	const cached = event.cookies.get(jwtCookieName);

	if (cached && (secondsUntilExpiry(cached) ?? 0) > REFRESH_MARGIN_SECONDS) {
		event.locals.token = cached;
		return resolve(event);
	}

	const { token } = await getToken(
		PUBLIC_CONVEX_SITE_URL,
		new Headers({ cookie: event.request.headers.get('cookie') ?? '' })
	);

	event.locals.token = token;

	// Persist the new token so the next request reads it from the cookie
	// instead of hitting Convex again.
	const maxAge = token ? secondsUntilExpiry(token) : undefined;
	if (token && maxAge && maxAge > 0) {
		const cookie = createCookie(JWT_COOKIE_NAME, { maxAge });
		event.cookies.set(cookie.name, token, {
			...cookie.attributes,
			path: '/'
		} as Parameters<typeof event.cookies.set>[2]);
	}

	return resolve(event);
};

// // src/hooks.server.ts
// export const handle = async ({ event, resolve }) => {
// 	const response = await resolve(event);
// 	response.headers.set('X-Robots-Tag', 'noindex, nofollow');
// 	return response;
// };
