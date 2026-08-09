import * as stylex from '@stylexjs/stylex';
import { sx, type StyleArg, type SvelteStyleAttrs } from '../../internal/sx.js';
import {
	colorVars,
	fontWeightVars,
	spacingVars,
	typeScaleVars
} from '../../styles/tokens.stylex.js';

/**
 * Ported from Astryx's `TopNav/TopNavMegaMenuFeaturedCard.tsx` styles.
 *
 * The standard card for `TopNavMegaMenu`'s `featured` slot. The slot itself
 * stays open — a caller can pass anything — so this is a convenience, not a
 * requirement, which is why the card owns no surface of its own: the background
 * and radius come from the mega menu's `featured` container around it.
 */
const styles = stylex.create({
	root: {
		display: 'flex',
		flexDirection: 'column'
	},
	image: {
		width: '100%',
		height: 140,
		objectFit: 'cover' as const,
		display: 'block'
	},
	body: {
		display: 'flex',
		flexDirection: 'column',
		gap: spacingVars['--spacing-2'],
		padding: spacingVars['--spacing-4']
	},
	title: {
		fontSize: typeScaleVars['--text-label-size'],
		fontWeight: fontWeightVars['--font-weight-semibold'],
		lineHeight: typeScaleVars['--text-label-leading'],
		color: colorVars['--color-text-primary']
	},
	description: {
		fontSize: typeScaleVars['--text-supporting-size'],
		lineHeight: typeScaleVars['--text-supporting-leading'],
		color: colorVars['--color-text-secondary']
	},
	link: {
		fontSize: typeScaleVars['--text-supporting-size'],
		fontWeight: fontWeightVars['--font-weight-semibold'],
		lineHeight: typeScaleVars['--text-supporting-leading'],
		color: colorVars['--color-text-accent'],
		textDecoration: 'none'
	}
});

/** The card root. */
export function featuredCardAttrs(xstyle: StyleArg): SvelteStyleAttrs {
	return sx(styles.root, xstyle);
}

/** The optional cover image above the body. */
export function featuredCardImageAttrs(): SvelteStyleAttrs {
	return sx(styles.image);
}

/** The padded text column. */
export function featuredCardBodyAttrs(): SvelteStyleAttrs {
	return sx(styles.body);
}

/** The card title. */
export function featuredCardTitleAttrs(): SvelteStyleAttrs {
	return sx(styles.title);
}

/** The description line below the title. */
export function featuredCardDescriptionAttrs(): SvelteStyleAttrs {
	return sx(styles.description);
}

/** The trailing call-to-action link. */
export function featuredCardLinkAttrs(): SvelteStyleAttrs {
	return sx(styles.link);
}
