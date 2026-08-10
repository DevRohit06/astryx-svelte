/**
 * Everything the site claims about itself, in one place.
 *
 * Titles, descriptions, canonical URLs, social cards and the sitemap all read
 * from here, so the site cannot describe itself two ways. Before this existed
 * each route hand-wrote a `<title>` and, at best, a description — no canonical,
 * no social card, and a landing page whose description was the repository's
 * one-line summary.
 *
 * ## On the copy
 *
 * Two rules, and they pull against each other in a useful way.
 *
 * The **parity rule does not apply here.** This is the port's own site, not a
 * surface with an upstream counterpart to match; component prose is a different
 * matter and stays verbatim from the `.doc.mjs` modules.
 *
 * But the port's *character* does apply. What makes this project worth writing
 * about is not that it has 101 components — it is that the components are
 * checked against upstream's compiled output rather than reviewed. So the copy
 * leads with the verification, states counts as measured facts, and never
 * promises polish it has not earned. Every number below is one a script prints.
 */

/** No trailing slash — every URL in this module is built by appending a path. */
export const SITE_URL = 'https://astryx-svelte.rohitk06.in';

export const SITE_NAME = 'astryx-svelte';

/**
 * The one-line answer to "what is this", used as the home page's `<title>`
 * suffix and as the social card's site name.
 */
export const SITE_TAGLINE = 'Svelte 5 components, ported from Meta’s Astryx';

/**
 * The default meta description. ~155 characters, because that is roughly where
 * search results truncate, and it leads with the thing that is true of nothing
 * else in this space: the port is *checked*, not asserted.
 */
export const SITE_DESCRIPTION =
	'Open source Svelte 5 components ported 1:1 from Astryx, Meta’s design system — ' +
	'101 components, 8 themes, and a compiler-level diff proving they match upstream.';

/** Absolute URL of the social card image. */
export const SITE_OG_IMAGE = `${SITE_URL}/og.png`;

export const GITHUB_URL = 'https://github.com/devrohit06/astryx-svelte';

export const UPSTREAM_URL = 'https://astryx.atmeta.com/';

/**
 * Counts quoted in marketing copy. Kept here rather than inline so a stale
 * number is a single edit, and so it is obvious that these are claims the repo
 * has to keep true. Each is printed by something: `pnpm -r test` for the oracle
 * figures, the content generator for the rest.
 */
export const FACTS = {
	components: 101,
	themes: 8,
	tokens: 184,
	/** Style keys the class oracle checks against upstream's compiled output. */
	styleKeys: 1528,
	/** Atomic classes shared with upstream's published stylesheet, 0 differing. */
	sharedClasses: 1463
} as const;

/** An absolute URL for `path`, which must start with `/`. */
export function absolute(path: string): string {
	return path === '/' ? `${SITE_URL}/` : `${SITE_URL}${path}`;
}
