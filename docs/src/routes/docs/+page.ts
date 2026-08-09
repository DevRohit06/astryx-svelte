import { redirect } from '@sveltejs/kit';
import { topicHref } from '$lib/shell/links.js';
import type { PageLoad } from './$types.js';

/**
 * `/docs` has no page of its own — it reroutes to the Getting Started guide,
 * exactly as upstream's `DocsIndexPage` does with Next's `redirect()`.
 *
 * Without this the route simply 404s, which is what it did here: the sidebar
 * and footer only ever link to `/docs/<topic>`, so nothing in the site surfaced
 * the gap, but `/docs` is the URL a reader types or trims to.
 *
 * 307 rather than 308 to match the status Next's `redirect()` sends, and
 * because the destination is a *default* topic rather than a permanent home for
 * this URL — if the guide is ever renamed, no browser has cached the old target
 * forever.
 */
export const prerender = true;

export const load: PageLoad = () => {
	redirect(307, topicHref('getting-started'));
};
