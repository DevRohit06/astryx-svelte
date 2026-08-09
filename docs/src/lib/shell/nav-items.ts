/**
 * The site's navigation data, kept apart from the components that render it.
 *
 * Upstream's `SharedTopNav.tsx` carries `NAV_ITEMS` and `SiteFooter.tsx` carries
 * `FOOTER_LINKS` / `SOCIAL_LINKS`. Both lists are trimmed to the routes that
 * exist, and linking to a 404 is worse than not linking, so a missing route is
 * absent rather than dead.
 *
 * `/templates` and `/themes` are now built, so both lists carry them in
 * upstream's slot and with upstream's label. Still absent: `/playground` (a
 * `svelte/compiler` Web Worker, deliberately last — TODO.md → Phase 5),
 * `/blog` and `/community` (Meta's content and Meta's accounts) and
 * `/changelog` (this port has published no release, so there is nothing for the
 * page to read; upstream's renders each package's `CHANGELOG.md`).
 *
 * The links that *are* here keep upstream's labels and order.
 */

import { componentsHref, templatesHref, themesHref, topicHref } from './links.js';

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
	{ label: 'Themes', href: themesHref(), activeOn: ['/themes'] }
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
 * Who ported it, for the footer's attribution line.
 *
 * The line follows the shape shadcn-svelte uses — "Built by shadcn. Ported to
 * Svelte by Huntabyte." — which is the established convention for a port's
 * docs site: credit upstream first, then the port, then link the source.
 */
export const AUTHOR_NAME = 'DevRohit06';
export const AUTHOR_URL = 'https://github.com/DevRohit06';
