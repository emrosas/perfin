import { redirect } from '@sveltejs/kit';
import { getRequestEvent } from '$app/server';

export function requireLogin() {
	const { locals, url } = getRequestEvent();

	if (!locals.token) {
		const params = new URLSearchParams({ redirectTo: url.pathname + url.search });
		throw redirect(307, `/?${params.toString()}`);
	}

	return locals.token;
}
