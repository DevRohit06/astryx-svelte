import { REPO_URL } from '$lib/shell/nav-items.js';
import type { PageLoad } from './$types.js';

/**
 * The contributor wall's data, ported from upstream's `fetchContributors()`.
 *
 * **The repository is the whole change.** Upstream fetches
 * `facebook/stylex`'s contributors — its own comment calls StyleX "the public
 * foundation Astryx is built on" and uses it as a stand-in, since the Astryx
 * repo's own list is not public. Reusing that list here would put a wall of
 * StyleX's contributors on a page headed "Build with us", crediting several
 * hundred people who have never touched this port. So it reads *this* repo's
 * contributors, which is the set the page is actually about.
 *
 * **Upstream's Unsplash placeholder fallback is dropped.** It pads the twelve
 * avatar slots with stock portraits whenever the API returns fewer faces, which
 * on a repo this young would mean a wall of strangers photographed for a stock
 * library. An empty wall is the accurate picture of a young port, and the card
 * is composed to read as finished with zero avatars — see `wallCard` in
 * `+page.svelte`.
 *
 * `fetch` is SvelteKit's, not the global: the site prerenders (see the root
 * `+layout.ts`), so this runs once at build time and the result is baked into
 * the page's data. That also means a failed or rate-limited request is a
 * *build-time* event with no runtime cost — and it returns `[]` rather than
 * throwing, because a wall with no faces is a worse page, not a broken one.
 * Upstream's `next: {revalidate: 3600}` has no counterpart; a rebuild is what
 * refreshes the list.
 */
export interface Contributor {
	login: string;
	avatar_url: string;
	contributions: number;
	html_url: string;
}

/** Derived from `REPO_URL` so the two can never name different repositories. */
const REPO_SLUG = REPO_URL.replace('https://github.com/', '');
const CONTRIBUTORS_API = `https://api.github.com/repos/${REPO_SLUG}/contributors?per_page=50`;

export const load: PageLoad = async ({ fetch }) => {
	let contributors: Contributor[] = [];

	try {
		const response = await fetch(CONTRIBUTORS_API);
		if (response.ok) {
			const payload: unknown = await response.json();
			// The API answers `{message: …}` for a 202 or a rate limit as readily as
			// it answers an array, and both arrive with `ok` true.
			if (Array.isArray(payload)) {
				contributors = payload as Contributor[];
			}
		}
	} catch {
		contributors = [];
	}

	return { contributors };
};
