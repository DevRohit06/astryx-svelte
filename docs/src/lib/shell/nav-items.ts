/**
 * The site's navigation data, kept apart from the components that render it.
 *
 * Upstream's `SharedTopNav.tsx` carries `NAV_ITEMS` and `SiteFooter.tsx` carries
 * `FOOTER_LINKS` / `SOCIAL_LINKS`. Both lists are trimmed to the routes that
 * exist, and linking to a 404 is worse than not linking, so a missing route is
 * absent rather than dead.
 *
 * `/templates`, `/themes`, `/community` and `/blog` are now built, so both lists
 * carry them in upstream's slot and with upstream's label. Still absent:
 * `/playground` (a `svelte/compiler` Web Worker, deliberately last — port/todo.md →
 * Phase 5) and `/changelog` (this port has published no release, so there is
 * nothing for the page to read; upstream's renders each package's
 * `CHANGELOG.md`).
 *
 * **`/blog` was on that absent list as "Meta's posts", and that reasoning only
 * ever applied to the content.** The blog *surface* is upstream's and ports like
 * anything else — the frontmatter schema, the validator and the discovery order
 * are its own `posts.mjs`, ported verbatim. Upstream's seven posts are Meta's
 * prose and are not portable, so this blog starts with one post of its own.
 * Upstream carries Blog in the top nav and the footer alike, which this port's
 * single merged list gives it in one entry.
 *
 * **`/community` was on that absent list, for the reason "Meta's content and
 * Meta's accounts".** Half of that reason still holds and the page is built
 * anyway: it exists here with its links retargeted rather than copied. Anything
 * a reader would *act* on — file a bug, open a PR, read the contribution guide —
 * points at `REPO_URL`, because a Svelte bug filed on `facebook/astryx` is filed
 * against different software. Anything that is a *system of record* — the Astryx
 * docs, the API Conventions and API Arbitration wiki pages — still points
 * upstream and says so in its label, because those define the API this port must
 * match. Meta's brand accounts (Facebook, Instagram, Threads, X) are still not
 * shipped, exactly as `site-footer.svelte` refuses them; Discord is kept,
 * because it is the design system's community server rather than a marketing
 * channel. Six channels upstream, three here.
 *
 * **A note on where `/community` sits.** Upstream carries it in its *footer*
 * list only — its top nav's fifth item is `/playground`, which this port does
 * not have. This file publishes one list to both surfaces, so the entry lands in
 * upstream's footer slot (after Themes) and the top nav gains a fifth item where
 * upstream's fifth is a route that is absent here. Splitting the two lists to
 * hide it from the top nav would trade a visible page for an invisible one.
 *
 * The links that *are* here keep upstream's labels and order.
 */

import { communityHref, componentsHref, templatesHref, themesHref, topicHref } from './links.js';

export interface NavItem {
	label: string;
	href: string;
	/** Pathname prefixes that mark this item active. */
	activeOn: string[];
}

export const NAV_ITEMS: NavItem[] = [
	{ label: 'Docs', href: topicHref('getting-started'), activeOn: ['/docs'] },
	{ label: 'Components', href: componentsHref(), activeOn: ['/components'] },
	{ label: 'Templates', href: templatesHref(), activeOn: ['/templates'] },
	{ label: 'Themes', href: themesHref(), activeOn: ['/themes'] },
	{ label: 'Blog', href: '/blog', activeOn: ['/blog'] },
	{ label: 'Community', href: communityHref(), activeOn: ['/community'] }
];

export const FOOTER_LINKS: NavItem[] = NAV_ITEMS;

/** Whether `pathname` sits inside `item`. */
export function isActive(item: NavItem, pathname: string): boolean {
	return item.activeOn.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

/**
 * This port's own repository. Upstream's nav points at
 * `github.com/facebook/astryx`, which documents the React library rather than
 * this one — the parity rule is about the *component API*, and a link that
 * sends a reader to different software is not parity.
 */
export const REPO_URL = 'https://github.com/devrohit06/astryx-svelte';

/** Upstream's, kept: it is where the design system itself is documented. */
export const UPSTREAM_URL = 'https://astryx.atmeta.com/';

/**
 * Upstream's wiki, kept for the same reason `UPSTREAM_URL` is.
 *
 * `/community` links two pages under it — **API Conventions** and **API
 * Arbitration** — and those are the one class of link that must *not* be
 * retargeted at this repo: they are the specification of how an Astryx component
 * is named, shaped and composed, which is precisely what the parity rule binds
 * this port to. There is no Svelte-side copy of them and there should not be
 * one; a fork of the spec is how two systems drift apart. Every consumer labels
 * them as upstream so a reader knows the page they land on documents React.
 */
export const UPSTREAM_WIKI_URL = 'https://github.com/facebook/astryx/wiki';

/**
 * The Astryx community server — upstream's `DISCORD_URL`, unretargeted.
 *
 * The only survivor of upstream's six social channels. The other five are Meta's
 * brand accounts and this port ships none of them (see `site-footer.svelte`);
 * this one is where the design system's users actually talk to each other, and
 * there is no Svelte-side equivalent to send them to instead.
 */
export const DISCORD_URL = 'https://discord.com/invite/XnsUcFykEP';

/**
 * Who ported it, for the footer's attribution line.
 *
 * The line follows the shape shadcn-svelte uses — "Built by shadcn. Ported to
 * Svelte by Huntabyte." — which is the established convention for a port's
 * docs site: credit upstream first, then the port, then link the source.
 */
export const AUTHOR_NAME = 'DevRohit06';
export const AUTHOR_URL = 'https://github.com/DevRohit06';
